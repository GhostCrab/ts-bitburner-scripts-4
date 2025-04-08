import { CrimeStats, CrimeType, NS } from "@ns";
import { formatTime } from "./eval";

const CrimeNames = [
  "Shoplift",
  "Rob Store",
  "Mug",
  "Larceny",
  "Deal Drugs",
  "Bond Forgery",
  "Traffick Arms",
  "Homicide",
  "Grand Theft Auto",
  "Kidnap",
  "Assassination",
  "Heist",
];

interface Crime {
  name: string;
  chance: number;
  stats: CrimeStats;
  income: number;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog('disableLog');
  ns.disableLog('ALL');

  while (true) {
    const crimes: Crime[] = CrimeNames.map(n => { 
      const stats = ns.singularity.getCrimeStats(n as CrimeType)
      const chance = ns.singularity.getCrimeChance(n as CrimeType) * 100
      return {
        name: n,
        chance: chance,
        stats: stats,
        income: (stats.money / stats.time) * chance
    }}).sort((a, b) => b.income - a.income);

    // for (let crime of crimes) {
    //   ns.tprintf(`${crime.name} over ${formatTime(crime.stats.time)} for $${ns.formatNumber(crime.stats.money)} ($${ns.formatNumber(crime.income*1000)}/s ${crime.chance.toFixed(2)}%%)`);
    // }

    for (let crime of crimes) {
      // ns.tprintf(`Doing Crime ${crime.name} over ${formatTime(crime.stats.time)} for $${ns.formatNumber(crime.stats.money)} ($${ns.formatNumber(crime.income*1000)}/s ${crime.chance.toFixed(2)}%%)`);
      const time = ns.singularity.commitCrime(crime.name as CrimeType, false);
      await ns.sleep(time);
      break;
    }
  }
}
