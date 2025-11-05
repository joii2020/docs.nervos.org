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

export class txHelper {
    constructor(
        public debugJsCode: boolean = false,
        public resource: Resource = Resource.default(),
        private jsCode: Map<string, Cell> = new Map(),
        private alwaySucArgs: Map<string, Hex> = new Map(),
    ) { }

    appendCell(path: string): Cell {
        const data = hexFrom(readFileSync(path));

        for (let [_, cell] of this.resource.cells) {
            if (cell.outputData == data) {
                return cell;
            }
        }

        if (this.debugJsCode) {
            return this.resource.mockDebugCellAsCellDep(path);
        } else {
            return this.resource.mockCell(
                this.resource.createScriptUnused(),
                undefined,
                data,
            );
        }
    }

    createScript(path: string, args: Hex = "0x"): Script {
        const cell = this.appendCell(path);
        return this.resource.createScriptByData(
            cell,
            args,
        );
    }

    createJsScript(path: string, args: Hex = "0x"): Script {
        if (this.debugJsCode) {
            const { dir, name, ext } = node_path.parse(path);
            if (ext.toLowerCase() == ".bc") {
                path = node_path.join(dir, `${name}.debug.js`);
            } else {
                throw `Unknow js script: ${path}`;
            }
        }

        const jsCodeCell = this.appendCell(path);
        const jsCodeHash = hashCkb(jsCodeCell.outputData);
        this.jsCode.set(path, jsCodeCell);

        const scriptArgs = joinHex(hexFrom("0x0000"), jsCodeHash, hexFrom(ccc.hashTypeToBytes("data2")), args);
        return this.createScript(DEFAULT_SCRIPT_CKB_JS_VM, scriptArgs);
    }

    createAlwaySuc(name: string | undefined): Script {
        if (name == undefined) {
            return this.createScript(DEFAULT_SCRIPT_ALWAYS_SUCCESS);
        }

        let args = this.alwaySucArgs.get(name);

        if (args == undefined) {
            args = hexFrom(randomBytes(32));
            this.alwaySucArgs.set(name, args);
        }
        return this.createScript(DEFAULT_SCRIPT_ALWAYS_SUCCESS, args);
    }

    getCell(script: Script): Cell {
        let codeHash = script.codeHash;
        for (let [_, cell] of this.resource.cells) {
            if (script.hashType == "type") {
                let hash = cell.cellOutput.type?.hash();
                if (hash == codeHash) {
                    return cell
                }
            } else {
                let hash = hashCkb(cell.outputData);
                if (hash == codeHash) {
                    return cell;
                }
            }
        }
        throw "Unknow Script"
    }

    getCellByInput(input: ccc.CellInput): Cell {
        let cell = this.resource.cells.get(input.previousOutput.toBytes().toString());
        if (cell == undefined) {
            throw "Unknow cell wiht inputs";
        }
        return cell;
    }

    updateScriptDeps(tx: Transaction): Transaction {
        let deps: Map<Hex, ccc.CellDep> = new Map();
        for (let dep of tx.cellDeps) {
            let cell = this.resource.cells.get(dep.outPoint.toBytes().toString());
            if (cell == undefined) {
                throw "Unknow input cell";
            }
            deps.set(hashCkb(cell?.outputData), dep);
        }

        for (let it of tx.inputs) {
            let cell = this.getCellByInput(it);

            let lockCell = this.getCell(cell.cellOutput.lock);
            let dataHash = hashCkb(lockCell.outputData);
            if (deps.get(dataHash) == undefined) {
                deps.set(
                    dataHash,
                    Resource.createCellDep(lockCell, "code"));
            }

            if (cell.cellOutput.type == undefined) {
                continue;
            }
            let typeCell = this.getCell(cell.cellOutput.type);
            dataHash = hashCkb(typeCell.outputData);
            if (deps.get(dataHash) == undefined) {
                deps.set(
                    dataHash,
                    Resource.createCellDep(typeCell, "code"));
            }
        }

        for (let cell of tx.outputCells) {
            if (cell.cellOutput.type == undefined) {
                continue;
            }
            let dataHash = hashCkb(cell.outputData);
            if (deps.get(dataHash) == undefined) {
                deps.set(dataHash, Resource.createCellDep(
                    this.getCell(cell.cellOutput.type),
                    "code"));
            }
        }

        for (let [_, cell] of this.jsCode) {
            let dataHash = hashCkb(cell.outputData);
            if (deps.get(dataHash) == undefined) {
                deps.set(dataHash, Resource.createCellDep(cell, "code"));
            }
        }

        for (let [_, d] of deps) {
            tx.addCellDeps(d);
        }

        return tx;
    }

    setTypeID(tx: Transaction, scriptHash: Hex, argsOffset: number, isJsVm: boolean = false): Transaction {
        let getTypeID = (index: number) => {
            let input = tx.inputs[index];

            let hasher = new ccc.HasherCkb();

            hasher.update(input.toBytes());
            hasher.update(ccc.numLeToBytes(index, 8));

            return hasher.digest();
        };

        if (isJsVm == true) {
            argsOffset += 35;
        }

        for (let index = 0; index < tx.outputs.length; index++) {
            let cell = tx.outputs[index];
            let typeScript = cell.type;
            if (typeScript == undefined || typeScript.hash() != scriptHash) {
                continue;
            }
            let typeId = getTypeID(index).slice(0);
            let srcArgs = typeScript.args.slice(2);

            let args = "0x" + srcArgs.slice(0, argsOffset * 2) + typeId.slice(2) + srcArgs.slice((argsOffset + 32) * 2);
            typeScript.args = hexFrom(args);
            tx.outputs[index].type = typeScript;
        }

        return tx;
    }
}

export function zeroHash(): Hex {
    return hexFrom("0x0000000000000000000000000000000000000000000000000000000000000000");
}

export function generateRandHash(): Hex {
    const buf = randomBytes(32);
    return hexFrom(buf);
}

export function joinHex(a: Hex, b: Hex, ...rest: Hex[]): Hex {
    let result = a + b.slice(2);
    for (const h of rest) result += h.slice(2);
    return hexFrom(result);
}
