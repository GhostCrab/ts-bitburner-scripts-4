import { NS } from "@ns";
import { HackStats } from "./hud";
import React from "./lib/react";
import { createBasicComponent, createProgressComponent, getTimestampText } from "./lib/reactutil";

export async function main(ns: NS) {
  ns.disableLog('disableLog');
  ns.disableLog('ALL');

  let hackStats: HackStats = { target: "", begin: 0, start: 0, end: 0, gainRate: 0 };

  const hackStatPort = ns.getPortHandle(1);

  // Create and print some mixed content
  const timestamp = createBasicComponent("", "green");
  const elapsed = createBasicComponent();
  const progress = createProgressComponent();
  ns.printRaw([
    getTimestampText(), "This is test static content\n",
    elapsed.component, "\n",
    progress.component
  ]);

  ns.ui.openTail();

  // Update the dynamic portions of the content
  const initialTime = Date.now();
  while (true) {
    timestamp.updater(getTimestampText());
    
    if (hackStatPort.peek() !== "NULL PORT DATA")
    hackStats = JSON.parse(hackStatPort.peek().toString());
    else
    hackStats = { target: "", begin: 0, start: 0, end: 0, gainRate: 0 };
    
    const current = new Date().getTime();
    const wholeValue = ((current - hackStats.begin) / (hackStats.end - hackStats.begin));
    progress.updater(wholeValue);
    elapsed.updater(`${current} ${hackStats.begin} ${hackStats.end} ${wholeValue}`);

    await ns.asleep(100);
  }
}