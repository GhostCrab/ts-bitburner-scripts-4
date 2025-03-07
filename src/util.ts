import { NS, RunningScript } from "@ns";
import { MS_BETWEEN_OPERATIONS } from "./tenderize";

export const ALL_FACTIONS = [
  "Illuminati",
  "Daedalus",
  "The Covenant",
  "ECorp",
  "MegaCorp",
  "Bachman & Associates",
  "Blade Industries",
  "NWO",
  "Clarke Incorporated",
  "OmniTek Incorporated",
  "Four Sigma",
  "KuaiGong International",
  "Fulcrum Secret Technologies",
  "BitRunners",
  "The Black Hand",
  "NiteSec",
  "Aevum",
  "Chongqing",
  "Ishima",
  "New Tokyo",
  "Sector-12",
  "Volhaven",
  "Speakers for the Dead",
  "The Dark Army",
  "The Syndicate",
  "Silhouette",
  "Tetrads",
  "Slum Snakes",
  "Netburners",
  "Tian Di Hui",
  "CyberSec",
  "Bladeburners",
  "Church of the Machine God",
  "Shadows of Anarchy",
];

export async function waitForPID(ns: NS, pid: number | RunningScript | null): Promise<void> {
  if (pid === null) return;

  if (typeof pid !== "number") {
    pid = pid.pid;
  }
  
  while (ns.isRunning(pid)) {
    await ns.sleep(MS_BETWEEN_OPERATIONS);
  }
}

export function cashStr(ns: NS, cash?: number, fractionalDigits?: number) {
  if (cash === undefined) {
    cash = ns.getPlayer().money;
  }
  return `$${ns.formatNumber(cash, fractionalDigits, undefined, true)}`;
}