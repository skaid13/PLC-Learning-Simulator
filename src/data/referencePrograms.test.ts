import { describe, expect, it } from 'vitest';
import { experiments } from './experiments';
import { createReferenceProgram, towerGroups } from './referencePrograms';
import { validateProgram } from '../editor/validation';
import { createRuntime, runtimeReducer, type RuntimeState } from '../engine/runtime';
import { parseProgram } from '../storage/projects';
const fixture = (id: string) =>
  createRuntime(createReferenceProgram(experiments.find((e) => e.id === id)!));
function input(s: RuntimeState, n: number, on = true) {
  return runtimeReducer(s, {
    type: 'input',
    program: s.program,
    variableId: `input:I-${String(n).padStart(2, '0')}`,
    value: on,
  });
}
function scans(s: RuntimeState, n = 1) {
  for (let i = 0; i < n; i++) s = runtimeReducer(s, { type: 'step', program: s.program });
  expect(s.status).not.toBe('error');
  return s;
}
const out = (s: RuntimeState, n: number) => s.scan.values[`output:O-${String(n).padStart(2, '0')}`];
const val = (s: RuntimeState, n: string) => s.scan.values[`ref:${n}`];
describe('所有参考程序使用公共指令，可序列化并执行', () => {
  for (const e of experiments)
    it(`${e.name} 结构有效且 JSON 往返`, () => {
      const p = createReferenceProgram(e);
      expect(validateProgram(p).filter((i) => i.severity === 'error')).toEqual([]);
      expect(parseProgram(JSON.stringify(p))).toEqual(p);
      expect(scans(createRuntime(p)).scan.scanCount).toBe(1);
    });
  it('LED 单段到数字循环，改掉输出网络会改变装置结果', () => {
    let s = scans(input(fixture('led'), 0));
    expect(out(s, 0)).toBe(true);
    expect(out(s, 1)).toBe(false);
    s = scans(s, 39);
    expect(val(s, '显示序号')).toBe(8);
    expect(out(s, 0)).toBe(true);
    expect(out(s, 6)).toBe(false);
    s = scans(s, 80);
    expect(val(s, '显示序号')).toBe(0);
  });
  it('步进只响应有效脉冲边沿，400 脉冲停在 90°', () => {
    let s = input(input(fixture('stepper'), 2), 0);
    s = scans(s, 805);
    expect(val(s, '累计脉冲')).toBe(400);
    expect(s.plant.pulses).toBe(400);
    expect(s.plant.angle).toBeCloseTo(90);
    expect(out(s, 0)).toBe(false);
  });
  it('交通灯互锁，五秒后进入黄灯，开关断开全部熄灭', () => {
    let s = scans(input(fixture('traffic'), 1));
    expect(out(s, 0)).toBe(true);
    expect(out(s, 3)).toBe(true);
    s = scans(s, 25);
    expect(out(s, 3)).toBe(false);
    expect(val(s, '相位')).toBe(2);
    for (let i = 0; i < 100; i++) {
      s = scans(s);
      expect(out(s, 2) && out(s, 3)).toBe(false);
    }
    s = scans(input(s, 1, false));
    expect([0, 1, 2, 3, 4, 5].every((n) => !out(s, n))).toBe(true);
  });
  it('机械手通过位置传感器完成搬运并回原位', () => {
    let s = scans(input(fixture('arm'), 1), 170);
    expect(s.plant.x).toBeCloseTo(0);
    expect(s.plant.y).toBeCloseTo(0);
    expect(s.plant.pieceX).toBeCloseTo(1);
    expect(s.plant.pieceY).toBeCloseTo(1);
    expect(out(s, 0)).toBe(true);
    expect(val(s, '步骤')).toBe(0);
  });
  it('电梯记录请求并到站清灯，忽略当前层呼叫', () => {
    let s = scans(input(fixture('elevator'), 0));
    expect(out(s, 5)).toBe(false);
    s = scans(input(s, 2), 90);
    expect(s.plant.floor).toBeCloseTo(3);
    expect(out(s, 2)).toBe(true);
    expect(out(s, 7)).toBe(false);
    expect(out(s, 4)).toBe(false);
  });
  it('卡住补水会在四秒后报警，正常补水可解除低位', () => {
    let s = fixture('water');
    s = runtimeReducer(s, { type: 'setting', program: s.program, name: 'stalled', value: true });
    s = scans(s, 20);
    expect(val(s, '补水超时')).toBe(true);
    s = runtimeReducer(s, { type: 'setting', program: s.program, name: 'stalled', value: false });
    s = scans(s, 80);
    expect(s.plant.pool).toBeGreaterThan(0.25);
  });
  it('灯塔按十一组循环', () => {
    let s = scans(input(fixture('tower'), 0), 55);
    expect(val(s, '灯组序号')).toBe(0);
    expect(towerGroups.length).toBe(11);
    expect(out(s, 0)).toBe(true);
    expect(out(s, 1)).toBe(false);
  });
  it('混合液位自动反馈：加 A、加 B、搅拌、排空并结束', () => {
    let s = scans(input(fixture('mix'), 0), 120);
    expect(val(s, '步骤')).toBe(0);
    expect(s.plant.level).toBe(0);
    expect([0, 1, 2, 3].every((n) => !out(s, n))).toBe(true);
  });
  it('流水线在加工工位等待手动移位，G 采用明确教学衔接', () => {
    let s = scans(input(fixture('assembly'), 0), 20);
    expect(out(s, 1)).toBe(true);
    for (let i = 0; i < 3; i++) {
      s = scans(input(s, 2));
      s = scans(input(s, 2, false), 20);
    }
    expect(out(s, 7)).toBe(true);
    expect(val(s, '步骤')).toBe(8);
    s = scans(input(s, 1));
    expect([0, 1, 2, 3, 4, 5, 6, 7].every((n) => !out(s, n))).toBe(true);
  });
  it('售货机投币边沿、扣款、出货五秒、找零和九元上限', () => {
    let s = scans(input(fixture('vending'), 2), 2);
    expect(val(s, '余额')).toBe(5);
    s = scans(input(s, 3));
    expect(val(s, '余额')).toBe(2);
    expect(out(s, 9)).toBe(true);
    expect(s.plant.delivered).toBe(1);
    s = scans(s, 25);
    expect(out(s, 9)).toBe(false);
    s = scans(input(s, 5));
    expect(val(s, '余额')).toBe(0);
    s = scans(input(s, 2, false));
    s = scans(input(s, 2));
    s = scans(input(s, 2, false));
    s = scans(input(s, 2));
    expect(val(s, '余额')).toBe(5);
  });
  it('四带倒序启动，M2 故障立即停前段、后段延时停；空料急停', () => {
    let s = scans(input(input(fixture('conveyor'), 8), 0));
    expect([1, 2, 3, 4].map((n) => out(s, n))).toEqual([false, false, false, true]);
    s = scans(s, 75);
    expect([1, 2, 3, 4].map((n) => out(s, n))).toEqual([true, true, true, true]);
    s = scans(input(s, 3));
    expect([1, 2, 3, 4].map((n) => out(s, n))).toEqual([false, false, true, true]);
    s = scans(s, 25);
    expect(out(s, 3)).toBe(false);
    expect(out(s, 4)).toBe(true);
    s = scans(input(s, 8, false));
    expect([1, 2, 3, 4].every((n) => !out(s, n))).toBe(true);
  });
});
