import { expect, it } from 'vitest';
import { experiments } from '../data/experiments';
import { createRuntime, runtimeReducer } from '../engine/runtime';
import { createWorkspace } from '../editor/model';
import { courses } from './courses';
import { createGuide, miniSpecs, type GuideContext } from './guide';

it.each(Object.keys(courses))('%s 课程包含完整输入状态、具体流程、故障和可操作变式', (id) => {
  const experiment = experiments.find((e) => e.id === id)!;
  const c = courses[id];
  expect(Object.keys(c.inputMeaning).sort()).toEqual(
    experiment.inputs.map((v) => v.terminal).sort(),
  );
  expect(c.prerequisites.length).toBeGreaterThanOrEqual(3);
  expect(c.build.length).toBeGreaterThanOrEqual(4);
  expect(c.troubleshooting.length).toBeGreaterThanOrEqual(2);
  expect(c.challenge.criteria.length).toBeGreaterThanOrEqual(2);
});

it.each(Object.keys(miniSpecs))('%s 基础引导用实际扫描验证输入通断，拒绝旧扫描与错误结构', (id) => {
  const experiment = experiments.find((e) => e.id === id)!;
  const spec = miniSpecs[id],
    program = createWorkspace(experiment);
  const input = `input:I-${spec.input}`,
    output = `output:O-${spec.output}`;
  program.networks[0].contacts = [
    { id: 'c', kind: 'contact', contactType: 'normallyOpen', variableId: input },
  ];
  program.networks[0].coil = { id: 'o', kind: 'coil', variableId: output };
  let runtime = createRuntime(program);
  if (spec.sensor) runtime = { ...runtime, autoSensors: false };
  const baseline = runtime.scan;
  runtime = runtimeReducer(runtime, { type: 'input', program, variableId: input, value: true });
  const context: GuideContext = {
    program,
    runtime,
    editor: { tool: 'select', selection: null },
    baseline,
  };
  const guide = createGuide(id),
    on = guide.find((s) => s.id === 'scan-on')!,
    off = guide.find((s) => s.id === 'scan-off')!;
  expect(on.verify(context)).not.toBeNull();
  runtime = runtimeReducer(runtime, { type: 'step', program });
  expect(on.verify({ ...context, runtime })).toBeNull();
  expect(on.verify({ ...context, runtime, baseline: runtime.scan })).not.toBeNull();
  const afterOn = runtime.scan;
  runtime = runtimeReducer(runtime, { type: 'input', program, variableId: input, value: false });
  expect(off.verify({ ...context, runtime, baseline: afterOn })).not.toBeNull();
  runtime = runtimeReducer(runtime, { type: 'step', program });
  expect(off.verify({ ...context, runtime, baseline: afterOn })).toBeNull();
  const bad = structuredClone(program);
  bad.networks[0].branches = [[]];
  expect(off.verify({ ...context, program: bad, runtime, baseline: afterOn })).not.toBeNull();
});
