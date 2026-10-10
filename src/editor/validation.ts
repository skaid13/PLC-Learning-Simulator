import type { LadderInstruction, ProgramWorkspace } from '../types';
import { MAX_CONTACTS, instructionNames } from './model';
export interface ProgramIssue {
  code: string;
  severity: 'error' | 'warning';
  networkId: string | null;
  instructionId: string | null;
  message: string;
}
export const operations = [
  'coil',
  'set',
  'reset',
  'ton',
  'tof',
  'pulse',
  'ctu',
  'resetCounter',
  'move',
  'add',
] as const;
export const operationNames = {
  coil: '输出线圈',
  set: '置位 SET',
  reset: '复位 RESET',
  ton: '接通延时 TON',
  tof: '断开延时 TOF',
  pulse: '周期脉冲',
  ctu: '上升沿计数 CTU',
  resetCounter: '计数复位',
  move: '数值赋值 MOV',
  add: '数值加减 ADD',
};
export function validateProgram(program: ProgramWorkspace): ProgramIssue[] {
  const issues: ProgramIssue[] = [],
    ids = new Set<string>(),
    writers = new Map<string, string>();
  const globalIssue = (code: string, message: string) =>
    issues.push({ code, message, severity: 'error', networkId: null, instructionId: null });
  if (program.schemaVersion !== 1) globalIssue('schema', '当前不支持该程序数据版本。');
  if (!program.networks.length) globalIssue('no-networks', '程序至少需要一个网络。');
  program.variables.forEach((v) => {
    if (
      ids.has(v.id) ||
      !['input', 'output', 'internal'].includes(v.kind) ||
      (v.dataType && !['boolean', 'number'].includes(v.dataType)) ||
      (v.dataType === 'number' &&
        (v.kind !== 'internal' ||
          !Number.isFinite(v.initialValue ?? 0) ||
          Math.abs(v.initialValue ?? 0) > 1000000))
    )
      globalIssue('variable-definition', '变量定义重复、类型无效或数值初始值无效。');
    ids.add(v.id);
  });
  const counters = new Set<string>();
  const networkIds = new Set<string>(),
    instructionIds = new Set<string>();
  program.networks.forEach((network, index) => {
    const issue = (
      code: string,
      text: string,
      instructionId: string | null = null,
      severity: 'error' | 'warning' = 'error',
    ) =>
      issues.push({
        code,
        severity,
        networkId: network.id,
        instructionId,
        message: `网络 ${index + 1}：${text}`,
      });
    if (networkIds.has(network.id)) issue('network-id', '网络标识重复。');
    networkIds.add(network.id);
    if (network.topology !== 'series')
      issue('topology', '未知拓扑；请使用串联支路及显式并联分支。');
    const branches = [network.contacts, ...(network.branches ?? [])];
    if (branches.length > 8) issue('branches', '最多支持 8 条并联支路。');
    if (!network.coil) issue('missing-coil', '尚未放置末端线圈。');
    branches.forEach((branch) => {
      if (branch.length > MAX_CONTACTS)
        issue('too-many-contacts', `每支路最多 ${MAX_CONTACTS} 个触点。`);
      if (!branch.length)
        issue('no-contacts', '支路没有触点，将无条件导通，请确认。', null, 'warning');
    });
    const check = (instruction: LadderInstruction, kind: 'contact' | 'coil') => {
      if (instruction.kind !== kind) {
        issue('instruction-kind', '未知指令或指令位置错误。', instruction.id);
        return;
      }
      if (instructionIds.has(instruction.id))
        issue('instruction-id', '元件标识重复。', instruction.id);
      instructionIds.add(instruction.id);
      if (!instruction.variableId) {
        issue(
          'unbound',
          `${kind === 'coil' ? '输出线圈' : instructionNames[instruction.kind === 'contact' ? instruction.contactType : 'coil']}未选择变量。`,
          instruction.id,
        );
        return;
      }
      const variable = program.variables.find((v) => v.id === instruction.variableId);
      if (!variable) {
        issue('unknown-variable', '引用的变量不存在，请重新选择变量。', instruction.id);
        return;
      }
      if (instruction.kind === 'contact') {
        if (!['normallyOpen', 'normallyClosed'].includes(instruction.contactType))
          issue('contact-type', '存在尚未支持的触点类型。', instruction.id);
        if (instruction.edge && instruction.edge !== 'rising')
          issue('edge', '未知边沿类型。', instruction.id);
        if (instruction.comparison) {
          if (
            variable.dataType !== 'number' ||
            !['eq', 'ne', 'gt', 'ge', 'lt', 'le'].includes(instruction.comparison.operator) ||
            !Number.isFinite(instruction.comparison.value)
          )
            issue('comparison', '比较触点需要数值变量、有效比较符及有限数值。', instruction.id);
        } else if (variable.dataType === 'number')
          issue('contact-value', '数值变量请使用比较触点。', instruction.id);
      } else {
        const op = instruction.operation ?? 'coil';
        if (!(operations as readonly string[]).includes(op))
          issue('operation', '未知末端指令。', instruction.id);
        if (variable.kind === 'input')
          issue('input-coil', '输入变量不能作为输出线圈的目标。', instruction.id);
        if (['move', 'add'].includes(op) !== (variable.dataType === 'number'))
          issue('target-type', '末端指令与目标变量类型不匹配。', instruction.id);
        if (
          ['ton', 'tof', 'pulse', 'ctu'].includes(op) &&
          (!Number.isFinite(instruction.preset ?? (op === 'ctu' ? 1 : 1000)) ||
            (instruction.preset ?? 1) <= 0 ||
            (op === 'pulse' && (instruction.preset ?? 1000) < 400))
        )
          issue('preset', '预置值必须为正数；周期脉冲至少 400 ms。', instruction.id);
        if (
          ['move', 'add'].includes(op) &&
          !instruction.sourceVariableId &&
          !Number.isFinite(instruction.preset ?? 0)
        )
          issue('operand', '运算常数无效。', instruction.id);
        for (const id of [instruction.sourceVariableId, instruction.countVariableId].filter(
          Boolean,
        ))
          if (!program.variables.some((v) => v.id === id && v.dataType === 'number'))
            issue('numeric-variable', '数值来源/计数值变量不存在或类型错误。', instruction.id);
        if (op === 'ctu') {
          if (counters.has(variable.id))
            issue('counter-owner', '每个计数器完成变量只能绑定一个 CTU。', instruction.id);
          counters.add(variable.id);
          if (!Number.isInteger(instruction.preset ?? 1))
            issue('counter-preset', '计数预置值必须为正整数。', instruction.id);
        }
        if (instruction.sourceVariableId && !['move', 'add'].includes(op))
          issue('source-operation', '只有 MOV/ADD 支持数值来源。', instruction.id);
        if (instruction.countVariableId && !['ctu', 'resetCounter'].includes(op))
          issue('count-operation', '只有 CTU/计数复位支持计数显示变量。', instruction.id);
        const previous = writers.get(variable.id);
        if (
          previous &&
          !(['set', 'reset'].includes(previous) && ['set', 'reset'].includes(op)) &&
          !(['move', 'add'].includes(previous) && ['move', 'add'].includes(op)) &&
          !(['ctu', 'resetCounter'].includes(previous) && ['ctu', 'resetCounter'].includes(op))
        )
          issue(
            'duplicate-coil',
            `${variable.name} 被多个线圈使用，请为输出指定唯一来源。`,
            instruction.id,
          );
        writers.set(variable.id, op);
      }
    };
    branches.flat().forEach((c) => check(c, 'contact'));
    if (network.coil) check(network.coil, 'coil');
  });
  return issues;
}
