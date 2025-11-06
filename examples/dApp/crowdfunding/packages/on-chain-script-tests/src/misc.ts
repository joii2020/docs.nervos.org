import { hexFrom, Transaction, Script, Cell, Hex, hashCkb, } from "@ckb-ccc/core";
import * as ccc from "@ckb-ccc/core";
import { readFileSync } from "fs";
import {
    Resource,
    DEFAULT_SCRIPT_ALWAYS_SUCCESS,
    DEFAULT_SCRIPT_CKB_JS_VM,
} from "ckb-testtool";
import { randomBytes } from "node:crypto";
import * as node_path from "node:path";

export const scriptProject = "../../contracts/project/dist/index.bc"
export const scriptContribution = "../../contracts/contribution/dist/index.bc"
export const scriptClaim = "../../contracts/claim/dist/index.bc"

export function zeroHash(): Hex {
    return hexFrom("0x0000000000000000000000000000000000000000000000000000000000000000");
}

export function generateRandHash(): Hex {
    const buf = randomBytes(32);
    return hexFrom(buf);
}
