import assert from "assert";
import ts from "typescript";
import _ from "underscore";

import { assertProps } from "./utils";

// 1) Normalizes slashes in the file path
// 2) Removes file extension
export function normalizePath(filePath) {
  let resultName = filePath;
  if (ts.fileExtensionIs(filePath, ".map")) {
    resultName = filePath.replace(/\.map$/, "");
  }
  return ts.removeFileExtension(
    ts.normalizeSlashes(resultName));
}

export function getRootedPath(filePath) {
  if (ts.getRootLength(filePath) === 0) {
    return "/" + filePath;
  }
  return filePath;
}

export function prepareSourceMap(sourceMapContent, fileContent, sourceMapPath) {
  const sourceMapJson = JSON.parse(sourceMapContent);
  sourceMapJson.sourcesContent = [fileContent];
  sourceMapJson.sources = [sourceMapPath];
  return sourceMapJson;
}

/**
 * Gets all local modules given sourceFile imports types from.
 * Supports transitivity, i.e., if some module (directly imported)
 * re-exports types from another module, this another module
 * will be in the output too.
 */
function getDeps(sourceFile, checker) {
  const modules = [];

  function getModulePath(module) {
    if (!module) return null;

    const decl = module.declarations[0];
    const sf = decl.getSourceFile();
    if (sf && !sf.isDeclarationFile) {
      return sf.path;
    }
    return null;
  }

  function isExternal(module) {
    const decl = module.declarations[0];
    const sf = decl.getSourceFile();
    return sf.isDeclarationFile;
  }

  if (sourceFile.imports) {
    const paths = new Set();
    _.each(sourceFile.imports, function(importName) {
      const module = checker.getSymbolAtLocation(importName);
      if (module && !isExternal(module)) {
        const path = getModulePath(module);
        if (path) {
          paths.add(path);
        }
        const nodes = checker.getExportsOfModule(module);
        _.each(nodes, function(node) {
          if (node.parent && node.parent !== module) {
            const path = getModulePath(node.parent);
            if (path) {
              paths.add(path);
            }
            return;
          }

          // If directly imported module re-uses and exports of a type
          // from another module, add this module to the dependency as well.
          const type = checker.getTypeAtLocation(node.declarations[0]);
          if (type && type.symbol) {
            const typeModule = type.symbol.parent;
            if (typeModule !== module) {
              const path = getModulePath(typeModule);
              if (path) {
                paths.add(path);
              }
            }
          }
        });
      }
    });
    paths.forEach(function(path) {
      modules.push(path)
    });
  }

  return modules;
}

export function getDepsAndRefs(sourceFile, typeChecker) {
  assert.ok(typeChecker);

  const modules = getDeps(sourceFile, typeChecker);
  const refs = getRefs(sourceFile);
  const mappings = getMappings(sourceFile);

  return {
    modules,
    mappings,
    refFiles: refs.refFiles,
    refTypings: refs.refTypings,
  };
}

function getMappings(sourceFile) {
  const mappings = [];
  if (sourceFile.resolvedModules) {
    const modules = sourceFile.resolvedModules;
    modules.forEach((module, modulePath) => {
      mappings.push({
        modulePath,
        resolvedPath: module ? ts.removeFileExtension(module.resolvedFileName) : null,
        external: module ? module.isExternalLibraryImport : false,
        resolved: !!module,
      });
    });
  }
  return mappings;
}

function getRefs(sourceFile) {
  // Collect referenced file paths, e.g.:
  // /// <reference path=".." />
  let refTypings = [], refFiles = [];
  if (sourceFile.referencedFiles) {
    const refPaths = sourceFile.referencedFiles.map((ref) => ref.fileName);
    refTypings = _.filter(refPaths, (ref) => isTypings(ref));
    refFiles = _.filter(refPaths, (ref) => !isTypings(ref));
  }

  // Collect resolved paths to referenced declaration types, e.g.:
  // /// <reference types=".." />
  if (sourceFile.resolvedTypeReferenceDirectiveNames) {
    const modules = sourceFile.resolvedTypeReferenceDirectiveNames;
    modules.forEach((ref, lib) => {
      if (!ref) return;
      refTypings.push(ref.resolvedFileName);
    });
  }

  return {
    refFiles,
    refTypings,
  };
}

export function createDiagnostics(tsSyntactic, tsSemantic) {
  // Parse diagnostics to leave only info we need.
  var syntactic = flattenDiagnostics(tsSyntactic);
  var semantic = flattenDiagnostics(tsSemantic);
  return {
    syntacticErrors: syntactic,
    semanticErrors: semantic,
  };
}

export class TsDiagnostics {
  constructor(diagnostics) {
    assert.ok(this instanceof TsDiagnostics);
    assert.ok(diagnostics);
    assertProps(diagnostics, [
      "syntacticErrors", "semanticErrors",
    ]);

    _.extend(this, diagnostics);
  }

  hasErrors() {
    return !!this.semanticErrors.length ||
      !!this.syntacticErrors.length;
  }

  hasUnresolvedModules() {
    const index = _.findIndex(this.semanticErrors, (msg) => 
      msg.code === ts.Diagnostics.Cannot_find_module_0.code
    );
    return index !== -1;
  }
}

function flattenDiagnostics(tsDiagnostics) {
  const diagnostics = [];

  const dLen = tsDiagnostics.length;
  for (let i = 0; i < dLen; i++) {
    const diagnostic = tsDiagnostics[i];
    if (!diagnostic.file) continue;

    const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    const line = pos.line + 1;
    const column = pos.character + 1;

    diagnostics.push({
      code: diagnostic.code,
      fileName: diagnostic.file.fileName,
      message,
      line,
      column,
    });
  }

  return diagnostics;
}

export function hasErrors(diagnostics) {
  if (!diagnostics) return true;

  return diagnostics.semanticErrors.length ||
    diagnostics.syntacticErrors.length;
}

export function isSourceMap(fileName) {
  return ts.fileExtensionIs(fileName, ".map");
}

export function isTypings(fileName) {
  return ts.fileExtensionIs(fileName, ".d.ts");
}

export function getExcludeRegExp(exclude) {
  if (!exclude) return exclude;

  return ts.getRegularExpressionForWildcard(exclude, "", "exclude");
}
