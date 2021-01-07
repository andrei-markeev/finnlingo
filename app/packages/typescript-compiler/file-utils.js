const colors = Npm.require('colors');

export function isBare(inputFile) {
  const fileOptions = inputFile.getFileOptions();
  return fileOptions && fileOptions.bare;
}

// Gets root app tsconfig.
export function isMainConfig(inputFile) {
  if (! isWeb(inputFile)) return false;

  const filePath = inputFile.getPathInPackage();
  return /^tsconfig\.json$/.test(filePath);
}

export function isConfig(inputFile) {
  const filePath = inputFile.getPathInPackage();
  return /tsconfig\.json$/.test(filePath);
}

// Gets server tsconfig.
export function isServerConfig(inputFile) {
  if (isWeb(inputFile)) return false;

  const filePath = inputFile.getPathInPackage();
  return /^server\/tsconfig\.json$/.test(filePath);
}

// Checks if it's .d.ts-file.
export function isDeclaration(inputFile) {
  return TypeScript.isDeclarationFile(inputFile.getBasename());
}

export function isWeb(inputFile) {
  const arch = inputFile.getArch();
  return /^web/.test(arch);
}

// Gets path with package prefix if any.
export function getExtendedPath(inputFile) {
  let packageName = inputFile.getPackageName();
  packageName = packageName ?
    (packageName.replace(':', '_') + '/') : '';
  const inputFilePath = inputFile.getPathInPackage();
  return packageName + inputFilePath;
}

export function getES6ModuleName(inputFile) {
  const extended = getExtendedPath(inputFile);
  return TypeScript.removeTsExt(extended);
}

export const WarnMixin = {
  warn(error) {
    console.log(`${error.sourcePath} (${error.line}, ${error.column}): ${error.message}`);
  },
  logError(error) {
    console.log(colors.red(
      `${error.sourcePath} (${error.line}, ${error.column}): ${error.message}`));
  }
}

export function extendFiles(inputFiles, fileMixin) {
  inputFiles.forEach(inputFile => _.defaults(inputFile, fileMixin));
}
