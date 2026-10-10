import { expect, it } from 'vitest';
import { createWorkspace } from '../editor/model';
import { experiments } from '../data/experiments';
import { parseProgram, loadProjects, saveProjects, STORAGE_KEY } from './projects';
it('不完整编辑草稿可以跨平台往返', () => {
  const p = createWorkspace(experiments[0]);
  expect(parseProgram(JSON.stringify(p))).toEqual(p);
});
it('拒绝损坏结构、未知版本、篡改端子和重复标识', () => {
  const p = createWorkspace(experiments[0]);
  for (const bad of [
    { ...p, schemaVersion: 2 },
    { ...p, networks: [null] },
    { ...p, variables: [] },
    { ...p, variables: [...p.variables, p.variables[0]] },
  ])
    expect(() => parseProgram(JSON.stringify(bad))).toThrow();
});
it('损坏本地数据保留原文，空间不足给出导出提示', () => {
  localStorage.setItem(STORAGE_KEY, '{broken');
  const result = loadProjects(localStorage);
  expect(result.recovery).toBe('{broken');
  expect(localStorage.getItem(STORAGE_KEY)).toBe('{broken');
  expect(
    saveProjects(
      {
        setItem() {
          throw Error();
        },
      },
      {},
    ),
  ).toContain('导出 JSON');
});
it('多实验草稿恢复并互相隔离', () => {
  const programs = Object.fromEntries(
    experiments.slice(0, 2).map((e) => [e.id, createWorkspace(e)]),
  );
  saveProjects(localStorage, programs);
  expect(loadProjects(localStorage).programs).toEqual(programs);
});
