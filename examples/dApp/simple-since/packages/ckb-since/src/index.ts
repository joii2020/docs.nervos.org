
export class Since {
    public raw: bigint;

    static readonly VALUE_MASK = 0xffff_ffff_ffff_ffffn;
    static readonly METRIC_TYPE_FLAG_MASK = 0b1110_0000n;
    static readonly LOCK_BY_BLOCK_NUMBER_MASK = 0b0000_0000n;         // 0b0000_0000
    static readonly LOCK_BY_EPOCH_MASK = 0b0010_0000n;         // 0b0010_0000
    static readonly LOCK_BY_TIMESTAMP_MASK = 0b0100_0000n;         // 0b0100_0000

    constructor(v: bigint | undefined) {
        this.raw = v ? v : BigInt(0);
    }

    extractLockValue(): LockValue | undefined {
        const value = this.raw & Since.VALUE_MASK;
        const metric = this.raw & Since.METRIC_TYPE_FLAG_MASK;

        if (metric === Since.LOCK_BY_BLOCK_NUMBER_MASK) {
            return { kind: "BlockNumber", value };
        }
        if (metric === Since.LOCK_BY_EPOCH_MASK) {
            return {
                kind: "EpochNumberWithFraction",
                value: EpochNumberWithFraction.fromFullValue(value),
            };
        }
        if (metric === Since.LOCK_BY_TIMESTAMP_MASK) {
            return { kind: "Timestamp", value: value * 1000n }; // ms
        }
        return undefined;
    }
}

class EpochNumberWithFraction {
    constructor(public readonly full: bigint) { }

    static readonly NUMBER_BITS = 24n;
    static readonly INDEX_BITS = 16n;
    static readonly LENGTH_BITS = 16n;

    static readonly NUMBER_MASK = (1n << EpochNumberWithFraction.NUMBER_BITS) - 1n;   // 24 bits
    static readonly INDEX_MASK = (1n << EpochNumberWithFraction.INDEX_BITS) - 1n;   // 16 bits
    static readonly LENGTH_MASK = (1n << EpochNumberWithFraction.LENGTH_BITS) - 1n;   // 16 bits

    static readonly NUMBER_OFFSET = 0n;
    static readonly INDEX_OFFSET = EpochNumberWithFraction.NUMBER_BITS;                     // 24
    static readonly LENGTH_OFFSET = EpochNumberWithFraction.NUMBER_BITS + EpochNumberWithFraction.INDEX_BITS; // 40

    static fromFullValue(value: bigint): EpochNumberWithFraction {
        const e = new EpochNumberWithFraction(value);
        if (e.length() === 0n) {
            const fixed = (1n << EpochNumberWithFraction.LENGTH_OFFSET)
                | (e.number() << EpochNumberWithFraction.NUMBER_OFFSET);
            return new EpochNumberWithFraction(fixed);
        }
        return e;
    }

    number(): bigint {
        return (this.full >> EpochNumberWithFraction.NUMBER_OFFSET) & EpochNumberWithFraction.NUMBER_MASK;
    }
    index(): bigint {
        return (this.full >> EpochNumberWithFraction.INDEX_OFFSET) & EpochNumberWithFraction.INDEX_MASK;
    }
    length(): bigint {
        return (this.full >> EpochNumberWithFraction.LENGTH_OFFSET) & EpochNumberWithFraction.LENGTH_MASK;
    }
}
export function geEpoch(a: EpochNumberWithFraction, b: EpochNumberWithFraction): boolean {
    const an = a.number(), bn = b.number();
    if (an !== bn) return an > bn;
    const blockA = a.index() * b.length();
    const blockB = b.index() * a.length();
    return blockA >= blockB;
}

type LockValue =
    | { kind: "BlockNumber"; value: bigint }
    | { kind: "EpochNumberWithFraction"; value: EpochNumberWithFraction }
    | { kind: "Timestamp"; value: bigint };


export function isMature(now: Since, need: Since): boolean {
    let nowLockVal = now.extractLockValue();
    if (nowLockVal == undefined) {
        return false;
    }
    let needLockVal = need.extractLockValue();
    if (needLockVal == undefined) {
        return false;
    }

    if (nowLockVal.kind != needLockVal.kind) {
        return false;
    }

    switch (nowLockVal.kind) {
        case "BlockNumber":
        case "Timestamp":
            return nowLockVal.value >= (needLockVal as typeof nowLockVal).value;
        case "EpochNumberWithFraction":
            return geEpoch(nowLockVal.value, (needLockVal as typeof nowLockVal).value);
    }
}
