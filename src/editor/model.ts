import type {
  BoolVariable,
  ContactInstruction,
  ContactType,
  CoilInstruction,
  Experiment,
  LadderNetwork,
  ProgramWorkspace,
} from '../types';

// 当前编辑器的教学范围限制，不是 PLC 的硬件限制。
export const MAX_CONTACTS = 4;
export const instructionNames = {
  normallyOpen: '常开触点',
  normallyClosed: '常闭触点',
  coil: '输出线圈',
} as const;
export type EditorTool = 'select' | ContactType | 'coil';
export type EditorSelection = { networkId: string; instructionId: string | null };

export function newId(): string {
  return crypto.randomUUID();
}
export function createNetwork(id = newId()): LadderNetwork {
  return { id, name: '', topology: 'series', contacts: [], coil: null };
}
export const allContacts = (network: LadderNetwork) =>
  [network.contacts, ...(network.branches ?? [])].flat();

/** 复制网络时重新生成全部元件标识，变量引用保持当前实验内一致。 */
export function cloneNetwork(network: LadderNetwork): LadderNetwork {
  return {
    ...network,
    id: newId(),
    name: network.name ? `${network.name.slice(0, 35)} 副本` : '网络副本',
    contacts: network.contacts.map((c) => ({
      ...c,
      id: newId(),
      comparison: c.comparison ? { ...c.comparison } : undefined,
    })),
    branches: network.branches?.map((b) =>
      b.map((c) => ({
        ...c,
        id: newId(),
        comparison: c.comparison ? { ...c.comparison } : undefined,
      })),
    ),
    coil: network.coil ? { ...network.coil, id: newId() } : null,
  };
}
export function createWorkspace(experiment: Experiment): ProgramWorkspace {
  const fromManual = (kind: 'input' | 'output'): BoolVariable[] =>
    experiment[kind === 'input' ? 'inputs' : 'outputs'].map((entry) => ({
      id: `${kind}:${entry.terminal}`,
      name: `SIM_${kind === 'input' ? 'IN' : 'OUT'}_${entry.terminal.slice(2)}`,
      kind,
      terminal: entry.terminal,
      description: entry.label,
    }));
  const internal: BoolVariable[] = Array.from({ length: 4 }, (_, index) => ({
    id: `internal:${index}`,
    name: `SIM_M_${String(index).padStart(2, '0')}`,
    kind: 'internal',
    description: `内部标志 ${index + 1}（无实体端子）`,
  }));
  return {
    schemaVersion: 1,
    id: newId(),
    experimentId: experiment.id,
    name: '主程序',
    variables: [...fromManual('input'), ...fromManual('output'), ...internal],
    networks: [createNetwork()],
  };
}

export type EditorAction =
  | { type: 'addNetwork'; network: LadderNetwork }
  | { type: 'deleteNetwork'; networkId: string }
  | { type: 'renameNetwork'; networkId: string; name: string }
  | { type: 'moveNetwork'; networkId: string; direction: -1 | 1 }
  | { type: 'addContact'; networkId: string; contact: ContactInstruction; branch?: number }
  | { type: 'addBranch'; networkId: string }
  | { type: 'deleteBranch'; networkId: string; branch: number }
  | {
      type: 'updateContact';
      networkId: string;
      instructionId: string;
      patch: Partial<Pick<ContactInstruction, 'comparison' | 'edge'>>;
    }
  | { type: 'updateCoil'; networkId: string; patch: Partial<Omit<CoilInstruction, 'kind' | 'id'>> }
  | { type: 'addVariable'; variable: BoolVariable }
  | {
      type: 'createAndBindVariable';
      networkId: string;
      instructionId: string;
      variable: BoolVariable;
    }
  | { type: 'deleteVariable'; variableId: string }
  | {
      type: 'updateVariable';
      variableId: string;
      patch: Partial<Pick<BoolVariable, 'name' | 'description' | 'initialValue'>>;
    }
  | { type: 'addCoil'; networkId: string; instructionId: string }
  | { type: 'deleteInstruction'; networkId: string; instructionId: string }
  | {
      type: 'changeContactType';
      networkId: string;
      instructionId: string;
      contactType: ContactType;
    }
  | { type: 'setVariable'; networkId: string; instructionId: string; variableId: string | null }
  | { type: 'moveContact'; networkId: string; instructionId: string; direction: -1 | 1 };

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const result = [...items];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

/** 纯数据编辑，不执行 PLC 逻辑，不改变输入输出值。 */
export function editProgram(program: ProgramWorkspace, action: EditorAction): ProgramWorkspace {
  if (action.type === 'createAndBindVariable') {
    const network = program.networks.find((n) => n.id === action.networkId);
    const instruction =
      network &&
      [...allContacts(network), ...(network.coil ? [network.coil] : [])].find(
        (i) => i.id === action.instructionId,
      );
    const numeric =
      instruction?.kind === 'contact'
        ? !!instruction.comparison
        : ['move', 'add'].includes(instruction?.operation ?? 'coil');
    if (
      !instruction ||
      action.variable.kind !== 'internal' ||
      action.variable.terminal ||
      !action.variable.name.trim() ||
      action.variable.name.length > 40 ||
      (action.variable.dataType === 'number') !== numeric ||
      program.variables.length >= 500 ||
      program.variables.some((v) => v.id === action.variable.id || v.name === action.variable.name)
    )
      return program;
    return editProgram(
      { ...program, variables: [...program.variables, action.variable] },
      {
        type: 'setVariable',
        networkId: action.networkId,
        instructionId: action.instructionId,
        variableId: action.variable.id,
      },
    );
  }
  if (action.type === 'updateVariable')
    return {
      ...program,
      variables: program.variables.map((v) =>
        v.id === action.variableId ? { ...v, ...action.patch } : v,
      ),
    };
  if (action.type === 'addVariable')
    return program.variables.length >= 500
      ? program
      : program.variables.some((v) => v.id === action.variable.id)
        ? program
        : { ...program, variables: [...program.variables, action.variable] };
  if (action.type === 'deleteVariable') {
    if (
      program.networks.some(
        (n) =>
          [...allContacts(n), ...(n.coil ? [n.coil] : [])].some(
            (i) => i.variableId === action.variableId,
          ) ||
          n.coil?.sourceVariableId === action.variableId ||
          n.coil?.countVariableId === action.variableId,
      )
    )
      return program;
    return {
      ...program,
      variables: program.variables.filter((v) => v.id !== action.variableId || v.terminal),
    };
  }
  if (action.type === 'addNetwork') {
    if (
      program.networks.length >= 500 ||
      program.networks.some((network) => network.id === action.network.id)
    )
      return program;
    return { ...program, networks: [...program.networks, action.network] };
  }
  const index = program.networks.findIndex((network) => network.id === action.networkId);
  if (index === -1) return program;
  if (action.type === 'deleteNetwork') {
    if (program.networks.length === 1) return program;
    return { ...program, networks: program.networks.filter((_, i) => i !== index) };
  }
  if (action.type === 'moveNetwork')
    return { ...program, networks: moveItem(program.networks, index, action.direction) };
  const network = program.networks[index];
  const update = (next: LadderNetwork): ProgramWorkspace => ({
    ...program,
    networks: program.networks.map((item, i) => (i === index ? next : item)),
  });
  const mapContacts = (fn: (item: ContactInstruction) => ContactInstruction): LadderNetwork => ({
    ...network,
    contacts: network.contacts.map(fn),
    branches: network.branches?.map((b) => b.map(fn)),
  });
  switch (action.type) {
    case 'renameNetwork':
      return update({ ...network, name: action.name.slice(0, 40) });
    case 'addContact': {
      const branches = [network.contacts, ...(network.branches ?? [])],
        branch = action.branch ?? 0;
      if (
        !branches[branch] ||
        branches[branch].length >= MAX_CONTACTS ||
        [...allContacts(network), network.coil].some((item) => item?.id === action.contact.id)
      )
        return program;
      branches[branch] = [...branches[branch], action.contact];
      return update({ ...network, contacts: branches[0], branches: branches.slice(1) });
    }
    case 'addBranch':
      return (network.branches?.length ?? 0) >= 7
        ? program
        : update({ ...network, branches: [...(network.branches ?? []), []] });
    case 'deleteBranch':
      return update({
        ...network,
        branches: network.branches?.filter((_, i) => i !== action.branch - 1),
      });
    case 'updateContact':
      return update(
        mapContacts((i) => (i.id === action.instructionId ? { ...i, ...action.patch } : i)),
      );
    case 'updateCoil':
      return network.coil
        ? update({ ...network, coil: { ...network.coil, ...action.patch } })
        : program;
    case 'addCoil':
      if (network.coil || allContacts(network).some((item) => item.id === action.instructionId))
        return program;
      return update({
        ...network,
        coil: { id: action.instructionId, kind: 'coil', variableId: null },
      });
    case 'deleteInstruction':
      return update({
        ...network,
        contacts: network.contacts.filter((item) => item.id !== action.instructionId),
        branches: network.branches?.map((b) => b.filter((i) => i.id !== action.instructionId)),
        coil: network.coil?.id === action.instructionId ? null : network.coil,
      });
    case 'changeContactType':
      return update(
        mapContacts((item) =>
          item.id === action.instructionId ? { ...item, contactType: action.contactType } : item,
        ),
      );
    case 'setVariable': {
      const instruction =
        allContacts(network).find((item) => item.id === action.instructionId) ??
        (network.coil?.id === action.instructionId ? network.coil : undefined);
      if (!instruction) return program;
      const variable = program.variables.find((item) => item.id === action.variableId);
      if (
        action.variableId !== null &&
        (!variable || (instruction.kind === 'coil' && variable.kind === 'input'))
      )
        return program;
      return update({
        ...mapContacts((item) =>
          item.id === action.instructionId ? { ...item, variableId: action.variableId } : item,
        ),
        coil:
          network.coil?.id === action.instructionId
            ? { ...network.coil, variableId: action.variableId }
            : network.coil,
      });
    }
    case 'moveContact': {
      const branches = [network.contacts, ...(network.branches ?? [])].map((b) =>
        moveItem(
          b,
          b.findIndex((i) => i.id === action.instructionId),
          action.direction,
        ),
      );
      return update({ ...network, contacts: branches[0], branches: branches.slice(1) });
    }
  }
}
