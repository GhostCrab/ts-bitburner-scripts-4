import { NS } from "@ns";
import { tenderize } from "./tenderize";
import { waitForPID } from "./util";

export async function main(ns: NS): Promise<void> {
  await waitForPID(ns, ns.run("ba.js"));
  // await waitForPID(ns, ns.run("tenderize.js"));
  tenderize(ns);
  await waitForPID(ns, ns.run("learn.js"));
  await ns.sleep(1000);

  // ns.run("hud.js");
}
