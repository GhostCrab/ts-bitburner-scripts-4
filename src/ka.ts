import { NS } from "@ns";
import { getRunnableServers, getServers } from "./tenderize";

const SAFE_SCRIPTS = ["ka.js", "hud.js"];

export async function main(ns: NS): Promise<void> {
  for (const server of getServers(ns)) {
    if (server.hostname === "home") continue;
    ns.killall(server.hostname);
  }

  for (const script of ns.ps()) {
    if (SAFE_SCRIPTS.includes(script.filename)) continue;

    ns.kill(script.pid);
  }

  ns.clearPort(1);
}
