import { NS } from "@ns";
import { Aug } from "./augs";
import { joinFaction } from "./faction";
import { ALL_FACTIONS, cashStr } from "./util";

export async function main(ns: NS): Promise<void> {
  const highestRepFaction = ALL_FACTIONS.sort((a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a))[0];
  const factionRep = ns.singularity.getFactionRep(highestRepFaction);
  
  let highestFavorFaction = highestRepFaction;
  let canDonate = ns.singularity.getFactionFavor(highestFavorFaction) >= ns.getFavorToDonate();
  if (!canDonate) {
    highestFavorFaction = ALL_FACTIONS.sort((a, b) => ns.singularity.getFactionFavor(b) - ns.singularity.getFactionFavor(a))[0];
    canDonate = ns.singularity.getFactionFavor(highestFavorFaction) >= ns.getFavorToDonate();
  }

  let didPurchase = false;
  while (true) {
    const aug = new Aug(ns, "NeuroFlux Governor", highestRepFaction);

    if (factionRep >= aug.requiredRep && ns.getPlayer().money >= aug.price) {
      didPurchase = aug.purchase(ns);
      if (!didPurchase) {
        ns.tprintf(`ERROR: Failed attempted valid purchase`);
        break;
      }
    } else {
      break;
    }
  }

  if (canDonate) {
    while (true) {
      if (!ns.getPlayer().factions.includes(highestFavorFaction)) {
        const result = await joinFaction(ns, highestFavorFaction);
        if (!result || !ns.getPlayer().factions.includes(highestFavorFaction)) {
          ns.tprintf(`ERROR: Not joined to faction ${highestFavorFaction}`);
          break;
        }
      }

      const aug = new Aug(ns, "NeuroFlux Governor", highestFavorFaction);

      let highestFavorFactionRep = ns.singularity.getFactionRep(highestFavorFaction);
      if (highestFavorFactionRep < aug.requiredRep) {
        const requiredAdditionalRep = aug.requiredRep - highestFavorFactionRep;
        const repCost = ((1 / ns.formulas.reputation.repFromDonation(1, ns.getPlayer())) * requiredAdditionalRep) + 1000;

        if (ns.getPlayer().money < aug.price + repCost) {
          ns.tprintf(`Next ${aug.name}: ${cashStr(ns, aug.price + repCost)} (${cashStr(ns, aug.price)} + ${cashStr(ns, repCost)})`);
          break;
        }

        ns.tprintf(`Donating ${cashStr(ns, repCost)} to ${highestFavorFaction} to gain ${ns.formatNumber(requiredAdditionalRep)}`)
        const result = ns.singularity.donateToFaction(highestFavorFaction, repCost);
        if (!result) {
          ns.tprintf(`ERROR: Failed to donate ${cashStr(ns, repCost)} to ${highestFavorFaction}`);
          break;
        }
      }

      if (ns.getPlayer().money < aug.price) {
        break;
      }

      didPurchase = aug.purchase(ns);
      if (!didPurchase) {
        ns.tprintf(`ERROR: Failed attempted valid purchase`);
        break;
      }
    }
  }

  if (!didPurchase) {
    const faction = ALL_FACTIONS.sort((a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a))[0];
    const factionRep = ns.singularity.getFactionRep(faction);
    const aug = new Aug(ns, "NeuroFlux Governor", faction);
    if (factionRep < aug.requiredRep) {
      ns.tprintf(`No faction with enough rep to purchase ${aug.name} (${aug.faction}: ${ns.formatNumber(factionRep)} < ${ns.formatNumber(aug.requiredRep)})`);
    }
    if (ns.getPlayer().money < aug.price) {
      ns.tprintf(`Not enough money to purchase ${aug.name} (${cashStr(ns)} < ${cashStr(ns, aug.price)})`)
    }
  }
}
