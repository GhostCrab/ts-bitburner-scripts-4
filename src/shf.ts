import { AutocompleteData, NS, Player, Server } from '@ns';
import { executeBatches, FTimes, GenBatchesResult, HWGWBatch, offsetFTimes, totalBatchThreads } from './sh';
import { waitForPID } from './util';
import { availableHackThreads, MS_BETWEEN_OPERATIONS, WEAK_SEC } from '/tenderize';

// 1 weaken thread weakens security by 0.05
// 1 grow thread grows security by 0.004
// 1 hack thread grows security by 0.002
// 1 weaken thread for every 25 hack threads
// 1 weaken thrad for every 12.5 grow threads

export function autocomplete(data: AutocompleteData, args: string[]) {
  return [...data.servers]; // This script autocompletes the list of servers.
}

function getFTimes(ns: NS, server: Server, player: Player = ns.getPlayer(), offset: number = 0): FTimes {
  const wTime = ns.formulas.hacking.weakenTime(server, player);
  const gTime = wTime / 5 * 4;
  const hTime = wTime / 4;

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

function serverWeakened(server: Server) {
  const minDifficulty = server.minDifficulty || 1;
  const hackDifficulty = server.hackDifficulty || 100;

  return hackDifficulty <= (minDifficulty + 0.01);
}

function serverGrown(server: Server) {
  const moneyMax = server.moneyMax || Number.MAX_SAFE_INTEGER
  const moneyAvailable = server.moneyAvailable || 1;

  return moneyAvailable >= (moneyMax - 100);
}

function genHWGWBatch(ns: NS, target: Server, availableThreads: number, hackTarget: number = 0.2): HWGWBatch|undefined {
  if (ns.getPlayer().skills.hacking < (ns.getServer(target.hostname).requiredHackingSkill || 0)) {
    return;
  }

  if (!serverWeakened(target)) {
    // just going to be a W cycle
    const minDifficulty = target.minDifficulty || 1;
    const hackDifficulty = target.hackDifficulty || 100;
    const weakenThreads = Math.min(Math.ceil((hackDifficulty - minDifficulty) / WEAK_SEC), availableThreads);

    target.hackDifficulty = Math.max(minDifficulty, hackDifficulty - (weakenThreads * WEAK_SEC));

    // ns.tprint(`0/0/0/${weakenThreads} (${weakenThreads}/${availableThreads})`);

    return {
      hack: 0,
      hWeaken: 0,
      grow: 0,
      gWeaken: weakenThreads,
      gain: 0,
      hackTarget: 0,
    };
  }

  if (!serverGrown(target)) {
    let growThreads = Math.min(
      ns.formulas.hacking.growThreads(target, ns.getPlayer(), target.moneyMax || Number.MAX_SAFE_INTEGER),
      availableThreads
    );

    const growWeakenThreads = Math.ceil(growThreads / 12.5);
    if (growThreads + growWeakenThreads > availableThreads) {
      growThreads = availableThreads - growWeakenThreads;
    }

    target.moneyAvailable = Math.min(
      target.moneyMax || Number.MAX_SAFE_INTEGER,
      ns.formulas.hacking.growAmount(target, ns.getPlayer(), growThreads)
    );

    // ns.tprint(`0/0/${growThreads}/${growWeakenThreads} (${growThreads+growWeakenThreads}/${availableThreads})`);

    return {
      hack: 0,
      hWeaken: 0,
      grow: growThreads,
      gWeaken: growWeakenThreads,
      gain: 0,
      hackTarget: 0
    }
  }

  const hackPerThread = ns.formulas.hacking.hackPercent(target, ns.getPlayer());
  if (hackPerThread <= 0) return;

  while (true) {
    const tmpTarget: Server = structuredClone(target);
    tmpTarget.moneyAvailable = tmpTarget.moneyAvailable || 1000;
    tmpTarget.moneyMax = tmpTarget.moneyMax || 1000;

    const hackThreads = Math.floor(hackTarget / hackPerThread);
    tmpTarget.moneyAvailable = tmpTarget.moneyAvailable - (hackPerThread * hackThreads * tmpTarget.moneyAvailable);
    
    const growThreads = Math.ceil(
      ns.formulas.hacking.growThreads(tmpTarget, ns.getPlayer(), tmpTarget.moneyMax) * 1.5
    );
    const growWeakenThreads = Math.ceil(growThreads / 12.5);
    const hackWeakenThreads = Math.ceil(hackThreads / 25);

    const totalThreads = hackThreads + growThreads + growWeakenThreads + hackWeakenThreads;
    if (totalThreads <= availableThreads) {
      // ns.tprint(`${hackThreads}/${hackWeakenThreads}/${growThreads}/${growWeakenThreads} (${totalThreads}/${availableThreads}) -- $${ns.formatNumber(hackPerThread * hackThreads * (target.moneyAvailable || 1))} (${hackTarget.toFixed(3)}%)`);
      return {
        hack: hackThreads,
        hWeaken: hackWeakenThreads,
        grow: growThreads,
        gWeaken: growWeakenThreads,
        gain: hackPerThread * hackThreads * (target.moneyAvailable || 1) * ns.formulas.hacking.hackChance(target, ns.getPlayer()),
        hackTarget: hackTarget,
      }
    }
    hackTarget -= 0.005;

    if (hackTarget <= 0) break; 
  }

  return;
}

export async function genHWGWBatches(ns: NS, target: string | Server, availableThreads?: number, maxBatch: number = Number.MAX_SAFE_INTEGER, doClimb: boolean = true): Promise<GenBatchesResult>  {
  const batches: HWGWBatch[] = [];

  if (availableThreads === undefined) {
    availableThreads = availableHackThreads(ns);
  }

  const mockServer: Server = (typeof target === "string") ? ns.getServer(target) : target;
  const fTimes = getFTimes(ns, mockServer);
  let batch: HWGWBatch|undefined;
  const baseHackTarget = 0.10;
  while (availableThreads > 10 && batches.length < maxBatch) {
    if (batches.length % 997 === 0) await ns.sleep(1);

    if (batch === undefined || batch.gain === 0 || totalBatchThreads(batch) > availableThreads) {
      batch = genHWGWBatch(ns, mockServer, availableThreads, baseHackTarget);
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
    server: mockServer,
    batches: batches,
    fTimes: fTimes,
    gain: batches.reduce((out, b) => out + b.gain, 0),
    hackTarget: batches.length > 2 ? batches[1].hackTarget : 0
  };
}

export async function main(ns: NS): Promise<void>  {
  // const flags = ns.flags([
  //   ['reserve', 0],
  // ])
  // let target = "";

  // if(flags._.length === "string") {
  //   target = ns.args[0];
  //   ns.getServer(target);
  // }

  let target = "phantasy";

  if(typeof ns.args[0] === "string") {
    target = ns.args[0];
    ns.getServer(target);
  }

  if (ns.getPlayer().skills.hacking < (ns.getServer(target).requiredHackingSkill || 0)) {
    ns.tprint(`ERROR: Hack skill too low to hack ${target} (${ns.getPlayer().skills.hacking} < ${ns.getServer(target).requiredHackingSkill})`);
    return;
  }

  do {
    const result = await genHWGWBatches(ns, target, undefined, 5000);
    ns.tprint(`Hacking ${target} for $${ns.formatNumber(result.gain)} over ${ns.tFormat(result.fTimes.weaken + result.fTimes.hwOffset)} in ${result.batches.length} cycles`);
    await executeBatches(ns, result);

    while(ns.singularity.upgradeHomeRam());
    await waitForPID(ns, ns.run("pserver.js", 1, 1));
    await waitForPID(ns, ns.run("cct.js"));
  } while (false);
}