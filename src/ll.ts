import { NS } from "@ns";
import { ColorPrint, DefaultStyle, PrintTable } from "./tables";

function getColor(ns: NS, f: {name: string; ram: number;}) {
  if (f.ram >  ns.getServerMaxRam("home") - ns.getServerUsedRam("home")) {
    return "OrangeRed1";
  }

  return "white";
}

function getRam(ns: NS, f: string) {
  if (f.includes("js")) {
    return ns.getScriptRam(f);
  }

  return 0;
}

export async function main(ns: NS): Promise<void> {
  const files = ns.ls(ns.getHostname())
  .map(f => {return {
    name: f,
    ram: getRam(ns, f)
  }});

  if (ns.args.length > 0) {
    files.sort((a,b) => b.ram - a.ram);
  } else {
    files.sort((a,b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  }

  let maxFileNameWidth = 0;
  for (const f of files) {
    if (f.name.length > maxFileNameWidth)
      maxFileNameWidth = f.name.length;
  }

  const data =  files.map(f => [
      { color: getColor(ns, f), text: f.name },
      { color: getColor(ns, f), text: ns.formatRam(f.ram, 0) },
    ]
  );

  const columns = [
    { header: 'Name', width: maxFileNameWidth + 1 },
    { header: 'RAM', width: 9 },
  ];

  PrintTable(ns, data, columns, DefaultStyle(), ColorPrint);
  ns.tprintf(`Home RAM Available: ${ns.formatRam(ns.getServerMaxRam("home") - ns.getServerUsedRam("home"))}`);
}
