import { GangMemberInfo, NS } from "@ns";

class Member {
  name: string;
  info: GangMemberInfo;

  constructor(ns: NS, name: string) {
    this.name = name;

    this.info = ns.gang.getMemberInformation(name);
  }
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog('disableLog');
  ns.disableLog('ALL');

  while (ns.gang.canRecruitMember()) {
    const name = `mem-${ns.gang.getMemberNames().length}`;
    const result = ns.gang.recruitMember(name);
    if (result) {
      ns.tprintf(`Recruited gang member ${name}`);
    } else {
      ns.tprintf(`ERROR: Unable to recruit gang member ${name}`);
    }
  }

  for (const task of ns.gang.getTaskNames()) {
    ns.tprintf(`${task}; ${ns.gang.getTaskStats(task).baseMoney}`);
  }
}
