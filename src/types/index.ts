export type LearningMode = 'teaching' | 'free';

export interface IOEntry {
  label: string;
  terminal: string;
}

export interface Experiment {
  id: string;
  number: string;
  name: string;
  shortName: string;
  manualPage: number;
  objective: string;
  requirements: string[];
  inputs: IOEntry[];
  outputs: IOEntry[];
  notes?: string[];
}

export type VariableKind = 'input' | 'output' | 'internal';

export interface BoolVariable {
  id: string;
  name: string;
  kind: VariableKind;
  description: string;
  /** 指导书端子标记，不是官方软件变量地址。内部变量没有端子。 */
  terminal?: string;
  dataType?: 'boolean' | 'number';
  initialValue?: number;
}

export type ContactType = 'normallyOpen' | 'normallyClosed';
export interface ContactInstruction {
  id: string;
  kind: 'contact';
  contactType: ContactType;
  variableId: string | null;
  comparison?: { operator: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le'; value: number };
  edge?: 'rising';
}
export interface CoilInstruction {
  id: string;
  kind: 'coil';
  variableId: string | null;
  operation?:
    'coil' | 'set' | 'reset' | 'ton' | 'tof' | 'pulse' | 'ctu' | 'resetCounter' | 'move' | 'add';
  preset?: number;
  sourceVariableId?: string;
  countVariableId?: string;
}
export type LadderInstruction = ContactInstruction | CoilInstruction;

/** contacts 的数组顺序就是从左到右的串联关系，coil 固定在网络末端。 */
export interface LadderNetwork {
  id: string;
  name: string;
  topology: 'series';
  contacts: ContactInstruction[];
  /** 与主串联支路并联；每条支路内部串联，支路之间为 OR。 */
  branches?: ContactInstruction[][];
  coil: CoilInstruction | null;
}

export interface ProgramWorkspace {
  schemaVersion: 1;
  id: string;
  experimentId: string;
  name: string;
  variables: BoolVariable[];
  networks: LadderNetwork[];
}
