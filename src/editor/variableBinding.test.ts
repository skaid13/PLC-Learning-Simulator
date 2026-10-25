import { expect, it } from 'vitest';
import { createWorkspace, editProgram } from './model';
import { starterExperiments } from '../data/starters';
import { parseProgram } from '../storage/projects';

it('创建并绑定是单次不可变修改，拒绝不存在的元件、重名、错误类型和物理变量', () => {
  let p = createWorkspace(starterExperiments[0]);
  const networkId = p.networks[0].id;
  p = editProgram(p, {
    type: 'addContact',
    networkId,
    contact: { id: 'contact', kind: 'contact', contactType: 'normallyOpen', variableId: null },
  });
  const variable = {
    id: 'custom:keep',
    name: '保持',
    kind: 'internal' as const,
    description: '自定义教学变量',
    dataType: 'boolean' as const,
  };
  const action = {
    type: 'createAndBindVariable' as const,
    networkId,
    instructionId: 'contact',
    variable,
  };
  for (const invalid of [
    { ...action, instructionId: 'missing' },
    { ...action, variable: { ...variable, name: 'SIM_IN_00' } },
    { ...action, variable: { ...variable, dataType: 'number' as const } },
    { ...action, variable: { ...variable, kind: 'input' as const, terminal: 'I-00' } },
  ])
    expect(editProgram(p, invalid)).toBe(p);
  const next = editProgram(p, action);
  expect(p.networks[0].contacts[0].variableId).toBeNull();
  expect(next.variables).toHaveLength(p.variables.length + 1);
  expect(next.networks[0].contacts[0].variableId).toBe(variable.id);
  expect(parseProgram(JSON.stringify(next)).variables.find((v) => v.id === variable.id)?.name).toBe(
    '保持',
  );
});

it('数值比较只能创建数值变量，复用与重命名始终保留引用ID', () => {
  let p = createWorkspace(starterExperiments[0]);
  const networkId = p.networks[0].id;
  p = editProgram(p, {
    type: 'addContact',
    networkId,
    contact: {
      id: 'compare',
      kind: 'contact',
      contactType: 'normallyOpen',
      variableId: null,
      comparison: { operator: 'gt', value: 2 },
    },
  });
  p = editProgram(p, {
    type: 'createAndBindVariable',
    networkId,
    instructionId: 'compare',
    variable: {
      id: 'custom:number',
      name: '次数',
      kind: 'internal',
      description: '计数显示',
      dataType: 'number',
    },
  });
  p = editProgram(p, {
    type: 'updateVariable',
    variableId: 'custom:number',
    patch: { name: '累计次数' },
  });
  expect(p.networks[0].contacts[0].variableId).toBe('custom:number');
  expect(p.variables.find((v) => v.id === 'custom:number')).toMatchObject({
    name: '累计次数',
    dataType: 'number',
  });
});
