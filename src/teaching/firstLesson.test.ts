import { it, expect } from 'vitest';
import {
  phaseProgram,
  lampProblem,
  verifiedCase,
  loadFirstLesson,
  FIRST_LESSON_KEY,
} from './firstLesson';
import { createRuntime, runtimeReducer } from '../engine/runtime';

it('验证读取真实扫描，拒绝未扫描、旧程序、错误指令和错误绑定', () => {
  const p = phaseProgram(1);
  let state = createRuntime(p);
  expect(verifiedCase(p, state, false)).toBeNull();
  state = runtimeReducer(state, {
    type: 'input',
    program: p,
    variableId: 'input:I-00',
    value: true,
  });
  expect(verifiedCase(p, state, false)).toBeNull();
  state = runtimeReducer(state, { type: 'step', program: p });
  expect(verifiedCase(p, state, false)).toBe('on');
  const other = structuredClone(p);
  expect(verifiedCase(other, state, false)).toBeNull();
  other.networks[0].coil!.operation = 'set';
  expect(lampProblem(other)).not.toBeNull();
  other.networks[0].coil!.operation = 'coil';
  other.networks[0].contacts[0].variableId = 'output:O-00';
  expect(lampProblem(other)).toMatch(/SIM_IN_00/);
});
it('常闭变式两种输入和常开结果相反', () => {
  const p = phaseProgram(5);
  p.networks[0].contacts[0].contactType = 'normallyClosed';
  let s = createRuntime(p);
  s = runtimeReducer(s, { type: 'step', program: p });
  expect(s.scan.values['output:O-00']).toBe(true);
  expect(verifiedCase(p, s, true)).toBe('off');
  s = runtimeReducer(s, { type: 'input', program: p, variableId: 'input:I-00', value: true });
  s = runtimeReducer(s, { type: 'step', program: p });
  expect(s.scan.values['output:O-00']).toBe(false);
  expect(verifiedCase(p, s, true)).toBe('on');
});
it('教学记录损坏原文可恢复，非法阶段或其他实验不可混入', () => {
  for (const raw of [
    '{broken',
    JSON.stringify({ version: 1, phase: 6, unlocked: 6, programs: {} }),
    JSON.stringify({ version: 1, phase: 0, unlocked: 0, programs: { 0: phaseProgram(1) } }),
  ]) {
    localStorage.setItem(FIRST_LESSON_KEY, raw);
    const read = loadFirstLesson(localStorage);
    expect(read.recovery).toBe(raw);
    expect(localStorage.getItem(FIRST_LESSON_KEY)).toBe(raw);
    expect(read.progress.phase).toBe(0);
  }
});
