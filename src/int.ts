import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  // const startingInt = ns.getPlayer().exp.intelligence;
  // const currentCity = ns.getPlayer().city;
  // let counter = 0;
  // while (ns.getPlayer().money > 400000) {
  //   ns.singularity.travelToCity("Aevum");
  //   ns.singularity.travelToCity("Ishima");
  //   if (counter++ % 10000 === 0) {
  //     await ns.sleep(1);
  //   }
  // }

  // ns.atExit(() => {
  //   ns.singularity.travelToCity(currentCity);
  //   ns.tprintf(`Completed Travel - Gained ${ns.getPlayer().exp.intelligence - startingInt} Intelligence EXP`);
  // });

  for (const inv of ns.singularity.checkFactionInvitations()) {
    ns.singularity.joinFaction(inv);
  }

  let tracker = Number(ns.read("resetTracker.txt"));
  ns.write("resetTracker.txt", (tracker + 1).toString(), "w");
  if (tracker % 100 === 0) {
    await ns.sleep(1);
  }
  ns.singularity.softReset("int.js");
}
