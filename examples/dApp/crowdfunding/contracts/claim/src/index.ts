import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log, logError } from "@ckb-js-std/core";

function main() {
  log.setLevel(log.LogLevel.Debug);
  let script = HighLevel.loadScript();
  log.debug(`current script: ${JSON.stringify(script)}`);
  return 0;
}

try {
  bindings.exit(main());
} catch (e) {
  logError(e);
}
