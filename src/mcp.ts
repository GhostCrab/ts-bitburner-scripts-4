import { AutocompleteData, FactionWorkType, NS } from "@ns";
import { getEvals } from "./eval";
import { joinFaction } from "./faction";
import { tenderize } from "./tenderize";
import { waitForPID } from "./util";

export function autocomplete(data: AutocompleteData, args: string[]) {
  return [...data.servers]; // This script autocompletes the list of servers.
}

export function processRunning(ns: NS, script: string) {
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
  const start = Date.now();
  while (true) {
    if (!processRunning(ns, "shf.js")) {
      tenderize(ns);
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

    // if (!processRunning(ns, "hn.js") && (Date.now() - start) > 2*60*60*1000) {
    //   ns.run("hn.js", 1);
    // }

    const work = ns.singularity.getCurrentWork();


    const mult = ns.getBitNodeMultipliers().AugmentationRepCost;

    if (work === null) {
      await joinFaction(ns, "BitRunners", "hacking" as FactionWorkType, false);
    }

    if (work && work.type === "FACTION" && work.factionName === "Netburners" && ns.singularity.getFactionRep("Netburners") > 12500 * mult) {
      await joinFaction(ns, "Sector-12", "hacking" as FactionWorkType, false);
    }

    if (work && work.type === "FACTION" && work.factionName === "Sector-12" && ns.singularity.getFactionRep("Sector-12") > 50000 * mult) {
      await joinFaction(ns, "Tian Di Hui", "hacking" as FactionWorkType, false);
    }

    if (work && work.type === "FACTION" && work.factionName === "Tian Di Hui" && ns.singularity.getFactionRep("Tian Di Hui") > 75000 * mult) {
      await joinFaction(ns, "CyberSec", "hacking" as FactionWorkType, false);
    }

    if (work && work.type === "FACTION" && work.factionName === "CyberSec" && ns.singularity.getFactionRep("CyberSec") > 10000 * mult) {
      await joinFaction(ns, "NiteSec", "hacking" as FactionWorkType, false);
    }

    if (work && work.type === "FACTION" && work.factionName === "NiteSec" && ns.singularity.getFactionRep("NiteSec") > 45000 * mult) {
      await joinFaction(ns, "The Black Hand", "hacking" as FactionWorkType, false);
    }

    if (work && work.type === "FACTION" && work.factionName === "The Black Hand" && ns.singularity.getFactionRep("The Black Hand") > 100000 * mult) {
      await joinFaction(ns, "BitRunners", "hacking" as FactionWorkType, false);
    }

    await ns.sleep(50);
  }
}
