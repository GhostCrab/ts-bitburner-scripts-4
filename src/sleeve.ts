import { NS, SleevePerson } from "@ns";

interface Sleeve extends SleevePerson {
  id: number;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog('disableLog');
  ns.disableLog('ALL');
  
  let sleeves: Sleeve[] = [];

  for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
    const augs = ns.sleeve.getSleevePurchasableAugs(i);
    for (const aug of augs) {
      ns.sleeve.purchaseSleeveAug(i, aug.name);
    }

    ns.sleeve.setToUniversityCourse(i, "Rothman University", "Algorithms");

    let sleeve: Sleeve = {id: i, ...ns.sleeve.getSleeve(i)}
    sleeves.push(sleeve)
  }

  sleeves.sort((a, b) => b.exp.hacking - a.exp.hacking);

  for (const sleeve of sleeves) {
    const work = ns.singularity.getCurrentWork();
    if (work?.type === "FACTION" && ns.fileExists("Formulas.exe")) {
      ns.sleeve.setToFactionWork(sleeve.id, work.factionName, "hacking");
      break;
    }
  }
}
