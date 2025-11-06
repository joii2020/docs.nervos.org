import { hexFrom, Transaction } from "@ckb-ccc/core";
import { Resource, Verifier } from "ckb-testtool";

import * as misc from "./misc";
import { TxHelper } from "./tx_helper";

async function donationSuccess() {
  let helper = new TxHelper();
  helper.debugJsCode = true;

  const userLock = helper.createAlwaySuc("UserLock");
  const input_0 = helper.resource.mockCell(userLock);

  const prjLock = helper.createAlwaySuc("Project");
  let prjArgs = new misc.ProjectArgs();
  prjArgs.goalAmount = 1000000n;
  const prjScript = helper.createJsScript(misc.scriptProject, prjArgs.args());

  const output_0 = Resource.createCellOutput(prjLock, prjScript);
  const output_1 = Resource.createCellOutput(userLock);

  let tx = Transaction.from({
    inputs: [input_0],
    outputs: [output_0, output_1],
    outputsData: [hexFrom("0x"), hexFrom("0x")],
  });
  tx = helper.updateSince(tx);
  tx = helper.updateScriptDeps(tx);
  tx = helper.setTypeID(tx, prjScript.hash(), 0, true);

  const verifier = Verifier.from(helper.resource, tx);
  verifier.verifySuccess(true);
}

describe("unit test create", () => {
  test("donationSuccess", () => {
    donationSuccess();
  });
});
