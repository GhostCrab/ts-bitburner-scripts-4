import { FactionWorkType, NS, Server } from "@ns";
import { joinFaction } from "./faction";

export async function main(ns: NS): Promise<void> {
  while (true) {
    while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Sell for Money"))
      ns.hacknet.spendHashes("Sell for Money");

    // await joinFaction(ns, "The Black Hand", "hacking" as FactionWorkType, false);

    await ns.sleep(500);
  }
}
