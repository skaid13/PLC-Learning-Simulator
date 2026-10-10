import { expect, it } from 'vitest';
import { cloneNetwork, createWorkspace } from './model';
import { experiments } from '../data/experiments';
import { validateProgram } from './validation';
it('复制网络生成独立标识，保留分支关系与变量引用', () => {
  const p = createWorkspace(experiments[0]);
  const n = p.networks[0];
  n.contacts = [
    { id: 'c', kind: 'contact', variableId: p.variables[0].id, contactType: 'normallyOpen' },
  ];
  n.branches = [[{ ...n.contacts[0], id: 'b' }]];
  n.coil = { id: 'o', kind: 'coil', variableId: p.variables[1].id, operation: 'set' };
  const copied = cloneNetwork(n);
  expect(copied.id).not.toBe(n.id);
  expect(copied.contacts[0].id).not.toBe('c');
  expect(copied.branches![0][0].id).not.toBe('b');
  expect(copied.contacts[0].variableId).toBe(n.contacts[0].variableId);
  p.networks.push(copied);
  expect(validateProgram(p).filter((i) => i.severity === 'error')).toEqual([]);
});
it('同一完成变量的两个 CTU 被拒绝，RESET 不掩盖重复计数器', () => {
  const p = createWorkspace(experiments[0]);
  p.networks[0].coil = {
    id: 'o',
    kind: 'coil',
    variableId: p.variables[1].id,
    operation: 'ctu',
    preset: 1,
  };
  const n = cloneNetwork(p.networks[0]);
  p.networks.push(
    { ...cloneNetwork(n), coil: { ...n.coil!, id: 'reset', operation: 'resetCounter' } },
    n,
  );
  expect(validateProgram(p).map((i) => i.code)).toContain('counter-owner');
});
