import { AutocompleteData, BasicHGWOptions, NS, Server } from '@ns';
import { execShare } from './doshare';
import { HackStats } from './hud';
import { availableHackThreads, getRunnableServers, getServerAvailableThreads, getServers, GROW_SCRIPT, HACK_SCRIPT, HGW_RAM, MS_BETWEEN_OPERATIONS, WEAKEN_SCRIPT, WEAK_SEC } from '/tenderize';

export function autocomplete(data: AutocompleteData, args: string[]) {
  return [...data.servers]; // This script autocompletes the list of servers.
}

interface HWGWScript {
  script: string;
  offset: number;
  threads: number;
  executionTime: number;
}

export interface GenBatchesResult {
  server: Server;
  batches: HWGWBatch[];
  fTimes: FTimes;
  gain: number;
  hackTarget: number;
}

export interface FTimes {
  weaken: number;
  grow: number;
  hack: number;

  hOffset: number;
  hwOffset: number;
  gOffset: number;
  gwOffset: number;
}

function getFTimes(ns: NS, host: string | Server, offset: number = 0): FTimes {
  let hostname = '';
  if (typeof host === 'string') {
    hostname = host;
  } else {
    hostname = host.hostname;
  }

  const wTime = ns.getWeakenTime(hostname);
  const gTime = wTime / 5 * 4;
  const hTime = wTime / 4

  return {
    weaken: wTime,
    grow: gTime,
    hack: hTime,

    hOffset: wTime - hTime - MS_BETWEEN_OPERATIONS + offset,
    hwOffset: offset,
    gOffset: wTime - gTime + MS_BETWEEN_OPERATIONS + offset,
    gwOffset: (MS_BETWEEN_OPERATIONS * 2) + offset,
  }
}

export interface HWGWBatch {
  timing?: FTimes;
  hack: number;
  hWeaken: number;
  grow: number;
  gWeaken: number;

  gain: number;
  hackTarget: number;
}

export function totalBatchThreads(batch: HWGWBatch) {
  return batch.hack + batch.hWeaken + batch.grow + batch.gWeaken;
}

export function serverWeakened(ns: NS, target: Server | string) {
  const server = typeof target === "string" ? ns.getServer(target) : target;
  
  const minDifficulty = server.minDifficulty || 1;
  const hackDifficulty = server.hackDifficulty || 100;

  return hackDifficulty <= (minDifficulty + 0.01);
}

export function serverGrown(ns: NS, target: Server | string) {
  const server = typeof target === "string" ? ns.getServer(target) : target;

  const moneyMax = server.moneyMax || Number.MAX_SAFE_INTEGER
  const moneyAvailable = server.moneyAvailable || 1;

  return moneyAvailable >= (moneyMax - 100);
}

function genHWGWBatch(ns: NS, target: Server, availableThreads: number, baseHackTarget: number = 0.20): HWGWBatch {
  const hackPerThread = ns.hackAnalyze(target.hostname);
  let hackTarget = baseHackTarget;

  while (true) {
    const hackThreads = Math.floor(hackTarget / hackPerThread);
    const growthRequired = 1 / (1 - hackTarget)
    const growThreads = Math.ceil(ns.growthAnalyze(target.hostname, growthRequired)*1.1);
    const growWeakenThreads = Math.ceil(growThreads / 12.5);
    const hackWeakenThreads = Math.ceil(hackThreads / 25);

    const totalThreads = hackThreads + growThreads + growWeakenThreads + hackWeakenThreads;
    if (totalThreads <= availableThreads) {
      return {
        hack: hackThreads,
        hWeaken: hackWeakenThreads,
        grow: growThreads,
        gWeaken: growWeakenThreads,
        gain: hackPerThread * hackThreads * (target.moneyAvailable || 0) * ns.hackAnalyzeChance(target.hostname),
        hackTarget: hackTarget,
      }
    }
    hackTarget -= 0.005;

    if (hackTarget <= 0) break; 
  }

  return {
    hack: 0,
    hWeaken: 0,
    grow: 0,
    gWeaken: 0,
    gain: 0,
    hackTarget: 0
  };
}

function genWGWBatches(ns: NS, target: string | Server): GenBatchesResult {
  const batches: HWGWBatch[] = [];
  const server: Server = (typeof target === "string") ? ns.getServer(target) : target;
  
  const wTime = ns.getWeakenTime(server.hostname);
  const gTime = wTime / 5 * 4;
  
  let availableThreads = availableHackThreads(ns, false);
  
  if (!serverWeakened(ns, server)) {
    const minDifficulty = server.minDifficulty || 1;
    const hackDifficulty = server.hackDifficulty || 100;
    const weakenThreads = Math.min(Math.ceil((hackDifficulty - minDifficulty) / WEAK_SEC), availableThreads);
    availableThreads -= weakenThreads;

    batches.push({
      hack: 0,
      hWeaken: 0,
      grow: 0,
      gWeaken: weakenThreads,
      gain: 0,
      hackTarget: 0,
      timing: {
        weaken: wTime,
        grow: gTime,
        hack: 0,
    
        hOffset: 0,
        hwOffset: 0,
        gOffset: 0,
        gwOffset: 0,
      }
    });
  }

  if (!serverGrown(ns, server) && availableThreads > 0) {
    const weakenThreads = Math.ceil(availableThreads / 12.5);
    const growThreads = availableThreads - weakenThreads;

    batches.push({
      hack: 0,
      hWeaken: 0,
      grow: growThreads,
      gWeaken: weakenThreads,
      gain: 0,
      hackTarget: 0,
      timing: {
        weaken: wTime,
        grow: gTime,
        hack: 0,
    
        hOffset: 0,
        hwOffset: 0,
        gOffset: wTime - gTime + MS_BETWEEN_OPERATIONS,
        gwOffset: MS_BETWEEN_OPERATIONS * 2,
      }
    });
  }

  return {
    server: server,
    batches: batches,
    fTimes: getFTimes(ns, target, wTime + (MS_BETWEEN_OPERATIONS * 2)),
    gain: 0,
    hackTarget: 0,
  };
}

function genHWGWBatches(ns: NS, target: string | Server, availableThreads?: number, maxBatch: number = Number.MAX_SAFE_INTEGER): GenBatchesResult  {
  const batches: HWGWBatch[] = [];

  if (availableThreads === undefined) {
    availableThreads = availableHackThreads(ns, false);
  }

  const server: Server = (typeof target === "string") ? ns.getServer(target) : target;
  const fTimes = getFTimes(ns, server);
  let batch: HWGWBatch|undefined;
  let hackTarget = 0.2;
  while (availableThreads > 100 && batches.length < maxBatch) {
    if (batch === undefined || batch.gain === 0 || totalBatchThreads(batch) > availableThreads) {
      batch = genHWGWBatch(ns, server, availableThreads, hackTarget);
    } else {
      batch = structuredClone(batch);
    }

    if (batch) {
      batch.timing = structuredClone(fTimes)
      batches.push(batch);
      offsetFTimes(fTimes, MS_BETWEEN_OPERATIONS*4);

      availableThreads -= totalBatchThreads(batch);
    } else {
      break;
    }
  }

  return {
    server: server,
    batches: batches,
    fTimes: getFTimes(ns, target, batches.length * MS_BETWEEN_OPERATIONS * 4),
    gain: batches.reduce((out, b) => out + b.gain, 0),
    hackTarget: hackTarget
  };
}

export function offsetFTimes(fTimes: FTimes, offset: number) {
  fTimes.hOffset += offset;
  fTimes.hwOffset += offset;
  fTimes.gOffset += offset;
  fTimes.gwOffset += offset;
}

function moneyMax(ns: NS, host: string) {
  return ns.getServer(host).moneyMax || Number.MAX_SAFE_INTEGER;
}

function moneyAvailable(ns: NS, host: string) {
  return ns.getServer(host).moneyAvailable || 0;
}

function growProgressStr(ns: NS, host: string) {
  const avail = ns.formatNumber(moneyAvailable(ns, host), 3, 1000, true);
  const max = ns.formatNumber(moneyMax(ns, host), 3, 1000, true);
  return `${avail}$/${max}$`;
}

export async function executeBatches(ns: NS, result: GenBatchesResult, includeHacknet: boolean = false) {
  // extract scripts
  const scripts: HWGWScript[] = [];

  for (const batch of result.batches) {
    if (batch.gWeaken > 0) {
      scripts.push({
        script: WEAKEN_SCRIPT,
        offset: batch.timing?.gwOffset || 0,
        threads: batch.gWeaken,
        executionTime: (batch.timing?.gwOffset || 0) + (batch.timing?.weaken || 0)
      });
    }

    if (batch.hWeaken > 0) {
      scripts.push({
        script: WEAKEN_SCRIPT,
        offset: batch.timing?.hwOffset || 0,
        threads: batch.hWeaken,
        executionTime: (batch.timing?.hwOffset || 0) + (batch.timing?.weaken || 0)
      });
    }
  }

  for (const batch of result.batches) {
    if (batch.grow > 0) {
      scripts.push({
        script: GROW_SCRIPT,
        offset: batch.timing?.gOffset || 0,
        threads: batch.grow,
        executionTime: (batch.timing?.gOffset || 0) + (batch.timing?.grow || 0)
      });
    }
  }

  for (const batch of result.batches) {
    if (batch.hack > 0) {
      scripts.push({
        script: HACK_SCRIPT,
        offset: batch.timing?.hOffset || 0,
        threads: batch.hack,
        executionTime: (batch.timing?.hOffset || 0) + (batch.timing?.hack || 0)
      });
    }
  }

  // execute scripts
  let maxExecTime = 0;
  for (const script of scripts) {
    for (const server of getRunnableServers(ns, includeHacknet).sort((a, b) => b.cpuCores - a.cpuCores)) {
      let threads = getServerAvailableThreads(ns, server);
      const execThreads = Math.min(threads, script.threads);
      script.threads -= execThreads;

      const opts = JSON.stringify({ threads: execThreads, additionalMsec: script.offset } as BasicHGWOptions);
      ns.exec(script.script, server.hostname, execThreads, result.server.hostname, opts);

      if (script.executionTime > maxExecTime)
        maxExecTime = script.executionTime;

      if (script.threads === 0)
        break;
    }
  }

  const time = (new Date()).getTime();
  const hackStats: HackStats = {
    target: result.server.hostname,
    start: time,
    begin: time + (result.batches[0].timing?.weaken || 0),
    end: time + maxExecTime + 40,
    gainRate: result.gain,
  };
  ns.clearPort(1);
  ns.writePort(1, JSON.stringify(hackStats));

  // await ns.sleep(maxExecTime + 40);

  while ((new Date()).getTime() < hackStats.end) {
    await execShare(ns, hackStats.end);
  }

  await ns.sleep(100);
}

export async function main(ns: NS): Promise<void>  {
  let target = "phantasy";

  if(typeof ns.args[0] === "string") {
    target = ns.args[0];
    ns.getServer(target);
  }

  if (ns.hackAnalyze(target) === 0) {
    ns.tprint(`ERROR: Hack skill too low to hack ${target} (${ns.getPlayer().skills.hacking} < ${ns.getServer(target).requiredHackingSkill})`);
    return;
  }

  while (true) {
    if (!serverWeakened(ns, target) || !serverGrown(ns, target)) {
      const result = genWGWBatches(ns, target);
      const growThreads = result.batches.reduce((out, b) => b.grow + out, 0);
      const weakenThreads = result.batches.reduce((out, b) => b.gWeaken + out, 0);
      ns.tprint(`Weakening/Growing ${target} (${growProgressStr(ns, target)}) over ${ns.tFormat(result.fTimes.weaken)} with ${growThreads}g/${weakenThreads}w threads`);
      await executeBatches(ns, result);
      ns.tprint(`Grew ${target} (${growProgressStr(ns, target)})`);
      continue;
    }

    // hack
    const result = genHWGWBatches(ns, target, undefined, 5000);
    ns.tprint(`Hacking ${target} for $${ns.formatNumber(result.gain)} over ${ns.tFormat(result.fTimes.weaken + result.fTimes.hwOffset)} in ${result.batches.length} cycles`);
    await executeBatches(ns, result);

    // ns.run("test.js",1, 1);
    // await ns.sleep(100);
    // ns.run("tenderize.js");
    // await ns.sleep(100);
  }
}