## TypeScript compiler for Meteor  [![Build Status](https://travis-ci.org/barbatus/typescript-compiler.svg?branch=master)](https://travis-ci.org/barbatus/typescript-compiler)

Exports two symbols:
  - `TypeScriptCompiler` - a compiler to be registered using `registerBuildPlugin` 
     to compile TypeScript files.

  - `TypeScript` - an object with `compile` method.
     Use `TypeScript.compile(source, options)` to compile with preset options.
