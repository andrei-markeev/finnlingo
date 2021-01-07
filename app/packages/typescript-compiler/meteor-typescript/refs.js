import logger from "./logger";

export const RefsChangeType = {
  NONE: 0,
  FILES: 1,
  MODULES: 2,
  TYPINGS: 3,
};

export function evalRefsChangeMap(filePaths, isFileChanged, getRefs, maxDepth) {
  const refsChangeMap = {};
  filePaths.forEach((filePath) => {
    if (refsChangeMap[filePath]) return;
    refsChangeMap[filePath] = evalRefsChange(filePath,
      isFileChanged, getRefs, refsChangeMap, maxDepth);
    logger.assert("set ref changes: %s %s", filePath, refsChangeMap[filePath]);
  });
  return refsChangeMap;
}

function evalRefsChange(filePath, isFileChanged, getRefs, refsChangeMap, depth) {
  // Depth of deps analysis.
  if (depth === 0) {
    return RefsChangeType.NONE;
  }

  const refs = getRefs(filePath);
  if (!refs) {
    refsChangeMap[filePath] = RefsChangeType.NONE;
    return RefsChangeType.NONE;
  }

  const refsChange = isRefsChanged(filePath, isFileChanged, refs);
  if (refsChange !== RefsChangeType.NONE) {
    refsChangeMap[filePath] = refsChange;
    return refsChange;
  }

  const modules = refs.modules;
  for (const mPath of modules) {
    let result = refsChangeMap[mPath];
    if (result === undefined) {
      result = evalRefsChange(mPath, isFileChanged, getRefs, refsChangeMap, depth - 1);
    }
    if (result !== RefsChangeType.NONE) {
      refsChangeMap[filePath] = RefsChangeType.MODULES;
      return RefsChangeType.MODULES;
    }
  }
  refsChangeMap[filePath] = RefsChangeType.NONE;
  return RefsChangeType.NONE;
}

function isRefsChanged(filePath, isFileChanged, refs) {
  function isFilesChanged(files) {
    if (!files) return false;

    const tLen = files.length;
    for (let i = 0; i < tLen; i++) {
      if (isFileChanged(files[i])) {
        return true;
      }
    }
    return false;
  }

  if (refs) {
    const typings = refs.refTypings;
    if (isFilesChanged(typings)) {
      logger.debug("referenced typings changed in %s", filePath);
      return RefsChangeType.TYPINGS;
    }

    const files = refs.refFiles;
    if (isFilesChanged(files)) {
      logger.debug("referenced files changed in %s", filePath);
      return RefsChangeType.FILES;
    }

    const modules = refs.modules;
    if (isFilesChanged(modules)) {
      logger.debug("imported module changed in %s", filePath);
      return RefsChangeType.MODULES;
    }
  }

  return RefsChangeType.NONE;
}
