import { AutocompleteData, NS } from "@ns";
import { getServerTree, Host } from "./tenderize";

export function autocomplete(data: AutocompleteData, args: string[]) {
  return [...data.servers]; // This script autocompletes the list of servers.
}

function dive(ns: NS, current: Host, target: string): string[]|undefined {
  if (current.name === target) return [target];
  for(const s of current.connected) {
    const result = dive(ns, s, target);
    if (result !== undefined) {
      return [current.name].concat(result);
    }
  }

  return undefined;
}

export async function connect(ns: NS, target: string, backdoor: boolean = false) {
  const path = dive(ns, getServerTree(ns), target);

  if (path) {
    for (const server of path) {
      ns.singularity.connect(server);
    }

    if (backdoor) {
      await ns.singularity.installBackdoor();
      ns.singularity.connect("home");
    }
  }
}

export async function main(ns: NS): Promise<void> {
  const target = ns.args[0].toString();
  const backdoor = ns.args[1] !== undefined;
  if (backdoor) {
    ns.tprintf(`Installing Backdoor on ${target}`);
  }
  await connect(ns, target, backdoor);
}
