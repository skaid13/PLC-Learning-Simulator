import { describe, expect, it } from 'vitest';
import { experiments } from '../data/experiments';
import { createNetwork, createWorkspace } from './model';
import { validateProgram } from './validation';
import type { LadderNetwork, ProgramWorkspace } from '../types';

function complete() {
  const program = createWorkspace(experiments[0]);
  program.networks[0].contacts.push({
    id: 'contact',
    kind: 'contact',
    contactType: 'normallyOpen',
    variableId: 'input:I-00',
  });
  program.networks[0].coil = { id: 'coil', kind: 'coil', variableId: 'output:O-00' };
  return program;
}

describe('结构检查（不执行逻辑）', () => {
  it('完整串联结构通过，空网络和未绑定元件给出可定位信息', () => {
    expect(validateProgram(complete())).toEqual([]);
    const program = createWorkspace(experiments[0]);
    expect(validateProgram(program).map((item) => item.code)).toEqual([
      'missing-coil',
      'no-contacts',
    ]);
    program.networks[0].contacts.push({
      id: 'unbound',
      kind: 'contact',
      contactType: 'normallyOpen',
      variableId: null,
    });
    expect(validateProgram(program)).toContainEqual(
      expect.objectContaining({
        code: 'unbound',
        networkId: program.networks[0].id,
        instructionId: 'unbound',
        severity: 'error',
      }),
    );
  });

  it('报告失效引用及输入线圈，不能误报结构通过', () => {
    const program = complete();
    program.networks[0].contacts[0].variableId = 'does-not-exist';
    program.networks[0].coil!.variableId = 'input:I-00';
    expect(validateProgram(program).map((item) => item.code)).toEqual([
      'unknown-variable',
      'input-coil',
    ]);
  });

  it('同一个输出由多个网络写入时定位后一个线圈', () => {
    const program = complete();
    const second = createNetwork('second');
    second.contacts = [{ ...program.networks[0].contacts[0], id: 'c2' }];
    second.coil = { ...program.networks[0].coil!, id: 'coil2' };
    program.networks.push(second);
    expect(validateProgram(program)).toEqual([
      expect.objectContaining({
        code: 'duplicate-coil',
        networkId: 'second',
        instructionId: 'coil2',
      }),
    ]);
  });

  it('不接受尚未支持的并联拓扑、触点类型或数据版本', () => {
    const program = complete();
    program.schemaVersion = 2 as ProgramWorkspace['schemaVersion'];
    program.networks[0].topology = 'parallel' as LadderNetwork['topology'];
    program.networks[0].contacts[0].contactType = 'timer' as never;
    expect(validateProgram(program).map((item) => item.code)).toEqual([
      'schema',
      'topology',
      'contact-type',
    ]);
  });
});
