import ts from "typescript";
import _ from "underscore";

const ROOTED = /^(\/|\\)/;

class SourceHost {
  setSource(fileSource) {
    this.fileSource = fileSource;
  }

  get(filePath) {
    if (this.fileSource) {
      const source = this.fileSource(filePath);
      if (_.isString(source)) return source;
    }

    return null;
  }

  normalizePath(filePath) {
    if (!filePath) return null;

    return filePath.replace(ROOTED, '');
  }
}

module.exports = new SourceHost();
