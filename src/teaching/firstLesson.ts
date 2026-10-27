import type { ProgramWorkspace } from '../types';
import { createStarterReference, starterExperiments } from '../data/starters';
import { parseProgram } from '../storage/projects';
import { validateProgram } from '../editor/validation';
import type { RuntimeState } from '../engine/runtime';
export const FIRST_LESSON_KEY = 'plc-learning:first-lesson:v1';
export const learningPhases = [
  '认识对象',
  '观察示例',
  '读懂线路',
  '观察常闭',
  '编程准备',
  '变化任务',
];
export type LessonProgress = {
  version: 1;
  phase: number;
  unlocked: number;
  finished?: boolean;
  programs: Record<string, ProgramWorkspace>;
};
export function phaseProgram(phase: number): ProgramWorkspace {
  const program = createStarterReference(starterExperiments[0]);
  program.name = `第一课 · ${learningPhases[phase]}`;
  if (phase === 3) program.networks[0].contacts[0].contactType = 'normallyClosed';
  return program;
}
export function loadFirstLesson(storage: Pick<Storage, 'getItem'>): {
  progress: LessonProgress;
  recovery?: string;
  warning?: string;
} {
  const initial: LessonProgress = { version: 1, phase: 0, unlocked: 0, programs: {} };
  let raw: string | null = null;
  try {
    raw = storage.getItem(FIRST_LESSON_KEY);
    if (!raw) return { progress: initial };
    const saved = JSON.parse(raw);
    if (
      saved.version !== 1 ||
      !Number.isInteger(saved.phase) ||
      !Number.isInteger(saved.unlocked) ||
      saved.phase < 0 ||
      saved.phase > saved.unlocked ||
      saved.unlocked > 5 ||
      (saved.finished !== undefined && typeof saved.finished !== 'boolean') ||
      !saved.programs ||
      typeof saved.programs !== 'object' ||
      Array.isArray(saved.programs)
    )
      throw Error();
    const programs: LessonProgress['programs'] = {};
    for (const [key, value] of Object.entries(saved.programs)) {
      if (!/^[1-5]$/.test(key)) throw Error();
      const p = parseProgram(JSON.stringify(value));
      if (p.experimentId !== 'starter-lamp') throw Error();
      programs[key] = p;
    }
    return {
      progress: {
        version: 1,
        phase: saved.phase,
        unlocked: saved.unlocked,
        finished: saved.finished === true,
        programs,
      },
    };
  } catch {
    return {
      progress: initial,
      recovery: raw ?? undefined,
      warning: '教学记录暂时无法读取。原实验草稿保留；可先导出原始记录，再决定是否重新保存。',
    };
  }
}
export function lampProblem(program: ProgramWorkspace, closed = false): string | null {
  const errors = validateProgram(program).filter((i) => i.severity === 'error');
  if (errors.length) return errors[0].message;
  const network = program.networks[0];
  if (program.networks.length !== 1 || network.contacts.length !== 1 || network.branches?.length)
    return '本课只需要一个网络、一条支路、一个触点和一个普通线圈。先移除多余元件或支路。';
  const contact = network.contacts[0];
  if (
    contact.contactType !== (closed ? 'normallyClosed' : 'normallyOpen') ||
    contact.comparison ||
    contact.edge
  )
    return closed
      ? '变化任务要求常闭触点：输入FALSE时条件成立。请选择常闭，关闭比较和边沿。'
      : '本阶段要求普通常开触点，关闭比较和边沿检测。';
  if (contact.variableId !== 'input:I-00')
    return '触点要读取亮灯按钮SIM_IN_00，请在元件变量选择输入。';
  if (
    !network.coil ||
    network.coil.variableId !== 'output:O-00' ||
    (network.coil.operation ?? 'coil') !== 'coil'
  )
    return '末端需要普通输出线圈，绑定指示灯SIM_OUT_00。';
  return null;
}
export function verifiedCase(
  program: ProgramWorkspace,
  runtime: RuntimeState,
  closed: boolean,
): 'on' | 'off' | null {
  if (
    runtime.program !== program ||
    runtime.status === 'error' ||
    !runtime.scan.scanCount ||
    lampProblem(program, closed)
  )
    return null;
  const input = runtime.scan.values['input:I-00'] === true;
  const output = runtime.scan.values['output:O-00'] === true;
  if (output !== (closed ? !input : input)) return null;
  return input ? 'on' : 'off';
}
