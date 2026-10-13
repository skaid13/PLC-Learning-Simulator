import { useState } from 'react';

const keyFor = (id: string) => `plc-learning:lesson:v1:${id}`;
type Progress = { chapter: number; read: number[] };
function load(id: string): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(keyFor(id)) ?? 'null');
    if (
      raw &&
      Number.isInteger(raw.chapter) &&
      raw.chapter >= 0 &&
      raw.chapter < 6 &&
      Array.isArray(raw.read) &&
      raw.read.every((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) < 6)
    )
      return { chapter: raw.chapter, read: [...new Set<number>(raw.read)] };
  } catch {
    /* 教学进度损坏不能影响学生程序加载。 */
  }
  return { chapter: 0, read: [] };
}
export function useLessonProgress(id: string) {
  const [progress, setProgress] = useState(() => load(id));
  const [message, setMessage] = useState('章节进度保存在当前浏览器，与程序草稿分开。');
  const update = (next: Progress) => {
    setProgress(next);
    try {
      localStorage.setItem(keyFor(id), JSON.stringify(next));
    } catch {
      setMessage('教学进度无法保存；本次仍可学习。程序可通过导出 JSON 另行备份。');
    }
  };
  return {
    ...progress,
    message,
    go: (chapter: number) => {
      if (chapter >= 0 && chapter < 6) update({ ...progress, chapter });
    },
    markRead: () =>
      update({ ...progress, read: [...new Set([...progress.read, progress.chapter])] }),
  };
}
