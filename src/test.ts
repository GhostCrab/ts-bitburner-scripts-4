import { NS } from "@ns";
import { HNServer, HSUpgrade, hsUpgradeStr, HSUpgradeType } from "./hn";

export async function main(ns: NS): Promise<void> {
  ns.disableLog('disableLog');
  ns.disableLog('ALL');
  
  ns.tprintf(`${ns.weakenAnalyze(1)}`);
}
