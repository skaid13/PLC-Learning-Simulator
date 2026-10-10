import type {
  BoolVariable,
  ContactInstruction,
  ContactType,
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
  | { type: 'addContact'; networkId: string; contact: ContactInstruction }
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
  if (action.type === 'addNetwork') {
    if (program.networks.some((network) => network.id === action.network.id)) return program;
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
  switch (action.type) {
    case 'renameNetwork':
      return update({ ...network, name: action.name.slice(0, 40) });
    case 'addContact':
      if (
        network.contacts.length >= MAX_CONTACTS ||
        [...network.contacts, network.coil].some((item) => item?.id === action.contact.id)
      )
        return program;
      return update({ ...network, contacts: [...network.contacts, action.contact] });
    case 'addCoil':
      if (network.coil || network.contacts.some((item) => item.id === action.instructionId))
        return program;
      return update({
        ...network,
        coil: { id: action.instructionId, kind: 'coil', variableId: null },
      });
    case 'deleteInstruction':
      return update({
        ...network,
        contacts: network.contacts.filter((item) => item.id !== action.instructionId),
        coil: network.coil?.id === action.instructionId ? null : network.coil,
      });
    case 'changeContactType':
      return update({
        ...network,
        contacts: network.contacts.map((item) =>
          item.id === action.instructionId ? { ...item, contactType: action.contactType } : item,
        ),
      });
    case 'setVariable': {
      const instruction =
        network.contacts.find((item) => item.id === action.instructionId) ??
        (network.coil?.id === action.instructionId ? network.coil : undefined);
      if (!instruction) return program;
      const variable = program.variables.find((item) => item.id === action.variableId);
      if (
        action.variableId !== null &&
        (!variable || (instruction.kind === 'coil' && variable.kind === 'input'))
      )
        return program;
      return update({
        ...network,
        contacts: network.contacts.map((item) =>
          item.id === action.instructionId ? { ...item, variableId: action.variableId } : item,
        ),
        coil:
          network.coil?.id === action.instructionId
            ? { ...network.coil, variableId: action.variableId }
            : network.coil,
      });
    }
    case 'moveContact':
      return update({
        ...network,
        contacts: moveItem(
          network.contacts,
          network.contacts.findIndex((item) => item.id === action.instructionId),
          action.direction,
        ),
      });
  }
}
