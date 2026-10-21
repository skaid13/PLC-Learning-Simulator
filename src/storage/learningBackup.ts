import { allExperiments } from '../data/catalog';
import { loadProjects, STORAGE_KEY } from './projects';
import { FIRST_LESSON_KEY, loadFirstLesson } from '../teaching/firstLesson';

const keys = new Set([
  STORAGE_KEY,
  FIRST_LESSON_KEY,
  'plc-learning:foundation:v1',
  'plc-learning:guide:auto',
  ...allExperiments.flatMap((e) =>
    ['guide', 'lesson', 'recipe'].map((kind) => `plc-learning:${kind}:v1:${e.id}`),
  ),
]);
export const MAX_BACKUP_BYTES = 16 * 1024 * 1024;
export type LearningBackup = {
  format: 'plc-learning-backup';
  version: 1;
  createdAt: string;
  records: Record<string, string>;
};
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function createLearningBackup(storage: Pick<Storage, 'getItem'>): LearningBackup {
  const records: Record<string, string> = {};
  for (const key of keys) {
    const value = storage.getItem(key);
    if (value !== null) records[key] = value;
  }
  return {
    format: 'plc-learning-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    records,
  };
}
function validateRecord(key: string, raw: string) {
  if (key === STORAGE_KEY) {
    if (loadProjects({ getItem: () => raw }).recovery) throw Error('实验草稿内容无法识别。');
    return;
  }
  if (key === FIRST_LESSON_KEY) {
    if (loadFirstLesson({ getItem: () => raw }).recovery) throw Error('第一课记录内容无法识别。');
    return;
  }
  if (key === 'plc-learning:guide:auto') {
    if (!['true', 'false'].includes(raw)) throw Error('引导设置无效。');
    return;
  }
  const v = JSON.parse(raw);
  if (key.includes(':recipe:')) {
    if (!Number.isInteger(v) || v < 0 || v > 10000) throw Error('搭建位置无效。');
    return;
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw Error('学习记录格式无效。');
  if (key === 'plc-learning:foundation:v1') {
    if (
      typeof v.chapter !== 'string' ||
      !Array.isArray(v.read) ||
      !v.read.every((s: unknown) => typeof s === 'string')
    )
      throw Error('基础课堂记录无效。');
  } else if (key.includes(':lesson:')) {
    if (
      !Number.isInteger(v.chapter) ||
      v.chapter < 0 ||
      v.chapter > 5 ||
      !Array.isArray(v.read) ||
      !v.read.every((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= 5)
    )
      throw Error('章节记录无效。');
  } else if (
    !Number.isInteger(v.index) ||
    v.index < 0 ||
    v.index > 10000 ||
    typeof v.active !== 'boolean' ||
    !Array.isArray(v.skipped) ||
    !Array.isArray(v.completed) ||
    ![...v.skipped, ...v.completed].every((s: unknown) => typeof s === 'string')
  )
    throw Error('引导记录无效。');
}
export function parseLearningBackup(text: string): LearningBackup {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw Error('备份超过16MB限制。');
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw Error('文件不是有效JSON。');
  }
  if (
    !value ||
    value.format !== 'plc-learning-backup' ||
    value.version !== 1 ||
    typeof value.createdAt !== 'string' ||
    !value.records ||
    typeof value.records !== 'object' ||
    Array.isArray(value.records)
  )
    throw Error('请选择“全部学习数据备份”，单个程序请到工作台导入。');
  const records: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value.records)) {
    if (!keys.has(key) || typeof raw !== 'string') throw Error('备份包含未知数据项，未导入。');
    try {
      validateRecord(key, raw);
    } catch (error) {
      throw Error(`${key}：${error instanceof Error ? error.message : '内容无效'}`);
    }
    records[key] = raw;
  }
  return { format: 'plc-learning-backup', version: 1, createdAt: value.createdAt, records };
}
export function restoreLearningBackup(storage: Store, backup: LearningBackup) {
  // 再校验，避免绕过文件解析；仅替换文件中的同名项，未包含的现有数据保留。
  const safe = parseLearningBackup(JSON.stringify(backup));
  const before = new Map(Object.keys(safe.records).map((key) => [key, storage.getItem(key)]));
  const written: string[] = [];
  try {
    for (const [key, value] of Object.entries(safe.records)) {
      written.push(key);
      storage.setItem(key, value);
    }
  } catch {
    let rollbackFailed = false;
    for (const key of written.reverse()) {
      try {
        const old = before.get(key);
        if (old === null || old === undefined) storage.removeItem(key);
        else storage.setItem(key, old);
      } catch {
        rollbackFailed = true;
      }
    }
    throw Error(
      rollbackFailed
        ? '保存失败，部分旧数据未能恢复。请保留窗口并使用刚导出的备份恢复。'
        : '保存失败，已恢复原数据。请检查可用存储空间后重试。',
    );
  }
}
