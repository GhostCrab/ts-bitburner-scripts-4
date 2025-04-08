import { Multipliers, NS } from "@ns";
import { joinFaction } from "./faction";
import { ColorPrint, DefaultStyle, PrintTable } from "./tables";
import { ALL_FACTIONS, cashStr, waitForPID } from "./util";

function setCharAt(str: string, index: number, chr: string) {
  if(index > str.length-1) return str;
  return str.substring(0,index) + chr + str.substring(index+1);
}

export interface IAug {
  name: string;
  faction: string;
  installed: boolean;
  purchased: boolean;
  price: number;
  requiredRep: number;
  purchasable: boolean;
  affordable: boolean;
  preqreqs: string[];
  multipliers: Multipliers;
  affected: string[];
  categories: string[];
  isHack: boolean;
  isUseful: boolean;

  tableData(ns: NS): { color: string; text: string; }[];
  shortTableData(ns: NS): { color: string; text: string; }[];
  canBuy(): boolean;
  purchase(ns: NS, failLogging: boolean): boolean;
  printMultipliers(ns: NS): void;
}

export class Aug implements IAug{
  name: string;
  faction: string;
  installed: boolean;
  purchased: boolean;
  price: number;
  requiredRep: number;
  purchasable: boolean;
  affordable: boolean;
  preqreqs: string[];
  multipliers: Multipliers;
  affected: string[];
  categories: string[];
  isHack: boolean;
  isUseful: boolean;

  constructor(ns: NS, name: string, faction: string) {
    this.name = name;
    this.faction = faction;
    this.installed = ns.singularity.getOwnedAugmentations(false).indexOf(name) !== -1;
    this.purchased = ns.singularity.getOwnedAugmentations(true).indexOf(name) !== -1;
    this.price = ns.singularity.getAugmentationPrice(name);
    this.requiredRep = ns.singularity.getAugmentationRepReq(name);
    try {
      this.purchasable = this.requiredRep <= ns.singularity.getFactionRep(ns.getPlayer().factions.filter(f => f === faction)[0]);
    } catch (e) {
      this.purchasable = false;
    }
    this.affordable = this.price <= ns.getServerMoneyAvailable('home');
    this.preqreqs = ns.singularity.getAugmentationPrereq(name);
    this.multipliers = ns.singularity.getAugmentationStats(name);
    this.affected = [];
    this.updateAffected();
    this.categories = [];
    this.updateCategories();

    // remove already purchased prereqs and sort them in descending price order
    this.preqreqs.filter(a => !ns.singularity.getOwnedAugmentations(true).includes(a)).sort((a, b) => ns.singularity.getAugmentationBasePrice(b) - ns.singularity.getAugmentationBasePrice(a));

    this.isHack = this.categories.includes('hack');
    // this.isUseful = this.categories.includes('hack') || this.categories.includes('charisma') || this.categories.includes('company') || this.categories.includes('faction') || this.categories.includes('program') || this.categories.includes('special');
    this.isUseful = this.categories.includes('hack') || this.categories.includes('company') || this.categories.includes('faction') || this.categories.includes('program') || this.categories.includes('special') || this.categories.includes('hacknet');
  }

  updateCategories(): void {
    this.categories = [];

    if (this.faction === `Church of the Machine God` && this.name !== 'NeuroFlux Governor') {
      this.categories.push('stanek');
      return;
    }

    if (this.affected.some((a) => [`hacking`,`hacking_exp`,`hacking_chance`,`hacking_speed`,`hacking_money`,`hacking_grow`].includes(a)))
      this.categories.push('hack');

    if (this.affected.some((a) => [`strength`,`strength_exp`,`defense`,`defense_exp`,`dexterity`,`dexterity_exp`,`agility`,`agility_exp`].includes(a)))
      this.categories.push('combat');

    if (this.affected.some((a) => [`charisma`,`charisma_exp`].includes(a)))
      this.categories.push('charisma');
  
    if (this.affected.some((a) => [`company_rep`].includes(a)))
      this.categories.push('company');

    if (this.affected.some((a) => [`faction_rep`].includes(a)))
      this.categories.push('faction');

    if (this.affected.some((a) => [`crime_money`,`crime_success`].includes(a)))
      this.categories.push('crime');

    if (this.affected.some((a) => [`hacknet_node_money`,`hacknet_node_purchase_cost`,`hacknet_node_ram_cost`,`hacknet_node_core_cost`,`hacknet_node_level_cost`].includes(a)))
      this.categories.push('hacknet');

    if (this.affected.some((a) => [`bladeburner_max_stamina`,`bladeburner_stamina_gain`,`bladeburner_analysis`,`bladeburner_success_chance`].includes(a))
        || this.name === `The Blade's Simulacrum`)
      this.categories.push('bladeburner');
    
    if ([`CashRoot Starter Kit`,`BitRunners Neurolink`,`PCMatrix`].includes(this.name))
      this.categories.push('program');

    if (this.faction === `Shadows of Anarchy` && this.name !== 'NeuroFlux Governor')
      this.categories.push('infiltration');

    if (this.categories.length === 0)
      this.categories.push('special');
  }

  shortCategories(): string {
    let ret = '            ';
    if(this.categories.includes('hack'))         ret = setCharAt(ret, 0,  'H');
    if(this.categories.includes('combat'))       ret = setCharAt(ret, 1,  'C');
    if(this.categories.includes('charisma'))     ret = setCharAt(ret, 2,  'c');
    if(this.categories.includes('company'))      ret = setCharAt(ret, 3,  'W');
    if(this.categories.includes('faction'))      ret = setCharAt(ret, 4,  'F');
    if(this.categories.includes('crime'))        ret = setCharAt(ret, 5,  'X');
    if(this.categories.includes('hacknet'))      ret = setCharAt(ret, 6,  'N');
    if(this.categories.includes('bladeburner'))  ret = setCharAt(ret, 7,  'B');
    if(this.categories.includes('program'))      ret = setCharAt(ret, 8,  'P');
    if(this.categories.includes('infiltration')) ret = setCharAt(ret, 9,  'I');
    if(this.categories.includes('stanek'))       ret = setCharAt(ret, 10, 's');
    if(this.categories.includes('special'))      ret = setCharAt(ret, 11, 'S');

    return ret;
  }

  updateAffected(): void {
    this.affected = [];
    
    if (this.multipliers.strength !== 1) this.affected.push(`strength`);
    if (this.multipliers.strength_exp !== 1) this.affected.push(`strength_exp`);
    
    if (this.multipliers.defense !== 1) this.affected.push(`defense`);
    if (this.multipliers.defense_exp !== 1) this.affected.push(`defense_exp`);
    
    if (this.multipliers.dexterity !== 1) this.affected.push(`dexterity`);
    if (this.multipliers.dexterity_exp !== 1) this.affected.push(`dexterity_exp`);
    
    if (this.multipliers.agility !== 1) this.affected.push(`agility`);
    if (this.multipliers.agility_exp !== 1) this.affected.push(`agility_exp`);
    
    if (this.multipliers.charisma !== 1) this.affected.push(`charisma`);
    if (this.multipliers.charisma_exp !== 1) this.affected.push(`charisma_exp`);
    
    if (this.multipliers.hacking !== 1) this.affected.push(`hacking`);
    if (this.multipliers.hacking_exp !== 1) this.affected.push(`hacking_exp`);
    if (this.multipliers.hacking_chance !== 1) this.affected.push(`hacking_chance`);
    if (this.multipliers.hacking_speed !== 1) this.affected.push(`hacking_speed`);
    if (this.multipliers.hacking_money !== 1) this.affected.push(`hacking_money`);
    if (this.multipliers.hacking_grow !== 1) this.affected.push(`hacking_grow`);
    
    if (this.multipliers.company_rep !== 1) this.affected.push(`company_rep`);
    if (this.multipliers.work_money !== 1) this.affected.push(`work_money`);

    if (this.multipliers.faction_rep !== 1) this.affected.push(`faction_rep`);
    
    if (this.multipliers.crime_money !== 1) this.affected.push(`crime_money`);
    if (this.multipliers.crime_success !== 1) this.affected.push(`crime_success`);
    
    if (this.multipliers.hacknet_node_money !== 1) this.affected.push(`hacknet_node_money`);
    if (this.multipliers.hacknet_node_purchase_cost !== 1) this.affected.push(`hacknet_node_purchase_cost`);
    if (this.multipliers.hacknet_node_ram_cost !== 1) this.affected.push(`hacknet_node_ram_cost`);
    if (this.multipliers.hacknet_node_core_cost !== 1) this.affected.push(`hacknet_node_core_cost`);
    if (this.multipliers.hacknet_node_level_cost !== 1) this.affected.push(`hacknet_node_level_cost`);
    
    if (this.multipliers.bladeburner_max_stamina !== 1) this.affected.push(`bladeburner_max_stamina`);
    if (this.multipliers.bladeburner_stamina_gain !== 1) this.affected.push(`bladeburner_stamina_gain`);
    if (this.multipliers.bladeburner_analysis !== 1) this.affected.push(`bladeburner_analysis`);
    if (this.multipliers.bladeburner_success_chance !== 1) this.affected.push(`bladeburner_success_chance`);
  }

  printMultipliers(ns: NS): void {
    ns.tprintf(`${this.name}: ${this.categories.join(', ')}`);
  }

  printMultipliers2(ns: NS): void {
    const mults: string[] = [];
    if (this.multipliers.hacking !== 1)
      mults.push(`hacking: ${this.multipliers.hacking}`);
    if (this.multipliers.strength !== 1)
      mults.push(`strength: ${this.multipliers.strength}`);
    if (this.multipliers.defense !== 1)
      mults.push(`defense: ${this.multipliers.defense}`);
    if (this.multipliers.dexterity !== 1)
      mults.push(`dexterity: ${this.multipliers.dexterity}`);
    if (this.multipliers.agility !== 1)
      mults.push(`agility: ${this.multipliers.agility}`);
    if (this.multipliers.charisma !== 1)
      mults.push(`charisma: ${this.multipliers.charisma}`);
    if (this.multipliers.hacking_exp !== 1)
      mults.push(`hacking_exp: ${this.multipliers.hacking_exp}`);
    if (this.multipliers.strength_exp !== 1)
      mults.push(`strength_exp: ${this.multipliers.strength_exp}`);
    if (this.multipliers.defense_exp !== 1)
      mults.push(`defense_exp: ${this.multipliers.defense_exp}`);
    if (this.multipliers.dexterity_exp !== 1)
      mults.push(`dexterity_exp: ${this.multipliers.dexterity_exp}`);
    if (this.multipliers.agility_exp !== 1)
      mults.push(`agility_exp: ${this.multipliers.agility_exp}`);
    if (this.multipliers.charisma_exp !== 1)
      mults.push(`charisma_exp: ${this.multipliers.charisma_exp}`);
    if (this.multipliers.hacking_chance !== 1)
      mults.push(`hacking_chance: ${this.multipliers.hacking_chance}`);
    if (this.multipliers.hacking_speed !== 1)
      mults.push(`hacking_speed: ${this.multipliers.hacking_speed}`);
    if (this.multipliers.hacking_money !== 1)
      mults.push(`hacking_money: ${this.multipliers.hacking_money}`);
    if (this.multipliers.hacking_grow !== 1)
      mults.push(`hacking_grow: ${this.multipliers.hacking_grow}`);
    if (this.multipliers.company_rep !== 1)
      mults.push(`company_rep: ${this.multipliers.company_rep}`);
    if (this.multipliers.faction_rep !== 1)
      mults.push(`faction_rep: ${this.multipliers.faction_rep}`);
    if (this.multipliers.crime_money !== 1)
      mults.push(`crime_money: ${this.multipliers.crime_money}`);
    if (this.multipliers.crime_success !== 1)
      mults.push(`crime_success: ${this.multipliers.crime_success}`);
    if (this.multipliers.work_money !== 1)
      mults.push(`work_money: ${this.multipliers.work_money}`);
    if (this.multipliers.hacknet_node_money !== 1)
      mults.push(`hacknet_node_money: ${this.multipliers.hacknet_node_money}`);
    if (this.multipliers.hacknet_node_purchase_cost !== 1)
      mults.push(`hacknet_node_purchase_cost: ${this.multipliers.hacknet_node_purchase_cost}`);
    if (this.multipliers.hacknet_node_ram_cost !== 1)
      mults.push(`hacknet_node_ram_cost: ${this.multipliers.hacknet_node_ram_cost}`);
    if (this.multipliers.hacknet_node_core_cost !== 1)
      mults.push(`hacknet_node_core_cost: ${this.multipliers.hacknet_node_core_cost}`);
    if (this.multipliers.hacknet_node_level_cost !== 1)
      mults.push(`hacknet_node_level_cost: ${this.multipliers.hacknet_node_level_cost}`);
    if (this.multipliers.bladeburner_max_stamina !== 1)
      mults.push(`bladeburner_max_stamina: ${this.multipliers.bladeburner_max_stamina}`);
    if (this.multipliers.bladeburner_stamina_gain !== 1)
      mults.push(`bladeburner_stamina_gain: ${this.multipliers.bladeburner_stamina_gain}`);
    if (this.multipliers.bladeburner_analysis !== 1)
      mults.push(`bladeburner_analysis: ${this.multipliers.bladeburner_analysis}`);
    if (this.multipliers.bladeburner_success_chance !== 1)
      mults.push(`bladeburner_success_chance: ${this.multipliers.bladeburner_success_chance}`);

    ns.tprintf(`${this.name}: ${mults.join(', ')}`);
  }

  canBuy(): boolean {
    if (this.purchased) return false;
    return (this.purchasable && this.affordable);
  }

  augColor() {
    if (this.purchased) return 'green';
    if (this.purchasable && this.affordable) return 'Gold1';
    return 'white';
  }

  tableData(ns: NS): { color: string; text: string; }[] {
    return [
      { color: this.augColor(), text: ` ${this.name}` },
      { color: this.augColor(), text: ` ${this.faction}` },
      { color: this.augColor(), text: `${this.installed?'YES':'NO'}`.padStart(4) },
      { color: this.augColor(), text: `${this.purchased?'YES':'NO'}`.padStart(4) },
      { color: this.augColor(), text: ns.formatNumber(this.price, 1, 1000, true).padStart(8) },
      { color: this.augColor(), text: ns.formatNumber(this.requiredRep, 3, 1000, true).padStart(10) },
      { color: this.augColor(), text: `${this.purchasable?'YES':'NO'}`.padStart(4) },
      { color: this.augColor(), text: `${this.affordable?'YES':'NO'}`.padStart(4) },
      { color: this.augColor(), text: `${this.canBuy()?'YES':'NO'}`.padStart(4) },
      { color: this.augColor(), text: `${this.preqreqs.length}`.padStart(4) },
      { color: this.augColor(), text: ` ${this.shortCategories()}` }
    ];
  }

  public static tableCols() {
    return [
      { header: ' Augmentations', width: 56 },
      { header: ' Faction', width: 29 },
      { header: ' INS', width: 5 },
      { header: ' HAS', width: 5 },
      { header: '   Price', width: 9 },
      { header: '       Rep', width: 11 },
      { header: ' PUR', width: 5 },
      { header: ' AFF', width: 5 },
      { header: ' BUY', width: 5 },
      { header: ' PRE', width: 5 },
      { header: ' CATEGORIES', width: 14 },
    ];
  }

  shortTableData(ns: NS): { color: string; text: string; }[] {
    return [
      { color: this.augColor(), text: ` ${this.name}` },
      { color: this.augColor(), text: ` ${this.faction}` },
      { color: this.augColor(), text: ns.formatNumber(this.price, 1, 1000, true).padStart(8) },
      { color: this.augColor(), text: ns.formatNumber(this.requiredRep, 3, 1000, true).padStart(10) },
      { color: this.augColor(), text: `${this.preqreqs.length}`.padStart(4) }
    ];
  }

  public static shortTableCols() {
    return [
      { header: ' Augmentations', width: 56 },
      { header: ' Faction', width: 29 },
      { header: '   Price', width: 9 },
      { header: '       Rep', width: 11 },
      { header: ' PRE', width: 5 },
    ];
  }

  purchase(ns: NS, failLogging: boolean = true): boolean {
    let result = true;
    const actualPrice = ns.singularity.getAugmentationPrice(this.name);
    if (failLogging) {
      const rep = ns.singularity.getFactionRep(this.faction);
  
      if (ns.getPlayer().money < actualPrice) {
        ns.tprintf(`ERROR: Attempted to purchase ${this.name} from ${this.faction} with insufficient cash ($${ns.formatNumber(ns.getPlayer().money, 1, 1000, true)} < $${ns.formatNumber(actualPrice, 1, 1000, true)})`);
        return false;
      }
  
      if (rep < this.requiredRep) {
        ns.tprintf(`ERROR: Attempted to purchase ${this.name} from ${this.faction} with insufficient reputation (${ns.formatNumber(rep)} < ${ns.formatNumber(this.requiredRep)})`);
        return false;
      }
  
      const missingReqs: string[] = [];
      for (const reqAug of ns.singularity.getAugmentationPrereq(this.name)) {
        if (!ns.singularity.getOwnedAugmentations(true).includes(reqAug)) {
          missingReqs.push(reqAug);
        }
      }
  
      if (missingReqs.length > 0) {
        ns.tprintf(`ERROR: Attempted to purchase ${this.name} from ${this.faction} with missing requirements: ${missingReqs.join(", ")}`);
        return false;
      }
  
      result = ns.singularity.purchaseAugmentation(this.faction, this.name);
  
      if (!result) {
        ns.tprintf(`ERROR: Attempted purchase ${this.name} from ${this.faction} failed for unknown reason`);
      }
    } else {
      result = ns.singularity.purchaseAugmentation(this.faction, this.name);
    }
  
    if (result) {
      ns.tprintf(`Purchased ${this.name} from ${this.faction} for $${ns.formatNumber(actualPrice, 1, 1000, true)}`);
    }
  
    return result;
  }
}

export async function prepFactionForBuyout(ns: NS, faction: string, doBuy: boolean = true) {
  if (!ALL_FACTIONS.includes(faction)) {
    ns.tprintf(`ERROR: No faction named ${faction}`);
    return false;
  }

  if (!ns.getPlayer().factions.includes(faction) && doBuy) {
    const result = await joinFaction(ns, faction);
    if (!result || !ns.getPlayer().factions.includes(faction)) {
      ns.tprintf(`ERROR: Not joined to faction ${faction}`);
      return false;
    }
  }

  const augs: Aug[] = ns.singularity.getAugmentationsFromFaction(faction).map(a => new Aug(ns, a, faction))
    // .filter(a => a.isUseful)
    .filter(a => !a.purchased)
    .sort((a, b) => b.requiredRep - a.requiredRep);

  if (augs.length === 0) {
    // no augs to be installed
    return false;
  }

  const aug = augs[0];
  const currentRep = ns.singularity.getFactionRep(faction);
  const requiredAdditionalRep = aug.requiredRep - currentRep;
  const repCost = ((1 / ns.formulas.reputation.repFromDonation(1, ns.getPlayer())) * requiredAdditionalRep) + 1000;

  if (requiredAdditionalRep < 0) {
    return true;
  }

  if (ns.getPlayer().money < aug.price + repCost || !doBuy) {
    ns.tprintf(`${faction}|${aug.name}: ${cashStr(ns, aug.price + repCost)} (${cashStr(ns, aug.price)} + ${cashStr(ns, repCost)})`);
    return false;
  }

  ns.tprintf(`Donating ${cashStr(ns, repCost)} to ${faction} to gain ${ns.formatNumber(requiredAdditionalRep)}`)
  const result = ns.singularity.donateToFaction(faction, repCost);
  if (!result) {
    ns.tprintf(`ERROR: Failed to donate ${cashStr(ns, repCost)} to ${faction}`);
    return false;
  }

  return true;
}

export async function main(ns: NS): Promise<void> {
  const doBuy = ns.args.length > 0;
  const player = ns.getPlayer();

  if (doBuy) {
    await waitForPID(ns, ns.run("cct.js"));
  }
  // const lvl11SrcFileCheck = ns.singularity.getOwnedSourceFiles().filter(s => s.n === 11);
  // const lvl11SrcFileLevel = lvl11SrcFileCheck.length > 0 ? lvl11SrcFileCheck[0].lvl : 0;
  // const augPriceMultiplier = 1.9 * [1, 0.96, 0.94, 0.93][lvl11SrcFileLevel];

  const augPriceMultiplier = 1.9;
  const nfgPriceMultiplier = 1.14;
  let augs: IAug[] = [];
  for (const faction of ALL_FACTIONS.sort((a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a))) {
    if (faction === "Slum Snakes") continue;
    if (ns.singularity.getFactionRep(faction) === 0 && ns.singularity.getFactionFavor(faction) === 0) continue;

    let targetRep = ns.formulas.reputation.calculateFavorToRep(ns.getFavorToDonate());
    const totalRep = 
      ns.singularity.getFactionRep(faction) + ns.formulas.reputation.calculateFavorToRep(ns.singularity.getFactionFavor(faction));
    const repNeeded = Math.max(targetRep - totalRep, 0);

    ns.tprintf(`${faction.padEnd(20, " ")} - rep: ${ns.formatNumber(ns.singularity.getFactionRep(faction)).padStart(8, " ")}[${ns.formatNumber(totalRep).padStart(8, " ")}]/${ns.formatNumber(targetRep)} fav: ${ns.formatNumber(ns.singularity.getFactionFavor(faction))}`)
    if (ns.singularity.getFactionFavor(faction) >= ns.getFavorToDonate()) {
      const result = await prepFactionForBuyout(ns, faction, doBuy);
    }
    const factionAugs = ns.singularity.getAugmentationsFromFaction(faction);
    for (const aug of factionAugs) {
      if (!augs.some(a => a.name === aug))
        augs.push(new Aug(ns, aug, faction));
    }
  }

  //augs = augs.filter(a => a.canBuy() || a.purchased).sort((a, b) => b.price - a.price);
  // augs = augs.filter(a => a.isUseful);
  augs = augs.sort((a, b) => b.price - a.price);

  //augs = augs.filter(a => a.isHack);
  augs = augs.filter(a => a.name !== "NeuroFlux Governor");

  // shift prereqs higher in the list if they're in the list. If they're not in the list, remove the aug with prereqs
  for (let i = 0; i < augs.length; ++i) {
    const aug = augs[i];
    if (aug.preqreqs.length > 0) {
      let foundPrereq = false;
      let movedPrereq = false;
      for (let j = 0; j < aug.preqreqs.length; ++j) {
        const prereq = aug.preqreqs[j];
        const prereqIndex = augs.findIndex(a => a.name === prereq);

        if (prereqIndex === -1) break;
        foundPrereq = true;

        if (prereqIndex < i) continue;

        augs.splice(i, 0, augs.splice(prereqIndex, 1)[0]);
        movedPrereq = true;
        break;
      }

      if(!foundPrereq) {
        augs.splice(i, 1);
        --i;
        continue;
      }

      if(movedPrereq) {
        --i;
        continue;
      }
    }
  }

  // augs = augs.filter(a => a.canBuy());
  //augs.forEach(a => a.printMultipliers(ns));

  let price = 0;
  let mult = 0;
  let count = 0;
  augs.filter(a => a.canBuy()).forEach(a => {
    const thisPrice = a.price * Math.pow(augPriceMultiplier, mult++);
    price += thisPrice;
    count++;
    //ns.tprintf(`${a.name}: ${ns.formatNumber(thisPrice, 1, 1000)} / ${ns.formatNumber(price, 1, 1000)}`);
  });

  // PrintTable(ns, augs.map(a => a.shortTableData(ns)), Aug.shortTableCols(), DefaultStyle(), ColorPrint);
  if (augs.length > 0) {
    // @ts-ignore 
    PrintTable(ns, augs.toSorted((a, b) => b.requiredRep - a.requiredRep).map((a) => a.tableData(ns)), Aug.tableCols(), DefaultStyle(), ColorPrint);
    if (ns.getServerMoneyAvailable('home') >= price)
      ColorPrint(ns, ['green', `${count} purchaseable augs final cost: $${ns.formatNumber(price, 1, 1000, true)}`]);
    else
      ColorPrint(ns, ['Red1', `${count} purchaseable augs final cost: $${ns.formatNumber(price, 1, 1000, true)}`]);
  } else {
    ns.tprintf('  >> Purchasable aug list empty');
  }

  augs = augs.filter(a => a.canBuy());
  
  // buy in order from most to least expensive, buying prereqs first
  if (doBuy) {
    //let cash = ns.getServerMoneyAvailable('home');
    while (augs.length > 0) {
      const aug = augs.shift();
      
      if (aug) {
        purchaseAugmentation(ns, aug);
      }
    }

    while (purchaseAugmentation(ns));
  }

  const faction = ALL_FACTIONS.sort((a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a))[0];
  const neuroAug = new Aug(ns, "NeuroFlux Governor", faction);
  ns.tprintf(`Next ${neuroAug.name} costs $${ns.formatNumber(neuroAug.price, undefined, undefined, true)} / ${ns.formatNumber(neuroAug.requiredRep)} rep`);
}

function purchaseAugmentation(ns: NS, aug?: IAug): boolean {
  let failLogging = true;
  if (aug === undefined) {
    const faction = ALL_FACTIONS.sort((a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a))[0];
    aug = new Aug(ns, "NeuroFlux Governor", faction);
    failLogging = false;
  }

  return aug.purchase(ns, failLogging); 
}