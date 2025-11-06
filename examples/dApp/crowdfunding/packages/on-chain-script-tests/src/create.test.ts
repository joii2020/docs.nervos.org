import { hexFrom, Transaction, Hex, numLeToBytes } from "@ckb-ccc/core";
import { Resource, Verifier, } from "ckb-testtool";
import { Since } from "@ckb-ccc/core";

import * as misc from "./misc"
import { txHelper, joinHex } from "./tx_helper";

class projectArgs {
  constructor(
    public typeID: Hex = misc.zeroHash(),
    public creatorLockScriptHash: Hex = misc.zeroHash(),
    public goalAmount: bigint = BigInt(0),
    public deadline: Date = new Date(),
    public contributionType: Hex = misc.zeroHash(),
  ) {
    // Ends after 100 days
    this.deadline.setDate(this.deadline.getDate() + 100);
  }

  args(): Hex {
    return joinHex(
      this.typeID,
      this.creatorLockScriptHash,
      hexFrom(numLeToBytes(this.goalAmount, 16)),
      hexFrom(new Since("absolute", "timestamp", BigInt(this.deadline.getTime())).toBytes()),
      this.contributionType)
  }
}

async function createSuccess() {
  let helper = new txHelper();
  helper.debugJsCode = true;

  const userLock = helper.createAlwaySuc("UserLock");
  const input_0 = helper.resource.mockCell(userLock);

  const prjLock = helper.createAlwaySuc("Project");
  let prjArgs = new projectArgs();
  prjArgs.goalAmount = 1000000n;
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
  tx = helper.updateSince(tx);
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
