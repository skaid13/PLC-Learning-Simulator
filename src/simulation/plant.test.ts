import { expect, it } from 'vitest';
import { advancePlant, createPlant, plantSensors } from './plant';
import { createReferenceProgram } from '../data/referencePrograms';
import { experiments } from '../data/experiments';
import { createRuntime, runtimeReducer } from '../engine/runtime';
it('没有输出就不播放电梯或机械手固定流程', () => {
  for (const id of ['arm', 'elevator', 'stepper', 'assembly', 'conveyor']) {
    const initial = createPlant();
    const next = advancePlant(id, initial, {}, {});
    expect(next.x).toBe(initial.x);
    expect(next.y).toBe(initial.y);
    expect(next.floor).toBe(initial.floor);
    expect(next.angle).toBe(initial.angle);
    expect(next.position).toBe(initial.position);
  }
});
it('相反方向互锁，注入卡滞会冻结动作但保留输出', () => {
  const p = createPlant();
  const values = { 'output:O-03': true, 'output:O-04': true };
  expect(advancePlant('elevator', p, values, {}).alerts).toHaveLength(1);
  expect(advancePlant('elevator', p, values, {}).floor).toBe(1);
  expect(advancePlant('arm', p, { 'output:O-03': true }, {}, true).x).toBe(0);
});
it('传感器由位置计算；手动模式不会被自动采样覆盖，停止不推进物理状态', () => {
  const p = createReferenceProgram(experiments.find((e) => e.id === 'arm')!);
  let s = createRuntime(p);
  expect(plantSensors('arm', s.plant)['input:I-06']).toBe(true);
  s = runtimeReducer(s, { type: 'setting', program: p, name: 'autoSensors', value: false });
  s = runtimeReducer(s, { type: 'step', program: p });
  expect(s.scan.values['input:I-06']).toBe(false);
  expect(runtimeReducer(s, { type: 'tick', program: p })).toBe(s);
});
it('脉冲需要使能且仅上升沿移动；低电平后才可再次计步', () => {
  let p = createPlant();
  const values = { 'output:O-00': true, 'output:O-06': true };
  p = advancePlant('stepper', p, values, {});
  p = advancePlant('stepper', p, values, {});
  expect(p.pulses).toBe(1);
  p = advancePlant('stepper', p, { 'output:O-00': false, 'output:O-06': true }, {});
  p = advancePlant('stepper', p, values, {});
  expect(p.pulses).toBe(2);
  expect(p.angle).toBeCloseTo(0.45);
});
