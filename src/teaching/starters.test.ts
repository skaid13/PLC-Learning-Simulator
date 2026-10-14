import { expect, it } from 'vitest';
import { starterExperiments, createStarterReference } from '../data/starters';
import { allExperiments } from '../data/catalog';
import { createRuntime, runtimeReducer, type RuntimeState } from '../engine/runtime';
import { createGuide } from './guide';
import { loadProjects, saveProjects, parseProgram } from '../storage/projects';

const input = (r: RuntimeState, id: string, value: boolean) =>
  runtimeReducer(r, { type: 'input', program: r.program, variableId: `input:I-${id}`, value });
const scan = (r: RuntimeState) => runtimeReducer(r, { type: 'step', program: r.program });

it('停止小项目满足四组输入真值表，正确结构才通过运行引导', () => {
  const program = createStarterReference(starterExperiments[1]);
  for (const [start, stop, expected] of [
    [false, false, false],
    [true, false, true],
    [true, true, false],
    [false, true, false],
  ]) {
    let r = input(input(createRuntime(program), '00', start), '01', stop);
    r = scan(r);
    expect(r.scan.values['output:O-00']).toBe(expected);
  }
  let r = input(input(createRuntime(program), '00', true), '01', true);
  const baseline = r.scan;
  r = scan(r);
  const step = createGuide(program.experimentId).find((s) => s.id === 'stop-scan-off')!;
  const context = {
    program,
    runtime: r,
    baseline,
    editor: { tool: 'select' as const, selection: null },
  };
  expect(step.verify(context)).toBeNull();
  expect(step.verify({ ...context, baseline: r.scan })).not.toBeNull();
  const bad = structuredClone(program);
  bad.networks[0].contacts[1].contactType = 'normallyOpen';
  expect(step.verify({ ...context, program: bad })).not.toBeNull();
});

it('延时项目提前断开清零，重新接通需完整两秒，拒绝旧扫描和错误预置值', () => {
  const program = createStarterReference(starterExperiments[2]);
  let r = input(createRuntime(program), '00', true);
  for (let i = 0; i < 5; i++) r = scan(r);
  expect(r.scan.values['output:O-00']).toBe(false);
  r = scan(input(r, '00', false));
  expect(r.scan.memory?.['output:O-00'].elapsed).toBe(0);
  r = input(r, '00', true);
  const baseline = r.scan;
  for (let i = 0; i < 9; i++) r = scan(r);
  expect(r.scan.values['output:O-00']).toBe(false);
  r = scan(r);
  const step = createGuide(program.experimentId).find((s) => s.id === 'delay-finish')!;
  const context = {
    program,
    runtime: r,
    baseline,
    editor: { tool: 'select' as const, selection: null },
  };
  expect(step.verify(context)).toBeNull();
  expect(step.verify({ ...context, baseline: r.scan })).not.toBeNull();
  const bad = structuredClone(program);
  bad.networks[0].coil!.preset = 1000;
  expect(step.verify({ ...context, program: bad })).not.toBeNull();
  r = scan(input(r, '00', false));
  expect(r.scan.values['output:O-00']).toBe(false);
});

it('三个新项目 JSON 往返和全部十四项草稿保存恢复，不改变旧程序格式', () => {
  const programs = Object.fromEntries(allExperiments.map((e) => [e.id, createStarterReference(e)]));
  for (const e of starterExperiments)
    expect(parseProgram(JSON.stringify(programs[e.id]))).toEqual(programs[e.id]);
  saveProjects(localStorage, programs);
  const loaded = loadProjects(localStorage);
  expect(loaded.recovery).toBeUndefined();
  expect(Object.keys(loaded.programs)).toHaveLength(14);
});
