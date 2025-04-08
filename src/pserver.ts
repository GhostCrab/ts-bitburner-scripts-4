import { NS, Server } from "@ns";
import { availableHackThreads, MS_BETWEEN_OPERATIONS } from "./tenderize";

class Slave {
  server: Server;
  ram: number;
  ramPow: number;
  nextRam: number;
  cost: number;
  upgradeCost: number;
  rate: number;

  constructor(ns: NS, name: string) {
    this.server = ns.getServer(name);
    this.ram = this.server.maxRam;
    this.ramPow = Math.round(Math.log(this.ram)/Math.log(2));
    this.nextRam = Math.pow(2, this.ramPow+1);
    this.cost = ns.getPurchasedServerCost(this.ram);
    if (this.ramPow < 20) {
      this.upgradeCost = ns.getPurchasedServerUpgradeCost(this.server.hostname, this.nextRam);
    } else {
      this.upgradeCost = Infinity;
    }

    this.rate = this.upgradeCost / (this.nextRam - this.ram);
  }

  toStr(ns: NS) {
    return `${this.server.hostname}: +${ns.formatRam(this.nextRam - this.ram)} for $${ns.formatNumber(this.upgradeCost)} ($${ns.formatNumber(this.rate)})`;
  }

  upgrade(ns: NS) {
    ns.tprintf(`Upgrading server ${this.server.hostname} to ${ns.formatRam(this.nextRam)} of RAM for $${ns.formatNumber(this.upgradeCost)}`);
    return ns.upgradePurchasedServer(this.server.hostname, this.nextRam);
  }
}

function getSlaves(ns: NS) {
  return ns.getPurchasedServers().map(s => new Slave(ns, s));
}

function purchaseServer(ns: NS, ramPow: number) {
  const result = ns.purchaseServer("home", Math.pow(2, ramPow));

  if (result !== "") {
    ns.tprint(`Purchased ${result} with ${ns.formatRam(Math.pow(2, ramPow), 0)} RAM (2^${ramPow})`);
    ns.scp(["grow.js", "weaken.js", "hack.js", "share.js"], result);
  }

  return result;
}

export async function main(ns: NS): Promise<void> {
  const minRam = 32;

  if (ns.getPurchasedServers().length === 0 && ns.args[0] === undefined) {
    ns.tprintf(`No purchased servers`);
  }

  if (ns.args[0]) {
    while (ns.getPlayer().money > ns.getPurchasedServerCost(minRam) && ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
      const serverName = ns.purchaseServer("home", minRam);
      ns.tprintf(`Purchased server ${serverName} with ${ns.formatRam(minRam)} of RAM for $${ns.formatNumber(ns.getPurchasedServerCost(minRam))}`);
      ns.scp(["grow.js", "weaken.js", "hack.js", "share.js"], serverName);
    }
  
    let didUpgrade = false;
    while (true) {
      const slaves = getSlaves(ns).filter(s => s.upgradeCost <= ns.getPlayer().money).sort((a, b) => a.rate - b.rate);
      if (slaves.length > 0) {
        // if (slaves[0].upgradeCost > 200000000000) return;
        slaves[0].upgrade(ns);
        didUpgrade = true;
        continue;
      }

      break;
    }

    if (ns.getPurchasedServers().length === 0 && ns.args[0] === undefined) {
      ns.tprintf(`No servers purchased (min: $${ns.formatNumber(ns.getPurchasedServerCost(minRam))})`);
    } else if (!didUpgrade) {
      const cheapSlave = getSlaves(ns).sort((a, b) => a.rate - b.rate)[0];
      if (cheapSlave !== undefined)
        ns.tprintf(`No servers upgraded (min: ${cheapSlave.toStr(ns)})`);
    }
  } else {
    for (const slave of getSlaves(ns).sort((a, b) => a.rate - b.rate)) {
      // ns.tprintf(`${slave.server.hostname}: ${ns.formatRam(slave.ram)} ${slave.ramPow} || $${ns.formatNumber(ns.getPurchasedServerCost(slave.ram))} => $${ns.formatNumber(ns.getPurchasedServerCost(slave.nextRam))} || upgrade: $${ns.formatNumber(ns.getPurchasedServerUpgradeCost(slave.server.hostname, slave.nextRam))}`);
  
      ns.tprintf(slave.toStr(ns));
    }
  }
}
