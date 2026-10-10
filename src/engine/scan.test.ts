import { describe, expect, it } from 'vitest';
import type { LadderNetwork, ProgramWorkspace } from '../types';
import { createScanState, scanProgram, type ScanState } from './scan';

function network(id: string, source: string, target: string, closed = false): LadderNetwork {
  return {
    id,
    name: '',
    topology: 'series',
    contacts: [
      {
        id: `${id}-contact`,
        kind: 'contact',
        contactType: closed ? 'normallyClosed' : 'normallyOpen',
        variableId: source,
      },
    ],
    coil: { id: `${id}-coil`, kind: 'coil', variableId: target },
  };
}
function program(networks = [network('first', 'in', 'out')]): ProgramWorkspace {
  return {
    schemaVersion: 1,
    id: 'p',
    experimentId: 'test',
    name: '测试',
    networks,
    variables: [
      { id: 'in', name: 'IN', kind: 'input', description: '' },
      { id: 'stop', name: 'STOP', kind: 'input', description: '' },
      { id: 'out', name: 'OUT', kind: 'output', description: '' },
      { id: 'm', name: 'M', kind: 'internal', description: '' },
    ],
  };
}
function run(
  p: ProgramWorkspace,
  inputs: Record<string, boolean>,
  previous = createScanState(p),
): ScanState {
  const result = scanProgram(p, previous, inputs);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('扫描被拒绝');
  return result.state;
}

describe('教学扫描引擎', () => {
  it('全部初始 FALSE；常开传递输入并在下一次 FALSE 时清除线圈', () => {
    const p = program();
    expect(createScanState(p).values).toEqual({ in: false, stop: false, out: false, m: false });
    const on = run(p, { in: true });
    expect(on.values.out).toBe(true);
    const off = run(p, { in: false }, on);
    expect(off.values.out).toBe(false);
    expect(off.scanCount).toBe(2);
    expect(off.traces[0].coil).toMatchObject({ previous: true, value: false });
  });
  it.each([
    [false, false, false],
    [false, true, false],
    [true, false, true],
    [true, true, false],
  ])('常开输入 %s 串联常闭停止 %s 的完整真值表结果为 %s', (input, stop, expected) => {
    const p = program();
    p.networks[0].contacts.push({
      id: 'stop-contact',
      kind: 'contact',
      contactType: 'normallyClosed',
      variableId: 'stop',
    });
    const state = run(p, { in: input, stop });
    expect(state.values.out).toBe(expected);
    expect(state.traces[0].contacts).toHaveLength(2);
    expect(state.traces[0].contacts[1]).toMatchObject({
      value: stop,
      condition: !stop,
      path: expected,
    });
  });
  it('网络按顺序即时写内部变量；调换顺序使后写变量在下次扫描才被读取', () => {
    const first = network('first', 'in', 'm');
    const second = network('second', 'm', 'out');
    const forward = program([first, second]);
    const state = run(forward, { in: true });
    expect(state.values.out).toBe(true);
    expect(state.traces[1].contacts[0].value).toBe(true);
    const reverse = program([second, first]);
    const lagged = run(reverse, { in: true });
    expect(lagged.values).toMatchObject({ m: true, out: false });
    expect(run(reverse, { in: true }, lagged).values.out).toBe(true);
  });
  it('自引用线圈在当前网络读取上次值，常闭自引用每次扫描翻转', () => {
    const p = program([network('self', 'out', 'out', true)]);
    const first = run(p, {});
    const second = run(p, {}, first);
    expect([first.values.out, second.values.out]).toEqual([true, false]);
    expect(second.traces[0].contacts[0]).toMatchObject({ value: true, condition: false });
  });
  it('无触点网络有提示但可无条件置 TRUE；未写的内部变量保持值', () => {
    const p = program();
    p.networks[0].contacts = [];
    const previous = createScanState(p);
    previous.values.m = true;
    const next = run(p, {}, previous);
    expect(next.values).toMatchObject({ out: true, m: true, in: false });
    expect(next.traces[0].contacts).toEqual([]);
  });
  it('输入只从快照读取，忽略试图注入输出的值；不修改参数或旧轨迹', () => {
    const p = program();
    const previous = createScanState(p);
    const inputs = { in: true, out: false, m: true };
    const snapshot = JSON.stringify({ p, previous, inputs });
    const next = run(p, inputs, previous);
    expect(next.values).toMatchObject({ in: true, out: true, m: false });
    expect(JSON.stringify({ p, previous, inputs })).toBe(snapshot);
    expect(next.values).not.toBe(previous.values);
    expect(next.traces[0].contacts[0]).toMatchObject({
      variableId: 'in',
      value: true,
      condition: true,
      path: true,
    });
  });
  it('后续网络结构错误时整次拒绝，不执行前面的合法线圈', () => {
    const p = program([network('first', 'in', 'out'), network('bad', 'm', 'm')]);
    p.networks[1].coil = null;
    const previous = createScanState(p);
    const result = scanProgram(p, previous, { in: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some((i) => i.code === 'missing-coil')).toBe(true);
    expect(previous.values.out).toBe(false);
    expect(previous.scanCount).toBe(0);
  });
  it.each([
    'topology',
    'instruction',
    'contactType',
    'schema',
    'variableKind',
    'duplicateVariable',
    'duplicateInstruction',
    'duplicateNetwork',
    'duplicateWriter',
    'inputCoil',
    'unbound',
    'unknown',
  ])('拒绝不支持或不明确的 %s', (kind) => {
    const p = program();
    switch (kind) {
      case 'topology':
        Object.assign(p.networks[0], { topology: 'parallel' });
        break;
      case 'instruction':
        Object.assign(p.networks[0].contacts[0], { kind: 'timer' });
        break;
      case 'contactType':
        Object.assign(p.networks[0].contacts[0], { contactType: 'risingEdge' });
        break;
      case 'schema':
        Object.assign(p, { schemaVersion: 2 });
        break;
      case 'variableKind':
        Object.assign(p.variables[0], { kind: 'integer' });
        break;
      case 'duplicateVariable':
        p.variables.push({ ...p.variables[0] });
        break;
      case 'duplicateInstruction':
        p.networks[0].coil!.id = p.networks[0].contacts[0].id;
        break;
      case 'duplicateNetwork':
        p.networks.push({ ...network('first', 'in', 'm'), contacts: [] });
        break;
      case 'duplicateWriter':
        p.networks.push(network('other', 'in', 'out'));
        break;
      case 'inputCoil':
        p.networks[0].coil!.variableId = 'in';
        break;
      case 'unbound':
        p.networks[0].contacts[0].variableId = null;
        break;
      case 'unknown':
        p.networks[0].contacts[0].variableId = 'missing';
        break;
    }
    expect(scanProgram(p, createScanState(p), {})).toMatchObject({ ok: false });
  });
});
