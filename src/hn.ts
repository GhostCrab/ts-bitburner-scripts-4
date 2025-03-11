import { HacknetServerConstants, NodeStats, NS } from "@ns";

export enum HSUpgradeType {
  LEVEL = "LEVEL",
  RAM = "RAM",
  CORES = "CORES",
  CACHE = "CACHE",
  SERVER = "SERVER",
}

class HNServer implements NodeStats {
  id: number;
  // @ts-ignore
  name: string;
  // @ts-ignore
  level: number;
  // @ts-ignore
  ram: number;
  // @ts-ignore
  ramUsed?: number | undefined;
  // @ts-ignore
  cores: number;
  // @ts-ignore
  cache?: number | undefined;
  // @ts-ignore
  hashCapacity?: number | undefined;
  // @ts-ignore
  production: number;
  // @ts-ignore
  timeOnline: number;
  // @ts-ignore
  totalProduction: number;

  constructor(ns: NS, id: number) {
    this.id = id;
    this.refresh(ns);
  }

  refresh(ns: NS) {
    try {
      Object.assign(this, ns.hacknet.getNodeStats(this.id));
    } catch (e) {
      ns.tprintf(`ERROR: ${this.id} is not a valid hacknet node id`);
    }
  }

  toString() {
    return `${this.id}: ${this.level} ${this.ram} ${this.cores} ${this.production} ${this.totalProduction}`;
  }

  gainRate(ns: NS) {
    return ns.formulas.hacknetServers.hashGainRate(
      this.level,
      0,
      this.ram,
      this.cores,
      ns.getPlayer().mults.hacknet_node_money
    );
  }

  upgradeStats(ns: NS, type: HSUpgradeType): HSUpgrade {
    const prodMult = ns.getPlayer().mults.hacknet_node_money;
    const coreCostMult = ns.getPlayer().mults.hacknet_node_core_cost;
    const levelCostMult = ns.getPlayer().mults.hacknet_node_level_cost;
    const ramCostMult = ns.getPlayer().mults.hacknet_node_ram_cost;

    let cost: number = 0;
    let productionTotal: number = 0;

    switch (type) {
      case HSUpgradeType.LEVEL: {
        cost = ns.formulas.hacknetServers.levelUpgradeCost(
          this.level,
          1,
          levelCostMult
        );
        productionTotal = ns.formulas.hacknetServers.hashGainRate(
          this.level + 1,
          0,
          this.ram,
          this.cores,
          prodMult
        );
        break;
      }
      case HSUpgradeType.RAM: {
        cost = ns.formulas.hacknetServers.ramUpgradeCost(
          this.ram,
          1,
          ramCostMult
        );
        productionTotal = ns.formulas.hacknetServers.hashGainRate(
          this.level,
          0,
          this.ram * 2,
          this.cores,
          prodMult
        );
        break;
      }
      case HSUpgradeType.CORES: {
        cost = ns.formulas.hacknetServers.coreUpgradeCost(
          this.cores,
          1,
          coreCostMult
        );
        productionTotal = ns.formulas.hacknetServers.hashGainRate(
          this.level,
          0,
          this.ram,
          this.cores + 1,
          prodMult
        );
        break;
      }
      case HSUpgradeType.CACHE: {
        cost = ns.formulas.hacknetServers.cacheUpgradeCost(this.cache || 0);
        productionTotal = this.production;
        // this.cacheIncrease = this.cache;
        // this.cacheCostPerHash = this.upgradeCost / this.cacheIncrease;
        break;
      }
    }

    const productionIncrease = productionTotal - this.production;

    return {
      id: this.id,
      type: type,
      cost: cost,
      productionIncrease: productionIncrease,
      productionTotal: productionTotal,
      productionValue: productionIncrease / cost,
    };
  }
}

interface HSUpgrade {
  id: number;
  type: HSUpgradeType;
  cost: number;
  productionIncrease: number;
  productionTotal: number;
  productionValue: number;
}

function hsUpgradeStr(ns: NS, u: HSUpgrade) {
  return `${u.id} => ${u.type} ${ns.formatNumber(u.cost, 1)} +${u.productionIncrease.toFixed(3)}`;
}

function newServerUpgrade(ns: NS): HSUpgrade {
  const prod = ns.formulas.hacknetServers.hashGainRate(1, 0, 1, 1, ns.getPlayer().mults.hacknet_node_money)
  return {
    id: ns.hacknet.numNodes(),
    type: HSUpgradeType.SERVER,
    cost: ns.hacknet.getPurchaseNodeCost(),
    productionIncrease: prod,
    productionTotal: prod,
    productionValue: 1
  }
}

function hsUpgradeBuy(ns: NS, u: HSUpgrade) {
  if (u.cost < ns.getPlayer().money) {
    switch (u.type) {
      case HSUpgradeType.LEVEL: {
        return ns.hacknet.upgradeLevel(u.id);
      }
      case HSUpgradeType.RAM: {
        return ns.hacknet.upgradeRam(u.id);
      }
      case HSUpgradeType.CORES: {
        return ns.hacknet.upgradeCore(u.id);
      }
      case HSUpgradeType.CACHE: {
        return ns.hacknet.upgradeCache(u.id);
      }
      case HSUpgradeType.SERVER: {
        return ns.hacknet.purchaseNode() !== -1;
      }
    }
  }

  return false;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("disableLog");
  ns.disableLog("ALL");

  while (true) {
    let hashServerUpgrades: HSUpgrade[] = [];
    for (let id = 0; id < ns.hacknet.numNodes(); id++) {
      const hns = new HNServer(ns, id);
      Object.keys(HSUpgradeType).forEach((key) => {
        if (key !== "CACHE" && key != "SERVER") {
        // if (key === "RAM") {
          hashServerUpgrades.push(
            hns.upgradeStats(ns, HSUpgradeType[key as HSUpgradeType])
          );
        }
      });
    }
    hashServerUpgrades.sort((a, b) => b.productionValue - a.productionValue);
    if (hashServerUpgrades.length === 0 || hashServerUpgrades[0].cost > ns.hacknet.getPurchaseNodeCost()) {
      hashServerUpgrades = [newServerUpgrade(ns)].concat(hashServerUpgrades);
    }

    let upgrade = hashServerUpgrades.shift();
    if (upgrade === undefined) {
      ns.tprintf(`No Hacknet Upgrades Left`);
      return;
    }

    ns.tprintf(hsUpgradeStr(ns, upgrade));
    while (true) {
      if (upgrade.cost < ns.getPlayer().money) {
        hsUpgradeBuy(ns, upgrade);
        break;
      }
      await ns.sleep(100);
    }
  }


}
