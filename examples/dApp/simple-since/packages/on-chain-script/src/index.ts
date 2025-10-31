import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log, numFromBytes } from "@ckb-js-std/core";

import { Since, isMature } from "ckb-since";

function main() {
  log.setLevel(log.LogLevel.Debug);
  const needSince = new Since(numFromBytes(HighLevel.loadScript().args));
  let iter = new HighLevel.QueryIter(HighLevel.loadInputSince, bindings.SOURCE_GROUP_INPUT);
  for (let it of iter) {
    let since = new Since(it);
    if (!isMature(since, needSince)) {
      return -2; // check since failed
    }
  }

  const since = bindings.loadCellByField(0, bindings.SOURCE_CELL_DEP, bindings.INPUT_FIELD_SINCE, 0);

  return 0;
}

bindings.exit(main());
