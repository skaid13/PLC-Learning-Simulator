import { describe, expect, it } from 'vitest';
import { createWorkspace } from '../editor/model';
import { experiments } from '../data/experiments';
import { createScanState, scanProgram, type ScanState } from './scan';
import type { CoilInstruction, ProgramWorkspace } from '../types';
function fixture(operation: CoilInstruction['operation'], preset = 600) {
  const p = createWorkspace(experiments[0]);
  p.variables.push({
    id: 'n',
    name: 'N',
    kind: 'internal',
    description: 'count',
    dataType: 'number',
  });
  p.networks = [
    {
      id: 'net',
      name: 'test',
      topology: 'series',
      contacts: [
        { id: 'c', kind: 'contact', contactType: 'normallyOpen', variableId: p.variables[0].id },
      ],
      coil: { id: 'o', kind: 'coil', variableId: p.variables[1].id, operation, preset },
    },
  ];
  return p;
}
function tick(p: ProgramWorkspace, s: ScanState, on: boolean) {
  const r = scanProgram(p, s, { [p.variables[0].id]: on });
  if (!r.ok) throw Error(JSON.stringify(r.issues));
  return r.state;
}
describe('高级指令使用同一扫描引擎', () => {
  it('TON 精确累加且断开后清零，不修改旧状态', () => {
    const p = fixture('ton');
    const s = createScanState(p),
      a = tick(p, s, true),
      b = tick(p, a, true),
      c = tick(p, b, true);
    expect(a.values[p.variables[1].id]).toBe(false);
    expect(c.values[p.variables[1].id]).toBe(true);
    expect(s.memory).toEqual({});
    expect(tick(p, c, false).memory?.[p.variables[1].id].elapsed).toBe(0);
  });
  it('TOF 初始不导通，下降后延时断开', () => {
    const p = fixture('tof');
    let s = tick(p, createScanState(p), false);
    expect(s.values[p.variables[1].id]).toBe(false);
    s = tick(p, s, true);
    s = tick(p, s, false);
    expect(s.values[p.variables[1].id]).toBe(true);
    s = tick(p, tick(p, s, false), false);
    expect(s.values[p.variables[1].id]).toBe(false);
  });
  it('计数只记录上升沿并写数值监视变量', () => {
    const p = fixture('ctu', 2);
    p.networks[0].coil!.countVariableId = 'n';
    let s = createScanState(p);
    for (const on of [true, true, false, true]) s = tick(p, s, on);
    expect(s.values.n).toBe(2);
    expect(s.values[p.variables[1].id]).toBe(true);
  });
  it('并联支路 OR，串联条件 AND', () => {
    const p = fixture('coil');
    p.networks[0].branches = [
      [{ id: 'nc', kind: 'contact', contactType: 'normallyClosed', variableId: p.variables[0].id }],
    ];
    expect(tick(p, createScanState(p), false).values[p.variables[1].id]).toBe(true);
  });
  it('SET 保持，RESET 清除，轨迹标注实际写入', () => {
    const p = fixture('set');
    let s = tick(p, createScanState(p), true);
    s = tick(p, s, false);
    expect(s.values[p.variables[1].id]).toBe(true);
    expect(s.traces[0].coil.written).toBe(false);
    p.networks[0].coil!.operation = 'reset';
    s = tick(p, s, true);
    expect(s.values[p.variables[1].id]).toBe(false);
  });
  it('脉冲在扫描间释放，边沿只执行一次', () => {
    const p = fixture('pulse', 400);
    let s = createScanState(p);
    const values = [];
    for (let i = 0; i < 5; i++) {
      s = tick(p, s, true);
      values.push(s.values[p.variables[1].id]);
    }
    expect(values).toEqual([false, true, false, true, false]);
    p.networks[0].contacts[0].edge = 'rising';
    p.networks[0].coil = { id: 'o', kind: 'coil', operation: 'add', variableId: 'n', preset: 3 };
    s = createScanState(p);
    for (const on of [true, true, false, true]) s = tick(p, s, on);
    expect(s.values.n).toBe(6);
  });
  it('数值比较与 MOV 不使用布尔真值转换', () => {
    const p = fixture('move', 7);
    p.networks[0].coil!.variableId = 'n';
    let s = tick(p, createScanState(p), true);
    expect(s.values.n).toBe(7);
    p.networks[0].contacts[0] = {
      id: 'compare',
      kind: 'contact',
      variableId: 'n',
      contactType: 'normallyOpen',
      comparison: { operator: 'ge', value: 7 },
    };
    p.networks[0].coil = { id: 'o', kind: 'coil', variableId: p.variables[1].id };
    s = tick(p, s, false);
    expect(s.values[p.variables[1].id]).toBe(true);
  });
});
