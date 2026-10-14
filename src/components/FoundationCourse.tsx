import { useEffect, useRef, useState } from 'react';
import { foundationLessons } from '../data/foundation';
import { Modal } from './Modal';

export const FOUNDATION_KEY = 'plc-learning:foundation:v1';
type Progress = { chapter: string; read: string[] };
function load(): Progress {
  const initial = { chapter: foundationLessons[0].id, read: [] };
  const known = (id: unknown): id is string =>
    typeof id === 'string' && foundationLessons.some((l) => l.id === id);
  try {
    const saved = JSON.parse(localStorage.getItem(FOUNDATION_KEY) ?? 'null');
    if (saved && known(saved.chapter) && Array.isArray(saved.read) && saved.read.every(known))
      return { chapter: saved.chapter, read: [...new Set<string>(saved.read)] };
  } catch {
    /* Reading data never blocks student programs. */
  }
  return initial;
}

export function FoundationCourse({
  onClose,
  onProject,
}: {
  onClose: () => void;
  onProject: (id: string) => void;
}) {
  const [progress, setProgress] = useState(load);
  const [message, setMessage] = useState('阅读位置单独保存；已读不代表掌握。');
  const index = foundationLessons.findIndex((l) => l.id === progress.chapter),
    lesson = foundationLessons[index];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    heading.current?.scrollIntoView({ block: 'nearest' });
  }, [progress.chapter]);
  const update = (next: Progress) => {
    setProgress(next);
    try {
      localStorage.setItem(FOUNDATION_KEY, JSON.stringify(next));
    } catch {
      setMessage('阅读进度暂时无法保存，本次仍可继续。程序草稿不受影响。');
    }
  };
  const go = (next: number) => {
    if (next >= 0 && next < foundationLessons.length)
      update({ ...progress, chapter: foundationLessons[next].id });
  };
  return (
    <Modal
      title="PLC 基础课堂 · 从零打基础"
      className="foundation-modal"
      onClose={onClose}
      footer={
        <div className="foundation-footer">
          <span role="status">{message}</span>
          <button className="button secondary" disabled={index === 0} onClick={() => go(index - 1)}>
            上一课
          </button>
          <button
            className="button secondary"
            onClick={() =>
              update({ ...progress, read: [...new Set([...progress.read, lesson.id])] })
            }
          >
            {progress.read.includes(lesson.id) ? '本课已读' : '标记本课已读'}
          </button>
          <button
            className="button primary"
            disabled={index === foundationLessons.length - 1}
            onClick={() => go(index + 1)}
          >
            下一课
          </button>
        </div>
      }
    >
      <div className="foundation-reader">
        <nav className="foundation-nav" aria-label="基础课堂目录">
          <p>十课文字基础 · 可随时回顾</p>
          <p>
            已读 {progress.read.length} / {foundationLessons.length} 课
          </p>
          {foundationLessons.map((l, i) => (
            <button
              key={l.id}
              className={l.id === lesson.id ? 'active' : ''}
              aria-current={l.id === lesson.id ? 'page' : undefined}
              onClick={() => go(i)}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span>{l.title}</span>
              {progress.read.includes(l.id) && <small>已读</small>}
            </button>
          ))}
        </nav>
        <article className="foundation-article" key={lesson.id} aria-label="基础课堂正文">
          <span className="eyebrow">
            基础课 {index + 1} / {foundationLessons.length}
          </span>
          <h3 ref={heading} tabIndex={-1}>
            {lesson.title}
          </h3>
          <p className="foundation-goal">
            <strong>学完能做什么：</strong>
            {lesson.goal}
          </p>
          {lesson.sections.map((s) => (
            <section key={s.title}>
              <h4>{s.title}</h4>
              {s.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
          <section className="foundation-example">
            <h4>一步一步想一个例子</h4>
            <p>{lesson.example.situation}</p>
            <ol>
              {lesson.example.reasoning.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </section>
          <section className="foundation-checks">
            <h4>先自己说，再看答案</h4>
            <p>用自己的话回答即可，不必背定义。软件不对自由文字打分。</p>
            {lesson.checks.map((c, i) => (
              <details key={c.question}>
                <summary>
                  {i + 1}. {c.question}
                </summary>
                <p>{c.answer}</p>
              </details>
            ))}
          </section>
          <section className="foundation-mistake">
            <h4>容易混淆的地方</h4>
            <p>{lesson.mistake}</p>
          </section>
          <section className="foundation-practice">
            <h4>把这一课用起来</h4>
            <p>{lesson.practice.task}</p>
            <button className="button primary" onClick={() => onProject(lesson.practice.id)}>
              去练习：{lesson.practice.label}
            </button>
            <p className="guide-small">打开对应项目，保留现有草稿。随时从入门地图回到这门课。</p>
          </section>
        </article>
      </div>
    </Modal>
  );
}
