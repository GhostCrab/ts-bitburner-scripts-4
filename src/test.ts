import { FactionWorkType, NS, Server } from "@ns";
import { joinFaction } from "./faction";

export async function main(ns: NS): Promise<void> {
  const target = "rho-construction";
  while (true) {
    // while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Sell for Money"))
    //   ns.hacknet.spendHashes("Sell for Money");

    while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Increase Maximum Money"))
      ns.hacknet.spendHashes("Increase Maximum Money", target);

    while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Reduce Minimum Security"))
      ns.hacknet.spendHashes("Reduce Minimum Security", target);

    // await joinFaction(ns, "The Black Hand", "hacking" as FactionWorkType, false);

    await ns.sleep(500);
  }
}
