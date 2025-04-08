import { AutocompleteData, FactionWorkType, NS, Server } from "@ns";
import { joinFaction } from "./faction";
import { processRunning } from "./mcp";

export function autocomplete(data: AutocompleteData, args: string[]) {
  return [...data.servers, "money", "cct", "kill", "favor"]; // This script autocompletes the list of servers.
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("disableLog");
  ns.disableLog("sleep");

  const mode = ns.args[0];
  let target = "megacorp";
  if (typeof ns.args[0] === "string") {
    target = ns.args[0];
  }

  for (const p of ns.ps()) {
    if (p.filename === ns.getScriptName() && p.pid !== ns.pid) {
      ns.tprintf(`Killing ${p.filename} with pid ${p.pid}`);
      ns.kill(p.pid);
    }
  }

  if (mode === "kill") return;

  if (mode === "cct") {
    ns.tprintf("Selling Hashes for Contracts");
  } else if (mode === "money") {
    ns.tprintf("Selling Hashes for Money");
  } else {
    ns.tprintf(`Selling Hashes to improve ${target}`);
  }

  while (true) {
    // if (!processRunning(ns, "hn.js")) {
    //   if (ns.hacknet.hashCost("Increase Maximum Money") > ns.hacknet.hashCapacity()) {
    //     while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Sell for Money"))
    //       ns.hacknet.spendHashes("Sell for Money");

    //     ns.hacknet.upgradeCache(0);
    //   }

    //   if (ns.getServerBaseSecurityLevel(target) > 5) {
    //     while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Reduce Minimum Security"))
    //       ns.hacknet.spendHashes("Reduce Minimum Security", target);
    //   }

    //   while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Increase Maximum Money"))
    //     ns.hacknet.spendHashes("Increase Maximum Money", target);
    // } else {
    //   while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Sell for Money"))
    //     ns.hacknet.spendHashes("Sell for Money");
    // }

    // while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Company Favor"))
    //     ns.hacknet.spendHashes("Company Favor", "Clarke Incorporated");

    // await joinFaction(ns, "The Black Hand", "hacking" as FactionWorkType, false);

    if (mode === "cct") {
      if (ns.hacknet.hashCost("Generate Coding Contract") > ns.hacknet.hashCapacity()) {
        ns.hacknet.upgradeCache(0);
      }

      while (ns.hacknet.numHashes() >= ns.hacknet.hashCost("Generate Coding Contract")) 
        ns.hacknet.spendHashes("Generate Coding Contract");
    } else if (mode === "money") {
      while (ns.hacknet.numHashes() >= ns.hacknet.hashCost("Sell for Money"))
        ns.hacknet.spendHashes("Sell for Money");
    } else if (mode === "favor") {
      if (ns.hacknet.hashCost("Company Favor") > ns.hacknet.hashCapacity()) {
        ns.hacknet.upgradeCache(0);
      }

      while (ns.hacknet.numHashes() >= ns.hacknet.hashCost("Company Favor")) 
        ns.hacknet.spendHashes("Company Favor", "NWO");
      
    } else {
      if (ns.hacknet.hashCost("Increase Maximum Money") > ns.hacknet.hashCapacity()) {
        // while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Sell for Money"))
        //   ns.hacknet.spendHashes("Sell for Money");
  
        ns.hacknet.upgradeCache(0);
      }
  
      if (ns.getServerBaseSecurityLevel(target) > 1) {
        while (ns.hacknet.numHashes() >= ns.hacknet.hashCost("Reduce Minimum Security"))
          ns.hacknet.spendHashes("Reduce Minimum Security", target);
      }
  
      while (ns.hacknet.numHashes() >= ns.hacknet.hashCost("Increase Maximum Money"))
        ns.hacknet.spendHashes("Increase Maximum Money", target);
    }

    await ns.sleep(500);
  }
}
 