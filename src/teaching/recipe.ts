import type { LadderNetwork, ProgramWorkspace, ContactInstruction } from '../types';

/** 指导式结构对照，不是任意等价程序的正确性判定。忽略随机元件 ID 与网络名。 */
export function networkSignature(program: ProgramWorkspace, network: LadderNetwork): string {
  const variable = (id: string | null | undefined) => {
    if (!id) return null;
    const v = program.variables.find((v) => v.id === id);
    if (!v) return `missing:${id}`;
    return [
      v.kind,
      v.terminal ?? v.name,
      v.dataType ?? 'boolean',
      v.dataType === 'number' ? (v.initialValue ?? 0) : null,
    ];
  };
  const contact = (c: ContactInstruction) => [
    variable(c.variableId),
    c.contactType,
    c.comparison?.operator ?? null,
    c.comparison?.value ?? null,
    c.edge ?? null,
  ];
  const c = network.coil;
  return JSON.stringify({
    branches: [network.contacts, ...(network.branches ?? [])].map((b) => b.map(contact)),
    coil: c
      ? [
          variable(c.variableId),
          c.operation ?? 'coil',
          ['ton', 'tof', 'pulse', 'ctu', 'move', 'add'].includes(c.operation ?? '')
            ? (c.preset ?? null)
            : null,
          variable(c.sourceVariableId),
          variable(c.countVariableId),
        ]
      : null,
  });
}
export function recipeMatches(program: ProgramWorkspace, recipe: ProgramWorkspace): boolean[] {
  return recipe.networks.map(
    (network, i) =>
      !!program.networks[i] &&
      networkSignature(program, program.networks[i]) === networkSignature(recipe, network),
  );
}
