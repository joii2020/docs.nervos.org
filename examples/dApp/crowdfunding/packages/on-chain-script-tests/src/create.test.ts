import { hexFrom, Transaction, Hex, numLeToBytes } from "@ckb-ccc/core";
import { Resource, Verifier, } from "ckb-testtool";

import * as misc from "./misc"

class projectArgs {
  constructor(
    public typeID: Hex = misc.zeroHash(),
    public creatorLockScriptHash: Hex = misc.zeroHash(),
    public goalAmount: bigint = BigInt(0),
    public dealine: number = Date.now(),
    public contributionType: Hex = misc.zeroHash(),
  ) { }

  args(): Hex {
    return misc.joinHex(
      this.typeID,
      this.creatorLockScriptHash,
      hexFrom(numLeToBytes(this.goalAmount, 16)),
      hexFrom(numLeToBytes(this.dealine, 8)),
      this.contributionType)
  }
}

async function createSuccess() {
  let helper = new misc.txHelper();
  // helper.debugJsCode = true;

  const userLock = helper.createAlwaySuc("UserLock");
  const input_0 = helper.resource.mockCell(userLock);

  const prjLock = helper.createAlwaySuc("Project");
  let prjArgs = new projectArgs();
  const prjScript = helper.createJsScript(misc.scriptProject, prjArgs.args());

  const output_0 = Resource.createCellOutput(prjLock, prjScript);
  const output_1 = Resource.createCellOutput(userLock);

  let tx = Transaction.from({
    inputs: [
      input_0,
    ],
    outputs: [
      output_0,
      output_1,
    ],
    outputsData: [
      hexFrom("0x"),
      hexFrom("0x"),
    ],
  });
  tx = helper.updateScriptDeps(tx);
  tx = helper.setTypeID(tx, prjScript.hash(), 0, true);

  const verifier = Verifier.from(helper.resource, tx);
  verifier.verifySuccess(true);
}

describe("unit test create", () => {
  test("createSuccess", () => {
    createSuccess();
  });
});
