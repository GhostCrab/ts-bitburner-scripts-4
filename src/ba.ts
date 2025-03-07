import { NS } from "@ns";
import { tenderize } from "./tenderize";

export async function main(ns: NS): Promise<void> {
  let purchased = false;
  if (ns.singularity.purchaseTor()) {
    if (!ns.fileExists("BruteSSH.exe")) {
      if (ns.singularity.getDarkwebProgramCost("BruteSSH.exe") <= ns.getPlayer().money) {
        ns.singularity.purchaseProgram("BruteSSH.exe")
        ns.tprint(`Purchased BruteSSH.exe`);
        purchased = true;
      } else {
        ns.tprint(`BruteSSH.exe costs $${ns.formatNumber(ns.singularity.getDarkwebProgramCost("BruteSSH.exe"), 0, undefined, true)}`);
      }
    }

    if (!ns.fileExists("FTPCrack.exe")) {
      if (ns.singularity.getDarkwebProgramCost("FTPCrack.exe") <= ns.getPlayer().money) {
        ns.singularity.purchaseProgram("FTPCrack.exe")
        ns.tprint(`Purchased FTPCrack.exe`);
        purchased = true;
      } else {
        ns.tprint(`FTPCrack.exe costs $${ns.formatNumber(ns.singularity.getDarkwebProgramCost("FTPCrack.exe"), 0, undefined, true)}`);
      }
    }

    if (!ns.fileExists("relaySMTP.exe")) {
      if (ns.singularity.getDarkwebProgramCost("relaySMTP.exe") <= ns.getPlayer().money) {
        ns.singularity.purchaseProgram("relaySMTP.exe")
        ns.tprint(`Purchased relaySMTP.exe`);
        purchased = true;
      } else {
        ns.tprint(`relaySMTP.exe costs $${ns.formatNumber(ns.singularity.getDarkwebProgramCost("relaySMTP.exe"), 0, undefined, true)}`);
      }
    }

    if (!ns.fileExists("HTTPWorm.exe")) {
      if (ns.singularity.getDarkwebProgramCost("HTTPWorm.exe") <= ns.getPlayer().money) {
        ns.singularity.purchaseProgram("HTTPWorm.exe")
        ns.tprint(`Purchased HTTPWorm.exe`);
        purchased = true;
      } else {
        ns.tprint(`HTTPWorm.exe costs $${ns.formatNumber(ns.singularity.getDarkwebProgramCost("HTTPWorm.exe"), 0, undefined, true)}`);
      }
    }

    if (!ns.fileExists("SQLInject.exe")) {
      if (ns.singularity.getDarkwebProgramCost("SQLInject.exe") <= ns.getPlayer().money) {
        ns.singularity.purchaseProgram("SQLInject.exe")
        ns.tprint(`Purchased SQLInject.exe`);
        purchased = true;
      } else {
        ns.tprint(`SQLInject.exe costs $${ns.formatNumber(ns.singularity.getDarkwebProgramCost("SQLInject.exe"), 0, undefined, true)}`);
      }
    }

    if (!ns.fileExists("Formulas.exe")) {
      if (ns.singularity.getDarkwebProgramCost("Formulas.exe") <= ns.getPlayer().money) {
        ns.singularity.purchaseProgram("Formulas.exe")
        ns.tprint(`Purchased Formulas.exe`);
      } else {
        ns.tprint(`Formulas.exe costs $${ns.formatNumber(ns.singularity.getDarkwebProgramCost("Formulas.exe"), 0, undefined, true)}`);
      }
    }
  } else {
    ns.tprint("ERROR: Failed to purchase Tor Router");
  }

  if (purchased) {
    tenderize(ns);
  }
}
