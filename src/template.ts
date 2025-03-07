import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.disableLog('disableLog');
  ns.disableLog('ALL');
  
  ns.tprint("Hello Remote API!");
}
