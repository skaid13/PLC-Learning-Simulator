import type { LadderInstruction, ProgramWorkspace } from '../types';
import { MAX_CONTACTS, instructionNames } from './model';

export interface ProgramIssue {
  code: string;
  severity: 'error' | 'warning';
  networkId: string | null;
  instructionId: string | null;
  message: string;
}

/** 只检查结构和变量引用，不能判断控制目标是否实现，更不执行程序。 */
export function validateProgram(program: ProgramWorkspace): ProgramIssue[] {
  const issues: ProgramIssue[] = [];
  const writers = new Set<string>();
  if (program.schemaVersion !== 1)
    issues.push({
      code: 'schema',
      severity: 'error',
      networkId: null,
      instructionId: null,
      message: '当前编辑器不支持该程序数据版本。',
    });
  if (!program.networks.length)
    issues.push({
      code: 'no-networks',
      severity: 'error',
      networkId: null,
      instructionId: null,
      message: '程序至少需要一个网络。',
    });
  program.networks.forEach((network, index) => {
    const issue = (
      code: string,
      message: string,
      instructionId: string | null = null,
      severity: 'error' | 'warning' = 'error',
    ) =>
      issues.push({
        code,
        severity,
        networkId: network.id,
        instructionId,
        message: `网络 ${index + 1}：${message}`,
      });
    if (network.topology !== 'series') issue('topology', '当前仅支持串联网络；并联分支尚未开放。');
    if (network.contacts.length > MAX_CONTACTS)
      issue('too-many-contacts', `当前每网络最多支持 ${MAX_CONTACTS} 个串联触点。`);
    if (!network.coil) issue('missing-coil', '尚未放置末端线圈。');
    if (!network.contacts.length)
      issue('no-contacts', '没有触点，请确认是否需要控制条件。', null, 'warning');
    const checkVariable = (instruction: LadderInstruction) => {
      const name =
        instruction.kind === 'coil' ? '输出线圈' : instructionNames[instruction.contactType];
      if (
        instruction.kind === 'contact' &&
        !['normallyOpen', 'normallyClosed'].includes(instruction.contactType)
      )
        issue('contact-type', '存在尚未支持的触点类型。', instruction.id);
      if (!instruction.variableId) {
        issue('unbound', `${name ?? '元件'}未选择变量。`, instruction.id);
        return;
      }
      const variable = program.variables.find((item) => item.id === instruction.variableId);
      if (!variable) {
        issue('unknown-variable', '引用的变量不存在，请重新选择变量。', instruction.id);
        return;
      }
      if (instruction.kind === 'coil') {
        if (variable.kind === 'input')
          issue('input-coil', '输入变量不能作为输出线圈的目标。', instruction.id);
        if (writers.has(variable.id))
          issue(
            'duplicate-coil',
            `${variable.name} 被多个线圈使用，请为输出指定唯一来源。`,
            instruction.id,
          );
        writers.add(variable.id);
      }
    };
    network.contacts.forEach(checkVariable);
    if (network.coil) checkVariable(network.coil);
  });
  return issues;
}
