import { NS } from "@ns";
import { HackStats } from "./hud";
import { availableShareThreads, getRunnableServers, getServerAvailableShareThreads, getServers, MS_BETWEEN_OPERATIONS, SHARE_SCRIPT } from "./tenderize";
import { waitForPID } from "./util";

export interface ShareStats {
  threads: number;
  power: number;
}

export async function execShare(ns: NS, endTime?: number) {
  let pid = 0;
  let totalThreads = 0
  let maxThreads = Math.floor(availableShareThreads(ns, true));
  for (const server of getRunnableServers(ns).sort((a, b) => a.maxRam - b.maxRam)) {
    let threads = getServerAvailableShareThreads(ns, server);
    if (threads > maxThreads) {
      threads = maxThreads;
    }

    maxThreads -= threads;

    if (threads > 0) {
      totalThreads += threads;
      pid = ns.exec(SHARE_SCRIPT, server.hostname, threads);
    }

    if (maxThreads <= 0) break;
  }

  if (pid === 0) {
    // ns.tprintf("no threads to share")
    await ns.sleep(100);
  } else {
    // ns.tprintf(`Sharing ${totalThreads} Threads`)
    await ns.sleep(100);
    const stats: ShareStats = {
      threads: totalThreads,
      power: 0
    };

    ns.clearPort(2);
    ns.writePort(2, JSON.stringify(stats));

    while (ns.isRunning(pid)) {
      await ns.sleep(MS_BETWEEN_OPERATIONS);

      if (endTime && (new Date()).getTime() > endTime) {
        for (const server of getServers(ns)) {
          for (const p of ns.ps(server.hostname)) {
            if (p.filename === "share.js") {
              ns.kill(p.pid);
            }
          }
        }
        break;
      }
    }
  }

  ns.clearPort(2);
  return totalThreads;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog('disableLog');
  ns.disableLog('ALL');

  ns.atExit(function () { ns.clearPort(2); });
  
  while (true) {
    await execShare(ns);
    await waitForPID(ns, ns.run("cct.js"));
  }
}
