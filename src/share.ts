import { BasicHGWOptions, NS } from '@ns';

export async function main(ns: NS): Promise<void>  {
  ns.disableLog('disableLog');
  ns.disableLog('ALL');
  
  await ns.share();
}