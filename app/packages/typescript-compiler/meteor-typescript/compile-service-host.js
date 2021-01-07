import ts from "typescript";
import _ from "underscore";

import { deepHash } from "./utils";
import { isTypings } from "./ts-utils";
import logger from "./logger";
import sourceHost from "./files-source-host";
import StringScriptSnapshot from "./script-snapshot";

export default class CompileServiceHost {
  constructor(fileCache) {
    this.files = {};
    this.fileCache = fileCache;
    this.fileContentMap = new Map();
    this.typingsChanged = false;
    this.appId = this.curDir = ts.sys.getCurrentDirectory();
  }

  setFiles(filePaths, options) {
    this.options = options;
    this.filePaths = filePaths;

    const typings = [];
    const arch = options && options.arch;
    filePaths.forEach(filePath => {
      if (! this.files[filePath]) {
        this.files[filePath] = { version: 0 };
      }

      // Collect typings in order to set them later.
      if (isTypings(filePath)) {
        typings.push(filePath);
      }

      const source = sourceHost.get(filePath);
      this.files[filePath].changed = false;
      // Use file path with the current dir for the cache
      // to avoid same file names coincidences between apps.
      const fullPath = ts.combinePaths(this.curDir, filePath);
      const fileChanged = this.fileCache.isChanged(fullPath, arch, source);
      if (fileChanged) {
        this.files[filePath].version++;
        this.files[filePath].changed = true;
        this.fileCache.save(fullPath, arch, source);
        return;
      }
    }, this);

    this.setTypings(typings, options);
  }

  setTypings(typings, options) {
    const dtsMap = {};
    const arch = options && options.arch;
    let typingsChanged = false;
    for (let i = 0; i < typings.length; i++) {
      const filePath = typings[i];
      if (this.hasFile(filePath)) { 
        dtsMap[filePath] = true;
        if (this.isFileChanged(filePath)) {
          logger.debug("declaration file %s changed", filePath);
          typingsChanged = true;
        }
        continue;
      }
      const fullPath = ts.combinePaths(this.curDir, filePath);
      const source = this.readFile(fullPath);
      if (source) {
        dtsMap[filePath] = true;
        const fileChanged = this.fileCache.isChanged(fullPath, arch, source);
        if (fileChanged) {
          this.fileCache.save(fullPath, arch, source);
          logger.debug("declaration file %s changed", filePath);
          typingsChanged = true;
        }
      }
    }

    // Investigate if the number of declaration files have changed.
    // In the positive case, we'll need to revaluate diagnostics
    // for all files of specific architecture.
    if (arch) {
      // Check if typings map differs from the previous value.
      const mapChanged = this.fileCache.isChanged(this.appId, arch, dtsMap);
      if (mapChanged) {
        logger.debug("typings of %s changed", arch);
        typingsChanged = mapChanged;
      }
      this.fileCache.save(this.appId, arch, dtsMap);
    }

    this.typingsChanged = typingsChanged;
  }

  isFileChanged(filePath) {
    const normPath = sourceHost.normalizePath(filePath);
    const file = this.files[normPath];
    return file && file.changed;
  }

  hasFile(filePath) {
    const normPath = sourceHost.normalizePath(filePath);
    return !!this.files[normPath];
  }

  isTypingsChanged() {
    return this.typingsChanged;
  }

  getScriptFileNames() {
    const rootFilePaths = {};
    for (const filePath in this.files) {
      rootFilePaths[filePath] = true;
    }

    // Add in options.typings, which is used
    // to set up typings that should be read from disk.
    const typings = this.options.typings;
    if (typings) {
      typings.forEach(filePath => {
        if (! rootFilePaths[filePath]) {
          rootFilePaths[filePath] = true;
        }
      });
    }

    return Object.keys(rootFilePaths);
  }

  getScriptVersion(filePath) {
    const normPath = sourceHost.normalizePath(filePath);
    return this.files[normPath] &&
      this.files[normPath].version.toString();
  }

  getScriptSnapshot(filePath) {
    const source = sourceHost.get(filePath);
    if (source !== null) {
      return new StringScriptSnapshot(source);
    }

    const fileContent = this.readFile(filePath);
    return fileContent ? new StringScriptSnapshot(fileContent) : null;
  }

  readDirectory(...args) {
    return ts.sys.readDirectory(...args);
  }

  fileExists(filePath) {
    const normPath = sourceHost.normalizePath(filePath);
    if (this.files[normPath]) return true;

    const fileContent = this.fileContentMap.get(filePath);
    if (fileContent) return true;

    return ts.sys.fileExists(filePath);
  }

  readFile(filePath) {
    // Read node_modules files optimistically.
    let fileContent = this.fileContentMap.get(filePath);
    if (! fileContent) {
      fileContent = ts.sys.readFile(filePath, "utf-8");
      this.fileContentMap.set(filePath, fileContent);
    }
    return fileContent;
  }

  getCompilationSettings() {
    return this.options.compilerOptions;
  }

  getDefaultLibFileName() {
    const libName = ts.getDefaultLibFilePath(
      this.getCompilationSettings());
    return libName;
  }

  // Returns empty since we process for simplicity
  // file paths relative to the Meteor app.
  getCurrentDirectory() {
    return "";
  }

  useCaseSensitiveFileNames() {
    return true;
  }
}
