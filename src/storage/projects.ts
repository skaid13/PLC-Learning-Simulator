import type {
  ProgramWorkspace,
  BoolVariable,
  LadderNetwork,
  LadderInstruction,
  ContactInstruction,
  CoilInstruction,
} from '../types';
import { experiments } from '../data/experiments';
import { createWorkspace } from '../editor/model';
import { operations } from '../editor/validation';
export const STORAGE_KEY = 'plc-learning-projects-v1';
export const MAX_FILE_BYTES = 1024 * 1024;
export type Projects = Record<string, ProgramWorkspace>;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length <= max;
const finite = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1000000;
function instruction(v: unknown, kind: 'coil' | 'contact'): v is LadderInstruction {
  if (!object(v) || !str(v.id) || v.kind !== kind || !(v.variableId === null || str(v.variableId)))
    return false;
  if (kind === 'contact')
    return (
      ['normallyOpen', 'normallyClosed'].includes(String(v.contactType)) &&
      (v.edge === undefined || v.edge === 'rising') &&
      (v.comparison === undefined ||
        (object(v.comparison) &&
          ['eq', 'ne', 'gt', 'ge', 'lt', 'le'].includes(String(v.comparison.operator)) &&
          finite(v.comparison.value)))
    );
  return (
    (v.operation === undefined || (operations as readonly unknown[]).includes(v.operation)) &&
    (v.preset === undefined || finite(v.preset)) &&
    (v.sourceVariableId === undefined || str(v.sourceVariableId)) &&
    (v.countVariableId === undefined || str(v.countVariableId))
  );
}
const cleanContact = (c: ContactInstruction): ContactInstruction => ({
  id: c.id,
  kind: 'contact',
  variableId: c.variableId,
  contactType: c.contactType,
  edge: c.edge,
  comparison: c.comparison
    ? { operator: c.comparison.operator, value: c.comparison.value }
    : undefined,
});
const cleanCoil = (c: CoilInstruction): CoilInstruction => ({
  id: c.id,
  kind: 'coil',
  variableId: c.variableId,
  operation: c.operation,
  preset: c.preset,
  sourceVariableId: c.sourceVariableId,
  countVariableId: c.countVariableId,
});
export function parseProgram(text: string): ProgramWorkspace {
  if (new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw Error('文件超过 1 MB 限制。');
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    throw Error('文件不是有效 JSON。');
  }
  if (
    !object(v) ||
    v.schemaVersion !== 1 ||
    !str(v.id) ||
    !str(v.name) ||
    !str(v.experimentId) ||
    !Array.isArray(v.variables) ||
    !Array.isArray(v.networks) ||
    v.variables.length > 500 ||
    !v.networks.length ||
    v.networks.length > 500
  )
    throw Error('程序格式或版本不受支持。');
  const experiment = experiments.find((e) => e.id === v.experimentId);
  if (!experiment) throw Error('实验编号不存在。');
  if (
    !v.variables.every(
      (x: unknown) =>
        object(x) &&
        str(x.id) &&
        str(x.name) &&
        str(x.description, 1000) &&
        ['input', 'output', 'internal'].includes(String(x.kind)) &&
        (x.terminal === undefined || str(x.terminal)) &&
        (x.dataType === undefined || ['boolean', 'number'].includes(String(x.dataType))) &&
        (x.initialValue === undefined || finite(x.initialValue)),
    )
  )
    throw Error('变量定义不完整。');
  if (
    !v.networks.every(
      (x: unknown) =>
        object(x) &&
        str(x.id) &&
        str(x.name) &&
        x.topology === 'series' &&
        Array.isArray(x.contacts) &&
        x.contacts.length <= 4 &&
        x.contacts.every((c) => instruction(c, 'contact')) &&
        (x.coil === null || instruction(x.coil, 'coil')) &&
        (x.branches === undefined ||
          (Array.isArray(x.branches) &&
            x.branches.length <= 7 &&
            x.branches.every(
              (b) => Array.isArray(b) && b.length <= 4 && b.every((c) => instruction(c, 'contact')),
            ))),
    )
  )
    throw Error('网络或元件数据不完整。');
  const variables = v.variables as BoolVariable[];
  const expected = createWorkspace(experiment).variables.filter((x) => x.terminal);
  if (
    expected.some(
      (x) =>
        !variables.some(
          (y) =>
            y.id === x.id &&
            y.kind === x.kind &&
            y.terminal === x.terminal &&
            y.dataType !== 'number',
        ),
    ) ||
    variables.filter((x) => x.terminal).length !== expected.length ||
    variables.filter((x) => x.kind !== 'internal').length !== expected.length
  )
    throw Error('端子与指导书 I/O 表不匹配。');
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  const networks = v.networks as LadderNetwork[];
  if (
    !unique(variables.map((x) => x.id)) ||
    !unique(networks.map((x) => x.id)) ||
    !unique(
      networks.flatMap((n) =>
        [...n.contacts, ...(n.branches ?? []).flat(), ...(n.coil ? [n.coil] : [])].map((i) => i.id),
      ),
    )
  )
    throw Error('变量、网络或元件标识重复。');
  // 复制白名单形状；不合并未知属性或外来对象原型。允许未绑定的可编辑草稿。
  return {
    schemaVersion: 1,
    id: v.id,
    name: v.name,
    experimentId: v.experimentId,
    variables: variables.map((x) => ({
      id: x.id,
      name: x.name,
      description: x.description,
      kind: x.kind,
      terminal: x.terminal,
      dataType: x.dataType,
      initialValue: x.initialValue,
    })),
    networks: networks.map((n) => ({
      id: n.id,
      name: n.name,
      topology: 'series',
      contacts: n.contacts.map(cleanContact),
      branches: n.branches?.map((b) => b.map(cleanContact)),
      coil: n.coil ? cleanCoil(n.coil) : null,
    })),
  };
}
export function loadProjects(storage: Pick<Storage, 'getItem'>): {
  programs: Projects;
  message: string;
  recovery?: string;
} {
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { programs: {}, message: '尚无本地草稿；编辑后自动保存。' };
    const data: unknown = JSON.parse(raw);
    if (
      !object(data) ||
      data.version !== 1 ||
      !Array.isArray(data.programs) ||
      data.programs.length > 11
    )
      throw Error();
    const programs: Projects = {};
    for (const item of data.programs) {
      const p = parseProgram(JSON.stringify(item));
      if (programs[p.experimentId]) throw Error();
      programs[p.experimentId] = p;
    }
    return { programs, message: '已恢复本地草稿。' };
  } catch {
    return {
      programs: {},
      message: '本地草稿无法读取，原数据已保留。可先下载原始数据再编辑。',
      recovery: raw ?? undefined,
    };
  }
}
export function saveProjects(storage: Pick<Storage, 'setItem'>, programs: Projects): string {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, programs: Object.values(programs) }));
    return '已保存到此浏览器 · ' + new Date().toLocaleTimeString();
  } catch {
    return '本地保存失败（空间不足或浏览器限制）。请导出 JSON 保存程序。';
  }
}
export function downloadText(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
