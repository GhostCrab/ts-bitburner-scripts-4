import { AutocompleteData, FactionWorkType, NS } from "@ns";
import { getEvals } from "./eval";
import { joinFaction } from "./faction";
import { waitForPID } from "./util";

export function autocomplete(data: AutocompleteData, args: string[]) {
  return [...data.servers]; // This script autocompletes the list of servers.
}

function processRunning(ns: NS, script: string) {
  const procs = ns.ps();
  for (const proc of procs) {
    // ns.tprintf(`Checking ${proc.filename}`);
    if (proc.filename === script) {
      return true;
    }
  }

  return false;
}

export async function main(ns: NS): Promise<void> {
  while (true) {
    if (!processRunning(ns, "shf.js")) {
      await waitForPID(ns, ns.run("ba.js"));
      
      let target = "";
      if (ns.args.length > 0) {
        target = ns.args[0].toString();
      }
      else {
        target = (await getEvals(ns))[0].server.hostname;
      }
      ns.run("shf.js", 1, target);
    }

    const work = ns.singularity.getCurrentWork();


    // await joinFaction(ns, "The Black Hand", "hacking" as FactionWorkType, false);

    if (work && work.type === "FACTION" && work.factionName === "NiteSec" && ns.singularity.getFactionRep("NiteSec") > 45000) {
      await joinFaction(ns, "The Black Hand", "hacking" as FactionWorkType, false);
    }

    if (work && work.type === "FACTION" && work.factionName === "The Black Hand" && ns.singularity.getFactionRep("The Black Hand") > 100000) {
      await joinFaction(ns, "BitRunners", "hacking" as FactionWorkType, false);
    }

    await ns.sleep(50);
  }
}
