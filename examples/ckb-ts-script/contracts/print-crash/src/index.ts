import * as bindings from "@ckb-js-std/bindings";

export function logError(e: unknown): void {
  const root = e instanceof Error ? e : new Error(String(e));
  const lines: string[] = [];
  const dump = (err: any, prefix = "") => {
    lines.push(prefix + (err?.stack || `${err?.name || "Error"}: ${err?.message || String(err)}`));
    if (err instanceof AggregateError && Array.isArray(err.errors)) {
      for (let i = 0; i < err.errors.length; i++) dump(err.errors[i], prefix + `  [${i}] `);
    }
    if (err?.cause) dump(err.cause, prefix + "Caused by: ");
  };
  dump(root);
  console.log(lines.join("\n"));
}

function main(): void {
  try {
    step1();
  } catch (e) {
    throw new Error("main failed", { cause: e as any });
  }
}

function step1() { step2(); }
function step2() {
  const err: any = new Error("crash at step2");
  err.code = "E_STEP2";
  throw err;
}

try {
  main();
} catch (e) {
  logError(e);
}

bindings.exit(-2);