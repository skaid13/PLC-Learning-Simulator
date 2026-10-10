import { describe, expect, it } from 'vitest';
import { experiments } from '../data/experiments';
import { createWorkspace } from '../editor/model';
import { createRuntime, runtimeReducer, type RuntimeAction, type RuntimeState } from './runtime';

function fixture() {
  const program = createWorkspace(experiments[0]);
  program.networks[0].contacts = [
    { id: 'c', kind: 'contact', contactType: 'normallyOpen', variableId: 'input:I-00' },
  ];
  program.networks[0].coil = { id: 'q', kind: 'coil', variableId: 'output:O-00' };
  return createRuntime(program);
}
function act(state: RuntimeState, action: Omit<RuntimeAction, 'program'>) {
  return runtimeReducer(state, { ...action, program: state.program } as RuntimeAction);
}

describe('运行控制状态机', () => {
  it('运行先扫描一次，tick 继续扫描；停止冻结，恢复保留扫描次数', () => {
    let state = fixture();
    state = runtimeReducer(state, {
      type: 'input',
      program: state.program,
      variableId: 'input:I-00',
      value: true,
    });
    state = act(state, { type: 'start' });
    expect(state).toMatchObject({ status: 'running', scan: { scanCount: 1 } });
    expect(state.scan.values['output:O-00']).toBe(true);
    state = act(state, { type: 'tick' });
    state = act(state, { type: 'stop' });
    expect(act(state, { type: 'tick' })).toBe(state);
    expect(act(state, { type: 'start' }).scan.scanCount).toBe(3);
  });
  it('停止时输入变化要等单步才更新输出；连续运行时拒绝重复启动与单步', () => {
    let state = act(fixture(), { type: 'start' });
    expect(act(state, { type: 'start' })).toBe(state);
    expect(act(state, { type: 'step' })).toBe(state);
    state = act(state, { type: 'stop' });
    state = runtimeReducer(state, {
      type: 'input',
      program: state.program,
      variableId: 'input:I-00',
      value: true,
    });
    expect(state.scan.values['output:O-00']).toBe(false);
    state = act(state, { type: 'step' });
    expect(state.status).toBe('stopped');
    expect(state.scan.values['output:O-00']).toBe(true);
  });
  it('复位清空所有值和轨迹而不修改程序，并使旧 tick 无效', () => {
    let state = act(fixture(), { type: 'start' });
    const program = state.program;
    state = act(state, { type: 'reset' });
    expect(state).toMatchObject({
      program,
      status: 'idle',
      inputs: {},
      scan: { scanCount: 0, traces: [] },
    });
    expect(Object.values(state.scan.values).every((value) => !value)).toBe(true);
    expect(act(state, { type: 'tick' })).toBe(state);
  });
  it('输入操作拒绝输出/内部/未知变量；旧工作区回调不能覆盖新状态', () => {
    const original = fixture();
    for (const variableId of ['output:O-00', 'internal:0', 'unknown'])
      expect(
        runtimeReducer(original, {
          type: 'input',
          program: original.program,
          variableId,
          value: true,
        }),
      ).toBe(original);
    const next = runtimeReducer(original, {
      type: 'reset',
      program: createWorkspace(experiments[1]),
    });
    expect(runtimeReducer(next, { type: 'tick', program: original.program })).toBe(next);
    expect(runtimeReducer(next, { type: 'start', program: original.program })).toBe(next);
  });
  it('无效程序阻止运行/单步，不留下旧输出', () => {
    const state = createRuntime(createWorkspace(experiments[0]));
    for (const type of ['start', 'step'] as const) {
      const result = act(state, { type });
      expect(result.status).toBe('error');
      expect(result.scan.scanCount).toBe(0);
      expect(result.issues[0].code).toBe('missing-coil');
    }
  });
});
