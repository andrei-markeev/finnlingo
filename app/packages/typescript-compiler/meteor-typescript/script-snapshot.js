import ts from "typescript";
import * as jsdiff from "diff";

import logger from "./logger";

export default class StringScriptSnapshot {
  constructor(text) {
    this.text = text;
  }

  getText(start, end) {
    return this.text.substring(start, end);
  }

  getLength() {
    return this.text.length;
  }

  getChangeRange(oldSnapshot) {
    if (!oldSnapshot) return undefined;

    const diffs = jsdiff.diffChars(oldSnapshot.text, this.text);
    if (diffs.length) {
      let ind = 0;
      let changes = [];
      for (let i = 0; i < diffs.length; i++) {
        const diff = diffs[i];

        if (diff.added) {
          changes.push(ts.createTextChangeRange(
            ts.createTextSpan(ind, 0), diff.count));
          ind += diff.count;
          continue;
        }

        if (diff.removed) {
          changes.push(ts.createTextChangeRange(
            ts.createTextSpan(ind, diff.count), 0));
          continue;
        }

        ind += diff.count;
      }

      changes = ts.collapseTextChangeRangesAcrossMultipleVersions(changes);
      logger.assert("accumulated file changes %j", changes);

      return changes;
    }

    return ts.createTextChangeRange(ts.createTextSpan(0, 0), 0);
  }
}
