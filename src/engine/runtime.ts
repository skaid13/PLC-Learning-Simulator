import { createPlant, advancePlant, plantSensors, type PlantState } from '../simulation/plant';
import type { ProgramWorkspace } from '../types';
import { createScanState, scanProgram, type BoolValues, type ScanState } from './scan';
import type { ProgramIssue } from '../editor/validation';

export const SCAN_INTERVAL_MS = 200;
export type RuntimeStatus = 'idle' | 'running' | 'stopped' | 'error';
export const statusNames: Record<RuntimeStatus, string> = {
  idle: '未运行',
  running: '运行中',
  stopped: '已停止',
  error: '运行受阻',
};
export interface RuntimeState {
  program: ProgramWorkspace;
  status: RuntimeStatus;
  inputs: BoolValues;
  scan: ScanState;
  issues: ProgramIssue[];
  plant: PlantState;
  autoSensors: boolean;
  stalled: boolean;
  stuckSensors: boolean;
}
export type RuntimeAction = {
  program: ProgramWorkspace;
} & (
  | { type: 'start' | 'stop' | 'step' | 'tick' | 'reset' }
  | { type: 'input'; variableId: string; value: boolean }
  | { type: 'setting'; name: 'autoSensors' | 'stalled' | 'stuckSensors'; value: boolean }
);

export function createRuntime(program: ProgramWorkspace): RuntimeState {
  return {
    program,
    status: 'idle',
    inputs: {},
    scan: createScanState(program),
    issues: [],
    plant: createPlant(),
    autoSensors: true,
    stalled: false,
    stuckSensors: false,
  };
}

export function runtimeReducer(state: RuntimeState, action: RuntimeAction): RuntimeState {
  if (action.type === 'reset') return createRuntime(action.program);
  // 切换实验/修改程序后，旧计时回调不能写入新工作区。
  if (action.program !== state.program) return state;
  if (action.type === 'setting') return { ...state, [action.name]: action.value };
  if (action.type === 'input') {
    if (!state.program.variables.some((v) => v.id === action.variableId && v.kind === 'input'))
      return state;
    return { ...state, inputs: { ...state.inputs, [action.variableId]: action.value } };
  }
  if (action.type === 'stop')
    return state.status === 'running' ? { ...state, status: 'stopped' } : state;
  if (action.type === 'tick' && state.status !== 'running') return state;
  if ((action.type === 'start' || action.type === 'step') && state.status === 'running')
    return state;
  const inputs = state.autoSensors
    ? {
        ...state.inputs,
        ...(state.stuckSensors ? {} : plantSensors(state.program.experimentId, state.plant)),
      }
    : state.inputs;
  const result = scanProgram(state.program, state.scan, inputs);
  if (!result.ok)
    return {
      ...state,
      status: 'error',
      scan: createScanState(state.program),
      issues: result.issues,
    };
  return {
    ...state,
    status: action.type === 'step' ? 'stopped' : 'running',
    scan: result.state,
    inputs,
    plant: advancePlant(
      state.program.experimentId,
      state.plant,
      result.state.values,
      inputs,
      state.stalled,
    ),
    issues: [],
  };
}
