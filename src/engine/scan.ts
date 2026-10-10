import type { ProgramWorkspace } from '../types';
import { validateProgram, type ProgramIssue } from '../editor/validation';

export type BoolValues = Record<string, boolean>;
export interface ContactTrace {
  instructionId: string;
  variableId: string;
  value: boolean;
  condition: boolean;
  path: boolean;
}
export interface NetworkTrace {
  networkId: string;
  contacts: ContactTrace[];
  result: boolean;
  coil: { instructionId: string; variableId: string; previous: boolean; value: boolean };
}
export interface ScanState {
  values: BoolValues;
  scanCount: number;
  traces: NetworkTrace[];
}
export type ScanResult = { ok: true; state: ScanState } | { ok: false; issues: ProgramIssue[] };

export function createScanState(program: ProgramWorkspace): ScanState {
  return {
    values: Object.fromEntries(program.variables.map((variable) => [variable.id, false])),
    scanCount: 0,
    traces: [],
  };
}

/** 教学简化：输入快照 → 顺序计算网络并即时写线圈 → 发布扫描结果。非真实硬件时序。 */
export function scanProgram(
  program: ProgramWorkspace,
  previous: ScanState,
  inputs: BoolValues,
): ScanResult {
  const issues = validateProgram(program).filter((issue) => issue.severity === 'error');
  if (issues.length) return { ok: false, issues };
  const values: BoolValues = Object.fromEntries(
    program.variables.map((variable) => [
      variable.id,
      variable.kind === 'input'
        ? inputs[variable.id] === true
        : previous.values[variable.id] === true,
    ]),
  );
  const traces: NetworkTrace[] = [];
  for (const network of program.networks) {
    let path = true;
    const contacts = network.contacts.map((contact): ContactTrace => {
      const variableId = contact.variableId!;
      const value = values[variableId];
      const condition = contact.contactType === 'normallyOpen' ? value : !value;
      path = path && condition;
      return { instructionId: contact.id, variableId, value, condition, path };
    });
    // 结构检查保证有末端线圈、变量已绑定且只能写输出/内部变量。
    const coil = network.coil!;
    const variableId = coil.variableId!;
    const before = values[variableId];
    values[variableId] = path;
    traces.push({
      networkId: network.id,
      contacts,
      result: path,
      coil: { instructionId: coil.id, variableId, previous: before, value: path },
    });
  }
  return { ok: true, state: { values, scanCount: previous.scanCount + 1, traces } };
}
