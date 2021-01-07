import * as meteorTS from './meteor-typescript';

TypeScript = {
  validateOptions(options) {
    if (! options) return;

    meteorTS.validateAndConvertOptions(options);
  },

  // Extra options are the same compiler options
  // but passed in the compiler constructor.
  validateExtraOptions(options) {
    if (! options) return;

    meteorTS.validateAndConvertOptions({
      compilerOptions: options
    });
  },

  getDefaultOptions: meteorTS.getDefaultOptions,

  compile(source, options) {
    options = options || meteorTS.getDefaultOptions();
    return meteorTS.compile(source, options);
  },

  setCacheDir(cacheDir) {
    meteorTS.setCacheDir(cacheDir);
  },

  isDeclarationFile(filePath) {
    return /^.*\.d\.ts$/.test(filePath);
  },

  removeTsExt(path) {
    return path && path.replace(/(\.tsx|\.ts)$/g, '');
  }
};
