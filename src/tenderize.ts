import { NS, Server } from '@ns';
import { PrintTable, DefaultStyle, ColorPrint } from "tables";

export const HGW_RAM = 1.75; // ram cost for weaken (most expensive);
export const SHARE_RAM = 4;
export const HACK_SCRIPT = "hack.js";
export const WEAKEN_SCRIPT = "weaken.js";
export const GROW_SCRIPT = "grow.js";
export const SHARE_SCRIPT = "share.js";

// export const HGW_RAM = 1.75;
export const HACK_SEC = 0.002; // ns.hackAnalyzeSecurity(1, 'omega-net');
export const GROW_SEC = 0.004; // ns.growthAnalyzeSecurity(1, 'omega-net');
export const WEAK_SEC = 0.05; // ns.weakenAnalyze(1);
export const HOME_RESERVE = 150;

export const MS_BETWEEN_OPERATIONS = 7;

export interface Host {
  name: string;
  connected: Host[];
}

function output(ns: NS, host: Host, offset: string = '') {
  ns.tprint(`${offset} ${host.name}`);
  host.connected.forEach(conn => output(ns, conn, `${offset}-`));
}

export function displayServerTree(ns: NS) {
  output(ns, getServerTree(ns));
}

export function getServerTree(ns: NS): Host {
  const root: Host = {
    name: "home",
    connected: []
  };

  traverse(ns, root, '');
  // output(ns, root, '');

  return root;
}

export function getServers(ns: NS): Server[] {
  // return flatten(ns, getServerTree(ns)).filter(s => !s.hostname.startsWith("hacknet"));
  return flatten(ns, getServerTree(ns)).filter(s => !s.hostname.startsWith("hacknet"));
}

export function getServerAvailableThreads(ns: NS, host: Server|string, useMaxRam = false) {
  let hostname = '';
  if (typeof host === 'string') {
    hostname = host;
  }
  else {
    hostname = host.hostname;
  }

  const server = ns.getServer(hostname);

  let availableRam = server.maxRam - (useMaxRam ? 0 : server.ramUsed);
  if (server.hostname === "home")
    availableRam -= HOME_RESERVE;

  if (availableRam <= 0) return 0;

  return Math.floor(availableRam / HGW_RAM);
}

export function getServerAvailableShareThreads(ns: NS, host: Server|string, useMaxRam = false) {
  let hostname = '';
  if (typeof host === 'string') {
    hostname = host;
  }
  else {
    hostname = host.hostname;
  }

  const server = ns.getServer(hostname);

  let availableRam = server.maxRam - (useMaxRam ? 0 : server.ramUsed);
  if (server.hostname === "home")
    availableRam -= HOME_RESERVE;

  if (availableRam <= 0) return 0;

  return Math.floor(availableRam / SHARE_RAM);
}

export function availableHackThreads(ns: NS, max: boolean = false): number {
  return getRunnableServers(ns, max).reduce((t, s) => t + getServerAvailableThreads(ns, s, max), 0);
}

export function availableShareThreads(ns: NS, max: boolean = false): number {
  return getRunnableServers(ns, max).reduce((t, s) => t + getServerAvailableShareThreads(ns, s, max), 0);
}

export function getRunnableServers(ns: NS, max: boolean = false): Server[] {
  return getServers(ns).filter(s => s.hasAdminRights && getServerAvailableThreads(ns, s, max) > 0);
}

function traverse(ns: NS, host: Host, parent: string) {
  host.connected = ns.scan(host.name).filter(name => name !== parent).map(name => {return {name: name, connected: []};})
  host.connected.forEach(conn => traverse(ns, conn, host.name));
}

function flatten(ns: NS, host: Host): Server[] {
  const server: Server = ns.getServer(host.name);
  const subs = host.connected.map(conn => flatten(ns, conn)).flat();
  return [server].concat(subs);
}

function getColor(server: Server) {
  if (server.backdoorInstalled) return 'green';
  if (server.hasAdminRights) return 'Gold1';
  if (nukable(server)) return 'LightGoldenrod2';
  return 'white';
}

function getOpenPortCount(server: Server) {
  let portCount = 0;
  if (server.ftpPortOpen) portCount++;
  if (server.sqlPortOpen) portCount++;
  if (server.sshPortOpen) portCount++;
  if (server.httpPortOpen) portCount++;
  if (server.smtpPortOpen) portCount++;

  return portCount;
}

export function hasAdminRights(ns: NS, server: Server) {
  return ns.getServer(server.hostname).hasAdminRights;
}

export function nukable(server: Server) {
  return getOpenPortCount(server) >= (server.numOpenPortsRequired?server.numOpenPortsRequired:0);
}

export function exploit(ns: NS, server: Server) {
  if (ns.fileExists("BruteSSH.exe")) {
    ns.brutessh(server.hostname);
  }

  if (ns.fileExists("FTPCrack.exe")) {
    ns.ftpcrack(server.hostname);
  }

  if (ns.fileExists("relaySMTP.exe")) {
    ns.relaysmtp(server.hostname);
  }

  if (ns.fileExists("HTTPWorm.exe")) {
    ns.httpworm(server.hostname);
  }

  if (ns.fileExists("SQLInject.exe")) {
    ns.sqlinject(server.hostname);
  }
}

export function nuke(ns: NS, server: Server) {
  if (!nukable(server)) return;

  ns.nuke(server.hostname);
}

export function tenderize(ns: NS) {
  let servers = getServers(ns);
  servers.forEach(server => exploit(ns, server));

  servers = getServers(ns);
  servers.forEach(server => {
    if (nukable(server)) {
      nuke(ns, server);
    }

    if (hasAdminRights(ns, server)) {
      ns.scp(["grow.js", "weaken.js", "hack.js", "share.js"], server.hostname);
    }
  });
}

export async function main(ns: NS): Promise<void> {
  tenderize(ns);
  let servers = getServers(ns);

  const data = servers.sort((a,b) => (a.requiredHackingSkill?a.requiredHackingSkill:0) - (b.requiredHackingSkill?b.requiredHackingSkill:0)).map(s => [
      { color: getColor(s), text: s.hostname },
      { color: getColor(s), text: ns.formatRam(s.maxRam, 0) },
      { color: getColor(s), text: s.requiredHackingSkill },
      { color: getColor(s), text: Number.isInteger(s.hackDifficulty) ? s.hackDifficulty : s.hackDifficulty?.toFixed(1) },
      { color: getColor(s), text: s.numOpenPortsRequired },
      { color: getColor(s), text: s.cpuCores },
      { color: getColor(s), text: `$${ns.formatNumber(s.moneyAvailable || 0)}/$${ns.formatNumber(s.moneyMax || 0)}` },
      // { color: getColor(s), text: s.backdoorInstalled },
      // { color: getColor(s), text: s.hasAdminRights },
    ]
  );

  const columns = [
    { header: 'Server', width: 20 },
    { header: 'RAM', width: 9 },
    { header: 'Skill', width: 6 },
    { header: 'Diff', width: 6 },
    { header: 'Ports', width: 6 },
    { header: 'Cores', width: 6 },
    { header: 'Cash', width: 20 },
    // { header: 'Backdoor', width: 10 },
    // { header: 'Admin', width: 10 },
  ];

  PrintTable(ns, data, columns, DefaultStyle(), ColorPrint);

  ns.tprint(availableHackThreads(ns, true));
}