import type { ProgramWorkspace } from '../types';
import { validateProgram, type ProgramIssue } from '../editor/validation';
export type BoolValues = Record<string, boolean>;
export type VariableValue = boolean | number;
export type RuntimeValues = Record<string, VariableValue>;
export interface InstructionMemory {
  elapsed: number;
  count: number;
  previous: boolean;
}
export interface ContactTrace {
  instructionId: string;
  variableId: string;
  value: VariableValue;
  condition: boolean;
  path: boolean;
  branch?: number;
}
export interface NetworkTrace {
  networkId: string;
  contacts: ContactTrace[];
  result: boolean;
  coil: {
    instructionId: string;
    variableId: string;
    previous: VariableValue;
    value: VariableValue;
    written?: boolean;
    elapsed?: number;
    count?: number;
  };
}
export interface ScanState {
  values: RuntimeValues;
  scanCount: number;
  traces: NetworkTrace[];
  memory?: Record<string, InstructionMemory>;
  elapsedMs?: number;
}
export type ScanResult = { ok: true; state: ScanState } | { ok: false; issues: ProgramIssue[] };
export function createScanState(program: ProgramWorkspace): ScanState {
  return {
    values: Object.fromEntries(
      program.variables.map((v) => [v.id, v.dataType === 'number' ? (v.initialValue ?? 0) : false]),
    ),
    scanCount: 0,
    traces: [],
    memory: {},
    elapsedMs: 0,
  };
}
const numeric = (value: VariableValue | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;
const freshMemory = (): InstructionMemory => ({ elapsed: 0, count: 0, previous: false });
export function scanProgram(
  program: ProgramWorkspace,
  previous: ScanState,
  inputs: BoolValues,
  deltaMs = 200,
): ScanResult {
  const issues = validateProgram(program).filter((i) => i.severity === 'error');
  if (!Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs > 1000)
    issues.push({
      code: 'delta',
      severity: 'error',
      networkId: null,
      instructionId: null,
      message: '扫描时间步长必须为 0～1000 ms 之间的正数。',
    });
  if (issues.length) return { ok: false, issues };
  const values: RuntimeValues = Object.fromEntries(
    program.variables.map((v) => [
      v.id,
      v.kind === 'input'
        ? inputs[v.id] === true
        : v.dataType === 'number'
          ? numeric(previous.values[v.id])
          : previous.values[v.id] === true,
    ]),
  );
  const memory = Object.fromEntries(
    Object.entries(previous.memory ?? {}).map(([key, value]) => [key, { ...value }]),
  );
  const traces: NetworkTrace[] = [];
  for (const network of program.networks) {
    const contacts: ContactTrace[] = [];
    const branchResults = [network.contacts, ...(network.branches ?? [])].map(
      (branch, branchIndex) => {
        let path = true;
        for (const contact of branch) {
          const variableId = contact.variableId!;
          const value = values[variableId];
          let condition = value === true;
          if (contact.comparison) {
            const left = numeric(value),
              right = contact.comparison.value;
            condition = {
              eq: left === right,
              ne: left !== right,
              gt: left > right,
              ge: left >= right,
              lt: left < right,
              le: left <= right,
            }[contact.comparison.operator];
          } else if (contact.contactType === 'normallyClosed') condition = !condition;
          if (contact.edge === 'rising') {
            const m = memory[contact.id] ?? freshMemory();
            const current = condition;
            condition = current && !m.previous;
            memory[contact.id] = { ...m, previous: current };
          }
          path = path && condition;
          contacts.push({
            instructionId: contact.id,
            variableId,
            value,
            condition,
            path,
            branch: branchIndex,
          });
        }
        return path;
      },
    );
    const path = branchResults.some(Boolean),
      coil = network.coil!,
      variableId = coil.variableId!;
    const before = values[variableId],
      operation = coil.operation ?? 'coil';
    let value = before,
      written = true;
    const m = { ...(memory[variableId] ?? freshMemory()) };
    const preset = coil.preset ?? (operation === 'ctu' ? 1 : 1000);
    switch (operation) {
      case 'coil':
        value = path;
        break;
      case 'set':
        if (path) value = true;
        else written = false;
        break;
      case 'reset':
        if (path) value = false;
        else written = false;
        break;
      case 'ton':
        m.elapsed = path ? Math.min(preset, m.elapsed + deltaMs) : 0;
        value = path && m.elapsed >= preset;
        break;
      case 'tof':
        if (path) {
          m.elapsed = 0;
          m.previous = true;
          value = true;
        } else if (m.previous) {
          m.elapsed = Math.min(preset, m.elapsed + deltaMs);
          value = m.elapsed < preset;
          if (!value) m.previous = false;
        } else value = false;
        break;
      case 'pulse':
        m.elapsed = path ? m.elapsed + deltaMs : 0;
        value = path && m.elapsed >= preset;
        if (value) m.elapsed %= preset;
        break;
      case 'ctu':
        if (path && !m.previous) m.count = Math.min(1000000, m.count + 1);
        m.previous = path;
        value = m.count >= preset;
        if (coil.countVariableId) values[coil.countVariableId] = m.count;
        break;
      case 'resetCounter':
        if (path) {
          m.count = 0;
          value = false;
          if (coil.countVariableId) values[coil.countVariableId] = 0;
        } else written = false;
        break;
      case 'move':
      case 'add':
        if (path) {
          const operand = coil.sourceVariableId
            ? numeric(values[coil.sourceVariableId])
            : (coil.preset ?? 0);
          value = operation === 'move' ? operand : numeric(before) + operand;
          value = Math.max(-1000000, Math.min(1000000, value));
        } else written = false;
        break;
    }
    if (['ton', 'tof', 'pulse', 'ctu', 'resetCounter'].includes(operation)) memory[variableId] = m;
    values[variableId] = value;
    traces.push({
      networkId: network.id,
      contacts,
      result: path,
      coil: {
        instructionId: coil.id,
        variableId,
        previous: before,
        value,
        written,
        elapsed: m.elapsed,
        count: m.count,
      },
    });
  }
  return {
    ok: true,
    state: {
      values,
      scanCount: previous.scanCount + 1,
      traces,
      memory,
      elapsedMs: (previous.elapsedMs ?? 0) + deltaMs,
    },
  };
}
