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
}

export type ContactType = 'normallyOpen' | 'normallyClosed';
export interface ContactInstruction {
  id: string;
  kind: 'contact';
  contactType: ContactType;
  variableId: string | null;
}
export interface CoilInstruction {
  id: string;
  kind: 'coil';
  variableId: string | null;
}
export type LadderInstruction = ContactInstruction | CoilInstruction;

/** contacts 的数组顺序就是从左到右的串联关系，coil 固定在网络末端。 */
export interface LadderNetwork {
  id: string;
  name: string;
  topology: 'series';
  contacts: ContactInstruction[];
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
