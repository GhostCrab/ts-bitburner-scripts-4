import { NS } from "@ns";
import { getServers } from "./tenderize";
import { waitForPID } from "./util";

export async function main(ns: NS): Promise<void> {
  for (const server of getServers(ns, true)) {
    ns.killall(server.hostname, true);
  }
  await (ns.sleep(1000));

  // await waitForPID(ns, ns.getRunningScript("hud.js"))

  await waitForPID(ns, ns.run("cct.js"));
  await waitForPID(ns, ns.run("augs.js", 1, 1));
  await waitForPID(ns, ns.run("neuro.js"));

  while(ns.singularity.upgradeHomeRam());
  while(ns.singularity.upgradeHomeCores());

  ns.singularity.softReset("startup.js");
}
