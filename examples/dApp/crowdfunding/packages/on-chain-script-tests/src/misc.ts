import { hexFrom, Hex, numLeToBytes } from "@ckb-ccc/core";

import { Since } from "@ckb-ccc/core";

import { zeroHash, joinHex } from "./tx_helper";

export const scriptProject = "../../contracts/project/dist/index.bc";
export const scriptContribution = "../../contracts/contribution/dist/index.bc";
export const scriptClaim = "../../contracts/claim/dist/index.bc";

export class ProjectArgs {
  constructor(
    public typeID: Hex = zeroHash(),
    public creatorLockScriptHash: Hex = zeroHash(),
    public goalAmount: bigint = BigInt(0),
    public deadline: Date = new Date(),
    public contributionType: Hex = zeroHash(),
  ) {
    // Ends after 100 days
    this.deadline.setDate(this.deadline.getDate() + 100);
  }

  args(): Hex {
    return joinHex(
      this.typeID,
      this.creatorLockScriptHash,
      hexFrom(numLeToBytes(this.goalAmount, 16)),
      hexFrom(
        new Since(
          "absolute",
          "timestamp",
          BigInt(this.deadline.getTime()),
        ).toBytes(),
      ),
      this.contributionType,
    );
  }
}
