const async = Npm.require('async');
const path = Npm.require('path');
const fs = Npm.require('fs');
const Future = Npm.require('fibers/future');

import {
  TSBuild,
  validateTsConfig,
  getExcludeRegExp,
} from './meteor-typescript';

import {
  getExtendedPath,
  isDeclaration,
  isMainConfig,
  isServerConfig,
  isBare,
  getES6ModuleName,
  WarnMixin,
  extendFiles,
  isWeb,
} from './file-utils';

import {
  getShallowHash,
} from './utils';

// Default exclude paths.
const defExclude = new RegExp(
  getExcludeRegExp(['node_modules/**']));

// What to exclude when compiling for the server.
// typings/main and typings/browser seem to be not used
// at all but let keep them for just in case.
const exlWebRegExp = new RegExp(
  getExcludeRegExp(['typings/main/**', 'typings/main.d.ts']));

// What to exclude when compiling for the client.
const exlMainRegExp = new RegExp(
  getExcludeRegExp(['typings/browser/**', 'typings/browser.d.ts']));

const COMPILER_REGEXP = /(\.d.ts|\.ts|\.tsx|\.tsconfig)$/;

const TS_REGEXP = /(\.ts|\.tsx)$/;

TypeScriptCompiler = class TypeScriptCompiler {
  constructor(extraOptions, maxParallelism) {
    TypeScript.validateExtraOptions(extraOptions);

    this.extraOptions = extraOptions;
    this.maxParallelism = maxParallelism || 10;
    this.serverOptions = null;
    this.tsconfig = TypeScript.getDefaultOptions();
    this.cfgHash = null;
    this.diagHash = new Set;
    this.archSet = new Set;
  }

  getFilesToProcess(inputFiles) {
    const pexclude = Logger.newProfiler('exclude');

    inputFiles = this._filterByDefault(inputFiles);

    this._processConfig(inputFiles);

    inputFiles = this._filterByConfig(inputFiles);

    if (inputFiles.length) {
      const arch = inputFiles[0].getArch();
      inputFiles = this._filterByArch(inputFiles, arch);
    }

    pexclude.end();

    return inputFiles;
  }

  getBuildOptions(inputFiles) {
    this._processConfig(inputFiles);

    const inputFile = inputFiles[0];
    let { compilerOptions } = this.tsconfig;
    // Make a copy.
    compilerOptions = Object.assign({}, compilerOptions);
    if (! isWeb(inputFile) && this.serverOptions) {
      Object.assign(compilerOptions, this.serverOptions);
    }

    // Apply extra options.
    if (this.extraOptions) {
      Object.assign(compilerOptions, this.extraOptions);
    }

    const arch = inputFile.getArch();
    const { typings, useCache } = this.tsconfig;
    return { arch, compilerOptions, typings, useCache };
  }

  processFilesForTarget(inputFiles, getDepsContent) {
    extendFiles(inputFiles, WarnMixin);

    const options = this.getBuildOptions(inputFiles);
    Logger.log('compiler options: %j', options.compilerOptions);

    inputFiles = this.getFilesToProcess(inputFiles);

    if (! inputFiles.length) return;

    const pcompile = Logger.newProfiler('compilation');
    const filePaths = inputFiles.map(file => getExtendedPath(file));
    Logger.log('compile files: %s', filePaths);

    const pbuild = Logger.newProfiler('tsBuild');
    const defaultGet = this._getContentGetter(inputFiles);
    const getContent = filePath =>
      (getDepsContent && getDepsContent(filePath)) || defaultGet(filePath);
    const tsBuild = new TSBuild(filePaths, getContent, options);
    pbuild.end();

    const pfiles = Logger.newProfiler('tsEmitFiles');
    const future = new Future;
    // Don't emit typings.
    const compileFiles = inputFiles.filter(file => ! isDeclaration(file));
    let throwSyntax = false;
    const results = new Map();
    async.eachLimit(compileFiles, this.maxParallelism, (file, done) => {
      const co = options.compilerOptions;

      const filePath = getExtendedPath(file);
      const pemit = Logger.newProfiler('tsEmit');
      const result = tsBuild.emit(filePath);
      results.set(file, result);
      pemit.end();

      throwSyntax = throwSyntax | 
        this._processDiagnostics(file, result.diagnostics, co);

      done();
    }, future.resolver());

    pfiles.end();

    future.wait();

    if (! throwSyntax) {
      results.forEach((result, file) => {
        const module = options.compilerOptions.module;
        this._addJavaScript(file, result, module === 'none');
      });
    }

    pcompile.end();
  }

  _getContentGetter(inputFiles) {
    const filesMap = new Map;
    inputFiles.forEach((inputFile, index) => {
      filesMap.set(getExtendedPath(inputFile), index);
    });

    return filePath => {
      let index = filesMap.get(filePath);
      if (index === undefined) {
        const filePathNoRootSlash = filePath.replace(/^\//, '');
        index = filesMap.get(filePathNoRootSlash);
      }
      return index !== undefined ?
        inputFiles[index].getContentsAsString() : null;
    };
  }

  _addJavaScript(inputFile, tsResult, forceBare) {
    const source = inputFile.getContentsAsString();
    const inputPath = inputFile.getPathInPackage();
    const outputPath = TypeScript.removeTsExt(inputPath) + '.js';
    const toBeAdded = {
      sourcePath: inputPath,
      path: outputPath,
      data: tsResult.code,
      hash: tsResult.hash,
      sourceMap: tsResult.sourceMap,
      bare: forceBare || isBare(inputFile)
    };
    inputFile.addJavaScript(toBeAdded);
  }

  _processDiagnostics(inputFile, diagnostics, tsOptions) {
    // Remove duplicated warnings for shared files
    // by saving hashes of already shown warnings.
    const reduce = (diagnostic, cb) => {
      let dob = {
        message: diagnostic.message,
        sourcePath: getExtendedPath(inputFile),
        line: diagnostic.line,
        column: diagnostic.column
      };
      const arch = inputFile.getArch();
      // TODO: find out how to get list of architectures.
      this.archSet.add(arch);

      let shown = false;
      for (const key of this.archSet.keys()) {
        if (key !== arch) {
          dob.arch = key;
          const hash = getShallowHash(dob);
          if (this.diagHash.has(hash)) {
            shown = true; break;
          }
        }
      }

      if (! shown) {
        dob.arch = arch;
        const hash = getShallowHash(dob);
        this.diagHash.add(hash);
        cb(dob);
      }
    }

    // Always throw syntax errors.
    const throwSyntax = !! diagnostics.syntacticErrors.length;
    diagnostics.syntacticErrors.forEach(diagnostic => {
      reduce(diagnostic, dob => {
        inputFile.error(dob);
      });
    });

    const packageName = inputFile.getPackageName();
    if (packageName) return throwSyntax;

    // And log out other errors except package files.
    if (tsOptions && tsOptions.diagnostics) {
      diagnostics.semanticErrors.forEach(diagnostic => {
        reduce(diagnostic, dob => inputFile.warn(dob));
      });
    }

    return throwSyntax;
  }

  _getFileModuleName(inputFile, options) {
    if (options.module === 'none') return null;

    return getES6ModuleName(inputFile);
  }

  _processConfig(inputFiles) {
    const tsFiles = inputFiles
      .map(inputFile => inputFile.getPathInPackage())
      .filter(filePath => TS_REGEXP.test(filePath));

    for (const inputFile of inputFiles) {
      // Parse root config.
      if (isMainConfig(inputFile)) {
        const source = inputFile.getContentsAsString();
        const hash = inputFile.getSourceHash();
        // If hashes differ, create new tsconfig. 
        if (hash !== this.cfgHash) {
          this.tsconfig = this._parseConfig(source, tsFiles);
          this.cfgHash = hash;
        }
        return;
      }

      // Parse server config.
      // Take only target and lib values.
      if (isServerConfig(inputFile)) {
        const  source = inputFile.getContentsAsString();
        const { compilerOptions } = this._parseConfig(source, tsFiles);
        if (compilerOptions) {
          const { target, lib } = compilerOptions;
          this.serverOptions = { target, lib };
        }
        return;
      }
    }
  }

  _parseConfig(cfgContent, tsFiles) {
    let tsconfig = null;

    try {
      tsconfig = JSON.parse(cfgContent);
      // Define files since if it's not defined
      // validation throws an exception.
      const files = tsconfig.files || tsFiles;
      tsconfig.files = files;

      validateTsConfig(tsconfig);
    } catch(err) {
      throw new Error(`Format of the tsconfig is invalid: ${err}`);
    }

    const exclude = tsconfig.exclude || [];
    try {
      const regExp = getExcludeRegExp(exclude);
      tsconfig.exclude = regExp && new RegExp(regExp);
    } catch(err) {
      throw new Error(`Format of an exclude path is invalid: ${err}`);
    }

    return tsconfig;
  }

  _filterByDefault(inputFiles) {
    inputFiles = inputFiles.filter(inputFile => {
      const path = inputFile.getPathInPackage();
      return COMPILER_REGEXP.test(path) && ! defExclude.test('/' + path);
    });
    return inputFiles;
  }

  _filterByConfig(inputFiles) {
    let resultFiles = inputFiles;
    if (this.tsconfig.exclude) {
      resultFiles = resultFiles.filter(inputFile => {
        const path = inputFile.getPathInPackage();
        // There seems to an issue with getRegularExpressionForWildcard:
        // result regexp always starts with /.
        return ! this.tsconfig.exclude.test('/' + path);
      });
    }
    return resultFiles;
  }

  _filterByArch(inputFiles, arch) {
    check(arch, String);

    /**
     * Include only typings that current arch needs,
     * typings/main is for the server only and
     * typings/browser - for the client.
     */
    const filterRegExp = /^web/.test(arch) ? exlWebRegExp : exlMainRegExp;
    inputFiles = inputFiles.filter(inputFile => {
      const path = inputFile.getPathInPackage();
      return ! filterRegExp.test('/' + path);
    });

    return inputFiles;
  }
}
