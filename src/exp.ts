import { NS, Server } from "@ns";
import { executeBatches, FTimes, GenBatchesResult, HWGWBatch } from "./sh";
import { availableHackThreads, tenderize, WEAK_SEC } from "./tenderize";

function genExpBatch(ns: NS, target: string | Server): GenBatchesResult {
  const server: Server = (typeof target === "string") ? ns.getServer(target) : target;
  
  const wTime = ns.getWeakenTime(server.hostname);
  
  const timing: FTimes = {
    weaken: wTime,
    grow: 0,
    hack: 0,

    hOffset: 0,
    hwOffset: 0,
    gOffset: 0,
    gwOffset: 0,
  };

  const batch: HWGWBatch = {
    hack: 0,
    hWeaken: 0,
    grow: 0,
    gWeaken: availableHackThreads(ns, true),
    gain: 0,
    timing: timing ,
    hackTarget: 0
  };

  return {
    server: server,
    batches: [batch],
    fTimes: timing,
    gain: 0,
    hackTarget: 0
  };
}

export async function main(ns: NS): Promise<void> {
  tenderize(ns);
  while (true) {
    const batchResult = genExpBatch(ns, "foodnstuff");
    await executeBatches(ns, batchResult, false);
  }
}
