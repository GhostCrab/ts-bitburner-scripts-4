import { AutocompleteData, NS, Server } from "@ns";
import { PrintTable, DefaultStyle, ColorPrint } from "tables";
import { GenBatchesResult } from "./sh";
import { genHWGWBatches } from "./shf";
import { availableHackThreads, exploit, getServers, hasAdminRights, nukable, nuke, tenderize } from "./tenderize";

export function autocomplete(data: AutocompleteData, args: string[]) {
  return [...data.servers]; // This script autocompletes the list of servers.
}

export function formatTime(time: number, showms = false): string {
  const ms = time % 1000;
  const seconds = Math.floor(time / 1000) % 60;
  const minutes = Math.floor(time / 1000 / 60) % 60;
  const hours = Math.floor(time / 1000 / 60 / 60);

  if (showms)
    return `${(minutes > 0 ? minutes.toFixed(0) + ':' : '')}${seconds.toFixed(0).padStart(2, '0')}.${ms.toFixed(0).padStart(3, '0')}`;
  
  return `${(hours > 0 ? hours.toFixed(0) + ':' : '')}${((minutes > 0 || hours > 0) ? minutes.toFixed(0).padStart(2, '0') + ':' : '--:')}${seconds.toFixed(0).padStart(2, '0')}`;
}

interface ServerEval {
  server: Server,
  initBatches: GenBatchesResult,
  initRate: number,
  batches: GenBatchesResult,
  rate: number,
}

export async function getEvals(ns: NS, target?: Server) {
  let targets: Server[] = [];
  if (target) {
    targets = [target]
  } else {
    targets = getServers(ns).filter(s => (s.moneyMax || 0) > 1);
  }
  let serverEvals: ServerEval[] = [];
  for (const target of targets) {
    const initBatches = await genHWGWBatches(ns, target, availableHackThreads(ns, true), 10, false);
    target.hackDifficulty = target.minDifficulty;
    target.moneyAvailable = target.moneyMax;
    const batches = await genHWGWBatches(ns, target, availableHackThreads(ns, true), 1000, false);
    serverEvals.push({
      server: target,
      initBatches: initBatches,
      initRate: initBatches.gain / (initBatches.fTimes.weaken + initBatches.fTimes.hwOffset) * 1000,
      batches: batches,
      rate: batches.gain / (batches.fTimes.weaken + batches.fTimes.hwOffset) * 1000,
    });
  }

  serverEvals = serverEvals.filter(s => (s.rate > 1)).sort((a, b) => b.rate - a.rate);

  return serverEvals;
}

export async function main(ns: NS): Promise<void> {
  tenderize(ns);

  let target: Server | undefined = undefined;
  if (ns.args.length > 0 && typeof ns.args[0] === "string") {
    target = ns.getServer(ns.args[0]);
  }

  const serverEvals = await getEvals(ns, target);

  const data = serverEvals.map(s => [
      { color: 'white', text: s.server.hostname },
      { color: 'white', text: s.server.requiredHackingSkill },
      { color: 'white', text: `${Math.round(ns.getServer(s.server.hostname).hackDifficulty || 0)}/${ns.getServer(s.server.hostname).minDifficulty}` },
      { color: 'white', text: `$${ns.formatNumber(ns.getServer(s.server.hostname).moneyAvailable || 0)}/$${ns.formatNumber(ns.getServer(s.server.hostname).moneyMax || 0)}` },
      { color: 'white', text: `$${ns.formatNumber(s.batches.gain)}`},
      { color: 'white', text: `$${ns.formatNumber(s.rate)}/s`},
      // { color: 'white', text: `${formatTime(s.initBatches.fTimes.weaken)}/${formatTime(s.initBatches.fTimes.weaken + s.initBatches.fTimes.hwOffset)}` },
      // { color: 'white', text: `${formatTime(s.batches.fTimes.weaken)}/${formatTime(s.batches.fTimes.weaken + s.batches.fTimes.hwOffset)}` },
      { color: 'white', text: `${formatTime(s.initBatches.fTimes.weaken)}` },
      { color: 'white', text: `${formatTime(s.batches.fTimes.weaken)}` },
      { color: 'white', text: s.batches.batches.length },
    ]
  );

  const columns = [
    { header: 'Server', width: 20 },
    { header: 'Skill', width: 6 },
    { header: 'Diff', width: 6 },
    { header: 'Cash', width: 20 },
    { header: 'Gain', width: 10 },
    { header: 'Rate', width: 12 },
    { header: 'Init Time', width: 10 },
    { header: 'Time', width: 10 },
    { header: 'Cycles', width: 7 },
    // { header: 'Backdoor', width: 10 },
    // { header: 'Admin', width: 10 },
  ];

  PrintTable(ns, data, columns, DefaultStyle(), ColorPrint);
}
