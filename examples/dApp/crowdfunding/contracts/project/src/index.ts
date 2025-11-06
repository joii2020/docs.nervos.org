import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log, logError, numFromBytes } from "@ckb-js-std/core";
import { Since } from "ckb-since"
import { getScriptStatus, ScriptStatus } from "ckb-utils"

class PorjectArgs {
  constructor(
    public typeId: Uint8Array = new Uint8Array(),
    public creatorLockScriptHash: Uint8Array = new Uint8Array(),
    public goalAmount: bigint = 0n,
    public deadline: Since = new Since(0n),
    public contributionType: Uint8Array = new Uint8Array(),
  ) {
    let args = HighLevel.loadScript().args.slice(35);
    this.typeId = new Uint8Array(args.slice(0, 32));
    this.creatorLockScriptHash = new Uint8Array(args.slice(32, 64));
    this.goalAmount = numFromBytes(args.slice(64, 80));
    this.deadline = new Since(numFromBytes(args.slice(80, 88)));
    this.contributionType = new Uint8Array(args.slice(88, 120));
  }
}

// const to0x = (x: bigint) => (x < 0n ? "-0x" + (-x).toString(16) : "0x" + x.toString(16));

function checkDeadline(deadline: Since): boolean {
  const since = new Since(HighLevel.loadInputSince(0, bindings.SOURCE_INPUT));
  let ording = deadline.cmp(since);
  if (ording == null) {
    throw Error("deadline and since types do not match");
  }
  console.log(`ording: ${ording}`);

  return ording === 1;
}

function create(args: PorjectArgs) {
  console.log("Create crowdfunding");

  if (args.goalAmount === 0n) {
    throw Error("Args goalAmount is not 0");
  }
}

function success(args: PorjectArgs) {
  console.log("Crowdfunding success");
}

function fail(args: PorjectArgs) {

}

function main() {
  log.setLevel(log.LogLevel.Debug);
  HighLevel.checkTypeId(35);
  const status = getScriptStatus();

  let prjArgs = new PorjectArgs();
  if (checkDeadline(prjArgs.deadline)) {
    if (status == ScriptStatus.CREATED) {
      create(prjArgs);
    } else if (status == ScriptStatus.DESTROYED) {
      success(prjArgs);
    } else {
      throw Error("Project does not allow transactions ");
    }
  } else {
    if (status == ScriptStatus.DESTROYED) {
      fail(prjArgs);
    } else {
      throw Error("After Deadline, it can only be destroyed.")
    }
  }

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

