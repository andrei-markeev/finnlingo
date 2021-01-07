import assert from "assert";
import ts from "typescript";
import _ from "underscore";

import logger from "./logger";
import sourceHost from "./files-source-host";
import {
  normalizePath,
  prepareSourceMap,
  isSourceMap,
  getDepsAndRefs,
  getRefs,
  createDiagnostics,
  getRootedPath,
  TsDiagnostics,
} from "./ts-utils";

var babel = Npm.require("@babel/core");

export default class CompileService {
  constructor(serviceHost) {
    this.serviceHost = serviceHost;
    this.service = ts.createLanguageService(serviceHost);
  }

  compile(filePath, moduleName) {
    const sourceFile = this.getSourceFile(filePath);
    assert.ok(sourceFile);

    if (moduleName) {
      sourceFile.moduleName = moduleName;
    }

    const result = this.service.getEmitOutput(filePath);

    let code, sourceMap;
    result.outputFiles.forEach(file => {
      if (normalizePath(filePath) !==
            normalizePath(file.name)) return;

      const text = file.text;
      if (isSourceMap(file.name)) {
        const source = sourceHost.get(filePath);
        sourceMap = prepareSourceMap(text, source, filePath);
      } else {
        code = text;
      }
    });

    if (/\.tsx$/.test(filePath)) {
        code = babel.transformSync(code, { presets: [ "@vue/babel-preset-jsx" ] }).code;
    }

    const checker = this.getTypeChecker();
    const pcs = logger.newProfiler("process csresult");
    const deps = getDepsAndRefs(sourceFile, checker);
    const meteorizedCode = this.rootifyPaths(code, deps.mappings); 
    const csResult = createCSResult(filePath, {
      code: meteorizedCode,
      sourceMap,
      version: this.serviceHost.getScriptVersion(filePath),
      isExternal: ts.isExternalModule(sourceFile),
      dependencies: deps,
      diagnostics: this.getDiagnostics(filePath),
    });
    pcs.end();

    return csResult;
  }

  getHost() {
    return this.serviceHost;
  }

  getDocRegistry() {
    return this.registry;
  }

  getSourceFile(filePath) {
    const program = this.service.getProgram();
    return program.getSourceFile(filePath);
  }

  getDepsAndRefs(filePath) {
    const checker = this.getTypeChecker();
    return getDepsAndRefs(this.getSourceFile(filePath), checker);
  }

  getRefTypings(filePath) {
    const refs = getRefs(this.getSourceFile(filePath));
    return refs.refTypings;
  }

  getTypeChecker() {
    return this.service.getProgram().getTypeChecker();
  }

  getDiagnostics(filePath) {
    return createDiagnostics(
      this.service.getSyntacticDiagnostics(filePath),
      this.service.getSemanticDiagnostics(filePath)
    );
  }

  rootifyPaths(code, mappings) {
    function buildPathRegExp(modulePath) {
      const regExp = new RegExp("(require\\(\"|\')(" + modulePath + ")(\"|\'\\))", "g");
      return regExp;
    }

    mappings = mappings.filter(module => module.resolved && !module.external);
    logger.assert("process mappings %s", mappings.map((module) => module.resolvedPath));
    for (const module of mappings) {
      const usedPath = module.modulePath;
      const resolvedPath = module.resolvedPath;

      // Fix some weird v2.1.x bug where
      // LanguageService converts dotted paths
      // to relative in the code.
      const regExp = buildPathRegExp(resolvedPath);
      code = code.replace(regExp, function(match, p1, p2, p3, offset) {
        return p1 + getRootedPath(resolvedPath) + p3;
      });

      // Skip path replacement for dotted paths.
      if (! usedPath.startsWith(".")) {
        const regExp = buildPathRegExp(usedPath);
        code = code.replace(regExp, function(match, p1, p2, p3, offset) {
          return p1 + getRootedPath(resolvedPath) + p3;
        });
      }
    }
    return code;
  }
}

export function createCSResult(filePath, result) {
  const props = [
    "code", "sourceMap", "version",
    "isExternal", "dependencies", "diagnostics",
  ];
  const len = props.length;
  for (let i = 0; i < len; i++) {
    if (!(props[i] in result)) {
      const msg = `file result ${filePath} doesn't contain ${props[i]}`;
      logger.debug(msg);
      throw new Error(msg);
    }
  }
  result.diagnostics = new TsDiagnostics(
    result.diagnostics);

  return new CSResult(result);
}

export class CSResult {
  constructor(result) {
    assert.ok(this instanceof CSResult);

    Object.assign(this, result);
  }

  upDiagnostics(diagnostics) {
    this.diagnostics = new TsDiagnostics(diagnostics);
  }
}
