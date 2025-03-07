import { AutocompleteData, FactionWorkType, NS, PlayerRequirement } from "@ns";
import { connect } from "./connect";
import { ColorPrint } from "./tables";
import { ALL_FACTIONS } from "./util";

export function autocomplete(data: AutocompleteData, args: string[]) {
  return [...ALL_FACTIONS, "tbh"]; // This script autocompletes the list of servers.
}

function getBackdoorRequirement(ns: NS, reqs: PlayerRequirement[]) {
  for (const req of reqs) {
    if (req.type === "backdoorInstalled") {
      return {
        server: req.server,
        skill: ns.getServer(req.server).requiredHackingSkill || 0,
      }
    }
  }

  return;
}

export async function joinFaction(ns: NS, target: string, doWork?: FactionWorkType, doLog: boolean = true) {
  if (!ALL_FACTIONS.includes(target)) {
    ns.tprintf(`ERROR: No faction named ${target}`);
    return false;
  }

  const reqs = ns.singularity.getFactionInviteRequirements(target);
  const backdoorReq = getBackdoorRequirement(ns, reqs);
  console.log(reqs);

  // ns.tprintf(`Targeting ${target}: ${ns.singularity.getFactionInviteRequirements(target).map(r => r.type).join(", ")}`);
  // console.log(ns.singularity.getFactionInviteRequirements(target));

  if (!ns.getPlayer().factions.includes(target)) {
    if (["CyberSec", "BitRunners", "The Black Hand", "NiteSec"].includes(target)) {
      if (backdoorReq && ns.getPlayer().skills.hacking >= backdoorReq.skill) {
        if (!ns.getServer().backdoorInstalled) {
          if (doLog) {
            ns.tprintf(`Installing backdoor on ${backdoorReq.server} to join ${target}`);
          }
          await connect(ns, backdoorReq.server, true);
        }
        const invites = ns.singularity.checkFactionInvitations();
        if (invites.includes(target)) {
          const result = ns.singularity.joinFaction(target);
          if (result && doLog) {
            ns.tprintf(`Joined ${target}`);
          }
        }
      } else {
        if (doLog) {
          ColorPrint(ns, ['Red1', `Insufficient hacking skill to install backdoor on ${backdoorReq?.server} (${ns.getPlayer().skills.hacking} < ${backdoorReq?.skill})`]);
        }
        return false;
      }
    }
  } else {
    if (doLog) {
      ns.tprint(`Already a member of ${target}`);
    }
  }

  if (!ns.getPlayer().factions.includes(target)) {
    const invites = ns.singularity.checkFactionInvitations();
    if (invites.includes(target)) {
      const result = ns.singularity.joinFaction(target);
      if (result && doLog) {
        ns.tprintf(`Joined ${target}`);
      }
    } else {
      if (doLog) {
        ns.tprintf(`Unable to join ${target}`);
      }
    }
  }

  if (ns.getPlayer().factions.includes(target) && doWork) {
    const task = ns.singularity.getCurrentWork();
    if (task === null || task.type !== "FACTION" || task.factionName !== target || task.factionWorkType !== doWork) {
      ns.singularity.workForFaction(target, doWork, true);
    } else {
      ns.singularity.setFocus(true);
    }
  }

  return true;
}

export async function main(ns: NS): Promise<void> {
  let target = "";
  if (ns.args.length > 0) {
    target = ns.args.join(" ");
  }

  if (target.toUpperCase() === "TBH") {
    target = "The Black Hand";
  }

  await joinFaction(ns, target, "hacking" as FactionWorkType);
}
