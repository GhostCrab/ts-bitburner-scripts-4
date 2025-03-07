import { BasicHGWOptions, NS } from '@ns';

export async function main(ns: NS): Promise<void>  {
  ns.disableLog('disableLog');
  ns.disableLog('ALL');

  let target = "n00dles";
  if (typeof ns.args[0] === "string") {
    target = ns.args[0];
  }

  let opts: BasicHGWOptions = {}
  if (typeof ns.args[1] === "string") {
    opts = JSON.parse(ns.args[1]);
  }

  const msOffset = opts.additionalMsec?opts.additionalMsec:0;
  const threads = opts.threads?opts.threads:1;
  // ns.print(`Weakening ${target} with ${threads} thread(s) with an offset of ${msOffset}ms`);

  const start = new Date().getTime();
  const result = await ns.weaken(target, opts);
  const duration = (new Date().getTime() - start) - msOffset;

  // ns.print(`Weakened ${target} by ${ns.formatNumber(result)} in ${ns.tFormat(duration)}`);
}