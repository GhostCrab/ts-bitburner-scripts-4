import { FactionWorkType, NS, Server } from "@ns";
import { joinFaction } from "./faction";

export async function main(ns: NS): Promise<void> {
  const target = "ecorp";
  while (true) {
    // while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Sell for Money"))
    //   ns.hacknet.spendHashes("Sell for Money");

    while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Increase Maximum Money"))
      ns.hacknet.spendHashes("Increase Maximum Money", target);

    while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Reduce Minimum Security"))
      ns.hacknet.spendHashes("Reduce Minimum Security", target);

    // while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Company Favor"))
    //   ns.hacknet.spendHashes("Company Favor", "Clarke Incorporated");

    // await joinFaction(ns, "The Black Hand", "hacking" as FactionWorkType, false);
    while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Generate Coding Contract"))
      ns.hacknet.spendHashes("Generate Coding Contract");
    

    await ns.sleep(500);
  }
}
 