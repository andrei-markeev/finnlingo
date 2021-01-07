'use strict';

import assert from "assert";
import ts from "typescript";
import _ from "underscore";

import {
  getDefaultCompilerOptions,
  convertCompilerOptionsOrThrow,
  validateTsConfig,
  presetCompilerOptions,
} from "./options";

import CompileService, { createCSResult } from "./compile-service";
import ServiceHost from "./compile-service-host";
import sourceHost from "./files-source-host";
import { CompileCache, FileHashCache } from "./cache";

import logger from "./logger";
import { deepHash } from "./utils";
import { getExcludeRegExp } from "./ts-utils";
import { RefsChangeType, evalRefsChangeMap } from './refs';

let compileCache, fileHashCache;
export function setCacheDir(cacheDir) {
  if (compileCache && compileCache.cacheDir === cacheDir) {
    return;
  }

  compileCache = new CompileCache(cacheDir);
  fileHashCache = new FileHashCache(cacheDir);
}

function getConvertedDefault(arch) {
  return convertCompilerOptionsOrThrow(
    getDefaultCompilerOptions(arch));
}

function isES6Target(target) {
  return /es6/i.test(target) || /es2015/i.test(target);
}

function evalCompilerOptions(arch, opt) {
  const defOpt = getDefaultCompilerOptions(arch);
  const resOpt = opt || defOpt;

  _.defaults(resOpt, defOpt);
  // Add target to the lib since
  // if target: "es6" and lib: ["es5"],
  // it won't compile properly.
  if (resOpt.target) {
    resOpt.lib.push(resOpt.target);
  }
  resOpt.lib = _.union(resOpt.lib, defOpt.lib);

  // Impose use strict for ES6 target.
  if (opt && opt.noImplicitUseStrict !== undefined) {
    if (isES6Target(resOpt.target)) {
      resOpt.noImplicitUseStrict = false;
    }
  }

  return resOpt;
}

function lazyInit() {
  if (! compileCache) {
    setCacheDir();
  }
}

// A map of TypeScript Language Services
// per each Meteor architecture.
const serviceMap = {};
function getCompileService(arch) {
  if (! arch) arch = "global";
  if (serviceMap[arch]) return serviceMap[arch];

  const serviceHost = new ServiceHost(fileHashCache);
  const service = new CompileService(serviceHost);
  serviceMap[arch] = service;
  return service;
}

/**
 * Class that represents an incremental TypeScript build (compilation).
 * For the typical usage in a Meteor compiler plugin,
 * see a TypeScript compiler that based on this NPM:
 * https://github.com/barbatus/typescript-compiler/blob/master/typescript-compiler.js#L58
 *
 * @param filePaths Paths of the files to compile.
 * @param getFileContent Method that takes a file path
 *  and returns that file's content. To be used to pass file contents
 *  from a Meteor compiler plugin to the TypeScript compiler.
 * @param options Object with the options of the TypeSctipt build.
 *   Available options:
 *    - compilerOptions: TypeScript compiler options
 *    - arch: Meteor file architecture
 *    - useCache: whether to use cache 
 */
export class TSBuild {
  constructor(filePaths, getFileContent, options = {}) {
    logger.debug("new build");

    const compilerOptions = evalCompilerOptions(
      options.arch, options.compilerOptions);
    let resOptions = { ...options, compilerOptions };
    resOptions = validateAndConvertOptions(resOptions);
    resOptions.compilerOptions = presetCompilerOptions(
      resOptions.compilerOptions);
    this.options = resOptions;

    lazyInit();

    sourceHost.setSource(getFileContent);

    const pset = logger.newProfiler("set files");
    const compileService = getCompileService(resOptions.arch);
    const serviceHost = compileService.getHost();
    serviceHost.setFiles(filePaths, resOptions);
    pset.end();

    const prefs = logger.newProfiler("refs eval");
    this.refsChangeMap = evalRefsChangeMap(filePaths,
      (filePath) => serviceHost.isFileChanged(filePath),
      (filePath) => {
        const csResult = compileCache.getResult(filePath,
          this.getFileOptions(filePath));
        return csResult ? csResult.dependencies : null;
      }, resOptions.evalDepth || 1);
    prefs.end();
  }

  getFileOptions(filePath) {
    // Omit arch to avoid re-compiling same files aimed for diff arch.
    // Prepare file options which besides general ones
    // should contain a module name.
    const options = _.omit(this.options, "arch", "useCache", "evalDepth");
    const module = options.compilerOptions.module;
    const moduleName = module === "none" ? null :
      ts.removeFileExtension(filePath);
    return { options, moduleName };
  }

  emit(filePath) {
    logger.debug("emit file %s", filePath);

    const options = this.options;
    const compileService = getCompileService(options.arch);

    const serviceHost = compileService.getHost();
    if (!serviceHost.hasFile(filePath)) {
      throw new Error(`File ${filePath} not found`);
    }

    const csOptions = this.getFileOptions(filePath);

    function compile() {
      const pcomp = logger.newProfiler(`compile ${filePath}`);
      const result = compileService.compile(filePath, csOptions.moduleName);
      pcomp.end();
      return result;
    }

    const useCache = options.useCache;
    if (useCache === false) {
      return compile();
    }

    const isTypingsChanged = serviceHost.isTypingsChanged();
    const pget = logger.newProfiler("compileCache get");
    const result = compileCache.get(filePath, csOptions, (cacheResult) => {
      if (!cacheResult) {
        logger.debug("cache miss: %s", filePath);
        return compile();
      }

      const refsChange = this.refsChangeMap[filePath];

      // Referenced files have changed, which may need recompilation in some cases.
      // See https://github.com/Urigo/angular2-meteor/issues/102#issuecomment-191411701
      if (refsChange === RefsChangeType.FILES) {
        logger.debug("recompile: %s", filePath);
        return compile();
      }

      // Diagnostics re-evaluation.
      // First case: file is not changed but contains unresolved modules
      // error from previous build (some node modules might have installed).
      // Second case: dependency modules or typings have changed.
      const csResult = createCSResult(filePath, cacheResult);
      const tsDiag = csResult.diagnostics;
      const unresolved = tsDiag.hasUnresolvedModules();
      if (unresolved || refsChange !== RefsChangeType.NONE || isTypingsChanged) {
        logger.debug("diagnostics re-evaluation: %s", filePath);
        const pdiag = logger.newProfiler("diags update");
        csResult.upDiagnostics(
          compileService.getDiagnostics(filePath));
        pdiag.end();
        return csResult;
      }

      // Cached result is up to date, no action required.
      logger.debug("file from cached: %s", filePath);
      return null;
    });
    pget.end();

    return result;
  }
}

export function compile(fileContent, options = {}) {
  if (typeof fileContent !== "string") {
    throw new Error("fileContent should be a string");
  }

  let optPath = options.filePath;
  if (!optPath) {
    optPath = deepHash(fileContent, options);
    const tsx = options.compilerOptions && options.compilerOptions.jsx;
    optPath += tsx ? ".tsx" : ".ts";
  }

  const getFileContent = (filePath) => {
    if (filePath === optPath) {
      return fileContent;
    }
  };

  const newBuild = new TSBuild([optPath], getFileContent, options);
  return newBuild.emit(optPath);
};

const validOptions = {
  "compilerOptions": "Object",
  // Next three to be used mainly
  // in the compile method above.
  "filePath": "String",
  "typings": "Array",
  "arch": "String",
  "useCache": "Boolean",
  "evalDepth": "Number",
};
const validOptionsMsg =
  "Valid options are compilerOptions, filePath, and typings.";

function checkType(option, optionName) {
  if (!option) return true;

  return option.constructor.name === validOptions[optionName];
}

export function validateAndConvertOptions(options) {
  if (!options) return null;

  // Validate top level options.
  for (const option in options) {
    if (options.hasOwnProperty(option)) {
      if (validOptions[option] === undefined) {
        throw new Error(`Unknown option: ${option}.\n${validOptionsMsg}`);
      }

      if (! checkType(options[option], option)) {
        throw new Error(`${option} should be of type ${validOptions[option]}`);
      }
    }
  }

  const resOptions = _.clone(options);
  // Validate and convert compilerOptions.
  if (options.compilerOptions) {
    resOptions.compilerOptions = convertCompilerOptionsOrThrow(
      options.compilerOptions);
  }

  return resOptions;
}

export function getDefaultOptions(arch) {
  return {
    compilerOptions: getDefaultCompilerOptions(arch),
  };
}

exports.validateTsConfig = validateTsConfig;

exports.getExcludeRegExp = getExcludeRegExp;
