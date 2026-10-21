import { it, expect } from 'vitest';
import { createLearningBackup, parseLearningBackup, restoreLearningBackup } from './learningBackup';
import { FIRST_LESSON_KEY, phaseProgram } from '../teaching/firstLesson';
import { STORAGE_KEY } from './projects';
it('迁移包含独立课程程序与全部实验，排除非项目存储，不改原值', () => {
  localStorage.setItem('unrelated-secret', 'never export');
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, programs: [phaseProgram(1)] }));
  localStorage.setItem(
    FIRST_LESSON_KEY,
    JSON.stringify({ version: 1, phase: 2, unlocked: 2, programs: { 2: phaseProgram(2) } }),
  );
  const backup = createLearningBackup(localStorage);
  expect(Object.keys(backup.records)).toHaveLength(2);
  expect(JSON.stringify(backup)).not.toContain('unrelated-secret');
  expect(parseLearningBackup(JSON.stringify(backup))).toEqual(backup);
  const original = localStorage.getItem(FIRST_LESSON_KEY);
  restoreLearningBackup(localStorage, backup);
  expect(localStorage.getItem(FIRST_LESSON_KEY)).toBe(original);
  expect(localStorage.getItem('unrelated-secret')).toBe('never export');
});
it('拒绝未知键、损坏草稿和不支持的格式，写入前完成所有校验', () => {
  const backup = createLearningBackup(localStorage);
  for (const records of [
    { token: 'secret' },
    { [STORAGE_KEY]: 'broken' },
    { [FIRST_LESSON_KEY]: '{}' },
    { 'plc-learning:guide:auto': 'javascript' },
  ])
    expect(() => parseLearningBackup(JSON.stringify({ ...backup, records }))).toThrow();
  expect(() => parseLearningBackup('{}')).toThrow(/全部学习数据/);
  expect(() => parseLearningBackup('{bad')).toThrow(/有效JSON/);
});
it('中途写入失败回滚已写记录，未包含的记录保留', () => {
  const records = new Map([
    ['plc-learning:guide:auto', 'true'],
    ['plc-learning:foundation:v1', JSON.stringify({ chapter: 'scan', read: [] })],
  ]);
  let failed = false;
  const storage = {
    getItem: (k: string) => records.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (k === 'plc-learning:foundation:v1' && !failed) {
        failed = true;
        throw Error('quota');
      }
      records.set(k, v);
    },
    removeItem: (k: string) => {
      records.delete(k);
    },
  };
  const before = new Map(records);
  expect(() =>
    restoreLearningBackup(storage, {
      format: 'plc-learning-backup',
      version: 1,
      createdAt: new Date().toISOString(),
      records: {
        'plc-learning:guide:auto': 'false',
        'plc-learning:foundation:v1': JSON.stringify({ chapter: 'variables', read: ['scan'] }),
      },
    }),
  ).toThrow(/已恢复原数据/);
  expect(records).toEqual(before);
});
