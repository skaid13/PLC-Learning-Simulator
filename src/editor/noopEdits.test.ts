import { expect, it } from 'vitest';
import { createNetwork, createWorkspace, editProgram, type EditorAction } from './model';
import { starterExperiments } from '../data/starters';

function fixture() {
  const p = createWorkspace(starterExperiments[0]);
  p.networks = [
    {
      ...createNetwork('first'),
      name: '按钮控制',
      contacts: [
        { id: 'a', kind: 'contact', contactType: 'normallyOpen', variableId: 'input:I-00' },
      ],
      branches: [
        [{ id: 'b', kind: 'contact', contactType: 'normallyClosed', variableId: 'internal:0' }],
      ],
      coil: { id: 'c', kind: 'coil', variableId: 'output:O-00' },
    },
    createNetwork('last'),
  ];
  return p;
}

const noopActions: EditorAction[] = [
  { type: 'updateVariable', variableId: 'input:I-00', patch: { name: 'SIM_IN_00' } },
  { type: 'updateVariable', variableId: 'missing', patch: { name: '不存在' } },
  { type: 'deleteVariable', variableId: 'missing' },
  { type: 'deleteVariable', variableId: 'input:I-00' },
  { type: 'renameNetwork', networkId: 'first', name: '按钮控制' },
  { type: 'moveNetwork', networkId: 'first', direction: -1 },
  { type: 'moveNetwork', networkId: 'last', direction: 1 },
  { type: 'deleteBranch', networkId: 'first', branch: 0 },
  { type: 'deleteBranch', networkId: 'first', branch: 2 },
  { type: 'deleteInstruction', networkId: 'first', instructionId: 'missing' },
  { type: 'updateContact', networkId: 'first', instructionId: 'a', patch: { edge: undefined } },
  {
    type: 'updateContact',
    networkId: 'first',
    instructionId: 'missing',
    patch: { edge: 'rising' },
  },
  { type: 'updateCoil', networkId: 'first', patch: { variableId: 'output:O-00' } },
  { type: 'setVariable', networkId: 'first', instructionId: 'a', variableId: 'input:I-00' },
  { type: 'setVariable', networkId: 'first', instructionId: 'b', variableId: 'internal:0' },
  { type: 'setVariable', networkId: 'first', instructionId: 'c', variableId: 'output:O-00' },
  { type: 'moveContact', networkId: 'first', instructionId: 'b', direction: -1 },
  { type: 'moveContact', networkId: 'first', instructionId: 'missing', direction: 1 },
  {
    type: 'changeContactType',
    networkId: 'first',
    instructionId: 'a',
    contactType: 'normallyOpen',
  },
];

it.each(noopActions)('无效/无变化编辑保留程序身份，不触发调用方的复位和历史：$type', (action) => {
  const p = fixture();
  const before = structuredClone(p);
  expect(editProgram(p, action)).toBe(p);
  expect(p).toEqual(before);
});

it('相同比较值不产生编辑；真实比较修改仍创建新元件并保留其余分支', () => {
  const p = fixture();
  p.networks[0].contacts[0].comparison = { operator: 'gt', value: 2 };
  const action: EditorAction = {
    type: 'updateContact',
    networkId: 'first',
    instructionId: 'a',
    patch: { comparison: { operator: 'gt', value: 2 } },
  };
  expect(editProgram(p, action)).toBe(p);
  const next = editProgram(p, { ...action, patch: { comparison: { operator: 'gt', value: 3 } } });
  expect(next).not.toBe(p);
  expect(next.networks[0].contacts[0].comparison?.value).toBe(3);
  expect(p.networks[0].contacts[0].comparison?.value).toBe(2);
  expect(next.networks[0].branches).toBe(p.networks[0].branches);
  expect(next.networks[1]).toBe(p.networks[1]);
});

it('真实分支移动/删除与变量改名仍生效，旧程序可用于撤销', () => {
  const p = fixture();
  const renamed = editProgram(p, {
    type: 'updateVariable',
    variableId: 'internal:0',
    patch: { name: '保持' },
  });
  expect(renamed.variables.find((v) => v.id === 'internal:0')?.name).toBe('保持');
  expect(renamed.networks).toBe(p.networks);
  expect(p.variables.find((v) => v.id === 'internal:0')?.name).toBe('SIM_M_00');
  const removed = editProgram(p, { type: 'deleteBranch', networkId: 'first', branch: 1 });
  expect(removed.networks[0].branches).toEqual([]);
  expect(p.networks[0].branches?.[0][0].id).toBe('b');
  const moved = editProgram(p, { type: 'moveNetwork', networkId: 'last', direction: -1 });
  expect(moved.networks.map((n) => n.id)).toEqual(['last', 'first']);
  expect(p.networks.map((n) => n.id)).toEqual(['first', 'last']);
});
