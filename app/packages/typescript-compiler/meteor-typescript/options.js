var ts = require("typescript");
var _ = require("underscore");

function presetCompilerOptions(customOptions) {
  if (! customOptions) return;

  var compilerOptions = customOptions;

  // Declaration files are expected to
  // be generated separately.
  compilerOptions.declaration = false;

  // Overrides watching,
  // it is handled by Meteor itself.
  compilerOptions.watch = false;

  // We use source maps via Meteor file API,
  // This class's API provides source maps
  // separately but alongside compilation results.
  // Hence, skip generating inline source maps.
  compilerOptions.inlineSourceMap = false;
  compilerOptions.inlineSources = false;

  // Always emit.
  compilerOptions.noEmit = false;
  compilerOptions.noEmitOnError = false;

  // Don't generate any files, hence,
  // skip setting outDir and outFile.
  compilerOptions.outDir = null;
  compilerOptions.outFile = null;

  // This is not need as well.
  // API doesn't have paramless methods.
  compilerOptions.rootDir = null;
  compilerOptions.sourceRoot = null;

  return compilerOptions;
}

exports.presetCompilerOptions = presetCompilerOptions;

// Default compiler options.
function getDefaultCompilerOptions(arch) {
  var options = {
    target: "es5",
    module : "commonjs",
    moduleResolution: "node",
    sourceMap: true,
    noResolve: false,
    lib: ["es5"],
    diagnostics: true,
    noEmitHelpers: true,
    // Always emit class metadata,
    // especially useful for Angular2.
    emitDecoratorMetadata: true,
    // Support decorators by default.
    experimentalDecorators: true,
    // Don't impose `use strict`
    noImplicitUseStrict: true,
    baseUrl: ".",
    rootDirs: ["."],
  };

  if (/^web/.test(arch)) {
    options.lib.push("dom");
  }

  return options;
}

exports.getDefaultCompilerOptions = getDefaultCompilerOptions;

// Validate compiler options and convert them from 
// user-friendly format to enum values used by TypeScript, e.g.:
// 'system' string converted to ts.ModuleKind.System value.
function convertCompilerOptionsOrThrow(options) {
  if (! options) return null;

  var result = ts.convertCompilerOptionsFromJson(options, "");

  if (result.errors && result.errors.length) {
    throw new Error(result.errors[0].messageText);
  }

  return result.options;
}

exports.convertCompilerOptionsOrThrow = convertCompilerOptionsOrThrow;

function validateTsConfig(configJson) {
  var result = ts.parseJsonConfigFileContent(configJson, ts.sys, "");

  if (result.errors && result.errors.length) {
    throw new Error(result.errors[0].messageText);
  }
}

exports.validateTsConfig = validateTsConfig;
