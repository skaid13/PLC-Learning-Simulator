import { describe, expect, it } from 'vitest';
import { experiments } from '../data/experiments';
import { createNetwork, createWorkspace, editProgram, MAX_CONTACTS } from './model';
import type { ContactInstruction } from '../types';

function contact(id: string, variableId: string | null = null): ContactInstruction {
  return { id, kind: 'contact', contactType: 'normallyOpen', variableId };
}

describe('结构化梯形图编辑数据', () => {
  it('保留非连续的指导书端子，并明确区分教学变量与实体端子', () => {
    const workspace = createWorkspace(experiments[1]);
    expect(
      workspace.variables
        .filter((item) => item.kind === 'output')
        .map((item) => [item.name, item.terminal]),
    ).toEqual([
      ['SIM_OUT_00', 'O-00'],
      ['SIM_OUT_03', 'O-03'],
      ['SIM_OUT_06', 'O-06'],
    ]);
    expect(workspace.variables.filter((item) => item.kind === 'internal')).toHaveLength(4);
    expect(
      workspace.variables
        .filter((item) => item.kind === 'internal')
        .every((item) => item.terminal === undefined),
    ).toBe(true);
    expect(createWorkspace(experiments[0]).id).not.toBe(workspace.id);
  });

  it('放置、绑定和修改是纯数据操作，结果可完整 JSON 往返', () => {
    const original = createWorkspace(experiments[0]);
    const snapshot = JSON.stringify(original);
    const networkId = original.networks[0].id;
    let program = editProgram(original, { type: 'addContact', networkId, contact: contact('c1') });
    program = editProgram(program, {
      type: 'setVariable',
      networkId,
      instructionId: 'c1',
      variableId: 'input:I-00',
    });
    program = editProgram(program, {
      type: 'changeContactType',
      networkId,
      instructionId: 'c1',
      contactType: 'normallyClosed',
    });
    program = editProgram(program, { type: 'addCoil', networkId, instructionId: 'coil' });
    program = editProgram(program, {
      type: 'setVariable',
      networkId,
      instructionId: 'coil',
      variableId: 'output:O-00',
    });
    expect(JSON.stringify(original)).toBe(snapshot);
    expect(program.networks[0].contacts[0]).toMatchObject({
      id: 'c1',
      contactType: 'normallyClosed',
      variableId: 'input:I-00',
    });
    expect(program.networks[0].coil?.variableId).toBe('output:O-00');
    expect(JSON.parse(JSON.stringify(program))).toEqual(program);
  });

  it('拒绝超出四触点、一线圈范围的操作以及写输入/未知变量', () => {
    let program = createWorkspace(experiments[0]);
    const networkId = program.networks[0].id;
    for (let i = 0; i < MAX_CONTACTS; i++)
      program = editProgram(program, { type: 'addContact', networkId, contact: contact(`c${i}`) });
    expect(
      editProgram(program, { type: 'addContact', networkId, contact: contact('overflow') }),
    ).toBe(program);
    program = editProgram(program, { type: 'addCoil', networkId, instructionId: 'coil' });
    expect(editProgram(program, { type: 'addCoil', networkId, instructionId: 'other' })).toBe(
      program,
    );
    expect(
      editProgram(program, {
        type: 'setVariable',
        networkId,
        instructionId: 'coil',
        variableId: 'input:I-00',
      }),
    ).toBe(program);
    expect(
      editProgram(program, {
        type: 'setVariable',
        networkId,
        instructionId: 'c0',
        variableId: 'missing',
      }),
    ).toBe(program);
    program = editProgram(program, {
      type: 'setVariable',
      networkId,
      instructionId: 'coil',
      variableId: 'internal:0',
    });
    expect(program.networks[0].coil?.variableId).toBe('internal:0');
    program = editProgram(program, {
      type: 'setVariable',
      networkId,
      instructionId: 'coil',
      variableId: null,
    });
    expect(program.networks[0].coil?.variableId).toBeNull();
  });

  it('触点移动和删除保持 ID、绑定与剩余串联顺序', () => {
    let program = createWorkspace(experiments[0]);
    const networkId = program.networks[0].id;
    program = editProgram(program, {
      type: 'addContact',
      networkId,
      contact: contact('a', 'input:I-00'),
    });
    program = editProgram(program, {
      type: 'addContact',
      networkId,
      contact: contact('b', 'internal:0'),
    });
    program = editProgram(program, {
      type: 'moveContact',
      networkId,
      instructionId: 'b',
      direction: -1,
    });
    expect(program.networks[0].contacts.map((item) => item.id)).toEqual(['b', 'a']);
    expect(program.networks[0].contacts[0].variableId).toBe('internal:0');
    program = editProgram(program, { type: 'deleteInstruction', networkId, instructionId: 'b' });
    expect(program.networks[0].contacts).toEqual([contact('a', 'input:I-00')]);
    expect(
      editProgram(program, { type: 'moveContact', networkId, instructionId: 'a', direction: -1 })
        .networks[0].contacts,
    ).toEqual(program.networks[0].contacts);
  });

  it('网络命名、移动和删除保持其它网络，至少保留一个网络', () => {
    let program = createWorkspace(experiments[0]);
    const firstId = program.networks[0].id;
    program = editProgram(program, { type: 'renameNetwork', networkId: firstId, name: '原有网络' });
    program = editProgram(program, { type: 'addNetwork', network: createNetwork('second') });
    program = editProgram(program, { type: 'moveNetwork', networkId: 'second', direction: -1 });
    expect(program.networks.map((item) => item.id)).toEqual(['second', firstId]);
    program = editProgram(program, { type: 'deleteNetwork', networkId: 'second' });
    expect(program.networks[0].name).toBe('原有网络');
    expect(editProgram(program, { type: 'deleteNetwork', networkId: firstId })).toBe(program);
    expect(
      editProgram(program, { type: 'addCoil', networkId: 'missing', instructionId: 'coil' }),
    ).toBe(program);
  });
});
