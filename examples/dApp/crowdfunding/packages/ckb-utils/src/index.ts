import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log, logError, numFromBytes } from "@ckb-js-std/core";

export enum ScriptStatus {
  CREATED = "created",
  TRANSACTION = "transaction",
  DESTROYED = "destroyed",
}

export function isCellPresent(
  index: number,
  source: bindings.SourceType,
): boolean {
  try {
    bindings.loadCellByField(index, source, bindings.CELL_FIELD_CAPACITY);
  } catch (err: any) {
    if (err.errorCode === bindings.INDEX_OUT_OF_BOUND) {
      return false;
    } else {
      throw err;
    }
  }
  return true;
}

export function getScriptStatus(): ScriptStatus {
  let input = isCellPresent(0, bindings.SOURCE_GROUP_INPUT);
  let output = isCellPresent(0, bindings.SOURCE_GROUP_OUTPUT);

  if (input && output) {
    return ScriptStatus.TRANSACTION;
  } else if (!input && output) {
    return ScriptStatus.CREATED;
  } else if (input && !output) {
    return ScriptStatus.DESTROYED;
  } else {
    throw Error("Unknow");
  }
}
