import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log, logError, bytesEq, hashTypeId, CellInput, } from "@ckb-js-std/core";

function locateIndex(): number {
  const hash = bindings.loadScriptHash();

  const query = new HighLevel.QueryIter<ArrayBuffer | null>(
    (i, s) => HighLevel.loadCellTypeHash(i, s),
    bindings.SOURCE_OUTPUT,
  );

  const index = query
    .toArray()
    .findIndex((typeHash) => typeHash && bytesEq(typeHash, hash));

  if (index === -1) throw new Error("TypeIDError");
  return index;
}

function main() {
  log.setLevel(log.LogLevel.Debug);
  HighLevel.checkTypeId(35);

  return 0;
}

try {
  bindings.exit(main());
} catch (e) {
  if (e instanceof Error) {
    console.log(`Error ${e.name} : ${e.message}`);
  }

  logError(e);
  bindings.exit(-1);
}

