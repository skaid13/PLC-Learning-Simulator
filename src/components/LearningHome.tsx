import { useState } from 'react';
import { version } from '../../package.json';
import { allExperiments } from '../data/catalog';
import { FoundationCourse } from './FoundationCourse';
import { KnowledgeLibrary } from './KnowledgeLibrary';
import { Modal } from './Modal';
import { loadFirstLesson } from '../teaching/firstLesson';
export const learningPhases = [
  '认识对象',
  '观察示例',
  '跟随搭建',
  '补全程序',
  '独立搭建',
  '变化任务',
];
export function LearningHome({
  onStart,
  onWorkbench,
}: {
  onStart: () => void;
  onWorkbench: (id?: string) => void;
}) {
  const [resource, setResource] = useState<'knowledge' | 'foundation' | 'courses' | null>(null);
  const savedLesson = loadFirstLesson(localStorage).progress;
  const resume = savedLesson.phase;
  return (
    <div className="learning-shell">
      <header className="learning-header">
        <strong>
          PLC 学习实验室 <small>v{version} · 本地教学</small>
        </strong>
        <div>
          <button onClick={() => setResource('courses')}>课程与实验</button>
          <button onClick={() => setResource('knowledge')}>知识工具箱</button>
          <button onClick={() => onWorkbench()}>完整工作台</button>
        </div>
      </header>
      <main className="learning-home">
        <span className="eyebrow">从这里开始 · 第一课</span>
        <h1>让一盏灯，按你的规则亮起来。</h1>
        <p className="learning-lead">
          先认识按钮、程序和灯，再看一个真的会运行的例子。每次只做一件事，最后自己搭出第一条线路。
        </p>
        <ol className="learning-roadmap" aria-label="第一课学习顺序">
          {learningPhases.map((p, i) => (
            <li key={p}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              {p}
            </li>
          ))}
        </ol>
        <section className="learning-entry">
          <h2>
            {savedLesson.finished
              ? '第一课操作已完成：可以回顾或进入下一项目'
              : resume > 0
                ? `当前任务：继续${learningPhases[resume]}`
                : '当前任务：认识按钮、条件和灯'}
          </h2>
          <p>目标：接通按钮后扫描，灯亮；断开后扫描，灯灭。你会知道每个元件为什么放在这里。</p>
          <button className="button primary" onClick={onStart}>
            {savedLesson.finished
              ? '回顾第一课：变化任务 →'
              : resume > 0
                ? `继续第一课：${learningPhases[resume]} →`
                : '开始第一课：按钮亮灯 →'}
          </button>
          <p className="notice-text">
            第一课有独立练习空间，原有实验草稿会保留。进度与程序在当前浏览器保存。
          </p>
        </section>
        <details>
          <summary>这门课学完以后去哪里？</summary>
          <p>
            按钮亮灯 → 停止条件 → 延时亮灯 →
            指导书的11项实验。其余课程从上方“课程与实验”进入；看不懂元件时打开“知识工具箱”。
          </p>
        </details>
      </main>
      {resource === 'knowledge' && (
        <Modal
          title="知识工具箱 · 每个小部分有什么用"
          className="foundation-modal"
          onClose={() => setResource(null)}
        >
          <KnowledgeLibrary />
        </Modal>
      )}
      {resource === 'foundation' && (
        <FoundationCourse onClose={() => setResource(null)} onProject={(id) => onWorkbench(id)} />
      )}
      {resource === 'courses' && (
        <Modal title="课程与实验 · 按顺序学习" onClose={() => setResource(null)}>
          <button
            className="button primary"
            onClick={() => {
              setResource(null);
              onStart();
            }}
          >
            1 · 第一课：按钮亮灯
          </button>
          <button className="button secondary" onClick={() => setResource('foundation')}>
            按需补充：十课基础阅读
          </button>
          <div className="course-directory">
            {allExperiments
              .filter((e) => e.id !== 'starter-lamp')
              .sort(
                (a, b) => Number(b.id.startsWith('starter-')) - Number(a.id.startsWith('starter-')),
              )
              .map((e) => (
                <button key={e.id} onClick={() => onWorkbench(e.id)}>
                  {e.id.startsWith('starter-') ? e.number : `实验${e.number}`} · {e.shortName}
                </button>
              ))}
          </div>
          <p>其余实验保留现有课程与编辑功能；第一课试学通过后再推广新的六阶段教学。</p>
        </Modal>
      )}
    </div>
  );
}
