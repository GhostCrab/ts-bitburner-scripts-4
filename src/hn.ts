import { HacknetServerConstants, NodeStats, NS } from "@ns";
import { formatTime } from "./eval";

const prodLimit = 0.00000000001;

export enum HSUpgradeType {
  LEVEL = "LEVEL",
  RAM = "RAM",
  CORES = "CORES",
  CACHE = "CACHE",
  SERVER = "SERVER",
}

export class HNServer implements NodeStats {
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
      ns.printf(`ERROR: ${this.id} is not a valid hacknet node id`);
    }
  }

  toString() {
    return `${this.id.toString().padStart(2, " ")}: ${this.level} ${this.ram} ${this.cores} ${this.production} ${this.totalProduction}`;
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
    // const prodMult = ns.getPlayer().mults.hacknet_node_money * ns.getBitNodeMultipliers().HacknetNodeMoney;
    const prodMult = ns.getPlayer().mults.hacknet_node_money;
    const coreCostMult = ns.getPlayer().mults.hacknet_node_core_cost;
    const levelCostMult = ns.getPlayer().mults.hacknet_node_level_cost;
    const ramCostMult = ns.getPlayer().mults.hacknet_node_ram_cost;

    let cost: number = 0;
    let upgradeProduction: number = 0;

    switch (type) {
      case HSUpgradeType.LEVEL: {
        cost = ns.formulas.hacknetServers.levelUpgradeCost(
          this.level,
          1,
          levelCostMult
        );
        upgradeProduction = ns.formulas.hacknetServers.hashGainRate(
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
        upgradeProduction = ns.formulas.hacknetServers.hashGainRate(
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
        upgradeProduction = ns.formulas.hacknetServers.hashGainRate(
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
        upgradeProduction = this.production;
        // this.cacheIncrease = this.cache;
        // this.cacheCostPerHash = this.upgradeCost / this.cacheIncrease;
        break;
      }
    }

    const productionIncrease = upgradeProduction - this.production;
    const productionValue = productionIncrease / cost;

    return {
      id: this.id,
      server: this,
      type: type,
      cost: cost,
      productionIncrease: productionIncrease,
      upgradeProduction: upgradeProduction,
      productionValue: productionValue,
      normProdVal: productionValue * 1000000000
    };
  }
}

export interface HSUpgrade {
  id: number;
  server?: HNServer;
  type: HSUpgradeType;
  cost: number;
  productionIncrease: number;
  upgradeProduction: number;
  productionValue: number;
  normProdVal: number;
}

function totalProduction(ns: NS) {
  let prodCalc = 0;
  for (let idx = 0; idx < ns.hacknet.numNodes(); idx++) {
      const stats = ns.hacknet.getNodeStats(idx);
      stats.ramUsed = 0;
      stats.production = ns.formulas.hacknetServers.hashGainRate(
          stats.level,
          0,
          stats.ram,
          stats.cores,
          // ns.getBitNodeMultipliers().HacknetNodeMoney * ns.getPlayer().mults.hacknet_node_money
          ns.getPlayer().mults.hacknet_node_money
      );

      prodCalc += stats.production;
  }

  return prodCalc;
}

function totalProductionCash(ns: NS) {
  return (totalProduction(ns) / 4) * 1000000;
}

export function hsUpgradeStr(ns: NS, u: HSUpgrade) {
  const timeToBuy = u.cost / totalProductionCash(ns);
  return `${u.id.toString().padStart(2, " ")} => ${u.type.padStart(6, " ")} ${("$" + ns.formatNumber(u.cost, 1)).padStart(7, " ")} +${u.productionIncrease.toFixed(3)} ${formatTime(timeToBuy * 1000)} ${ns.formatNumber(u.normProdVal)}`;
}

function newServerUpgrade(ns: NS): HSUpgrade {
  // const prod = ns.formulas.hacknetServers.hashGainRate(1, 0, 1, 1, ns.getPlayer().mults.hacknet_node_money * ns.getBitNodeMultipliers().HacknetNodeMoney);
  const prod = ns.formulas.hacknetServers.hashGainRate(1, 0, 1, 1, ns.getPlayer().mults.hacknet_node_money);
  return {
    id: ns.hacknet.numNodes(),
    type: HSUpgradeType.SERVER,
    cost: ns.hacknet.getPurchaseNodeCost(),
    productionIncrease: prod,
    upgradeProduction: prod,
    productionValue: 1,
    normProdVal: 1,
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

  ns.ui.openTail();

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
      ns.printf(`No Hacknet Upgrades Left`);
      return;
    }

    if (upgrade.normProdVal < prodLimit) {
      ns.printf(`Value insufficient for further upgrades (${upgrade.normProdVal} < ${prodLimit.toFixed(3)}`);
      return;
    }

    ns.printf(hsUpgradeStr(ns, upgrade));
    while (true) {
      // if (upgrade.cost < ns.getPlayer().money / 1000) {
      if (upgrade.cost < ns.getPlayer().money) {
        hsUpgradeBuy(ns, upgrade);
        break;
      }
      await ns.sleep(100);
    }
  }


}
