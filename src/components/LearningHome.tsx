import { useState } from 'react';
import { version } from '../../package.json';
import { allExperiments } from '../data/catalog';
import { FoundationCourse } from './FoundationCourse';
import { KnowledgeLibrary } from './KnowledgeLibrary';
import { Modal } from './Modal';
import { loadFirstLesson } from '../teaching/firstLesson';
import { LearningSymbol } from './LearningSymbol';
import { Icon } from './Icon';
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
  const completed = savedLesson.finished ? learningPhases.length : savedLesson.unlocked;
  return (
    <div className="learning-shell">
      <header className="learning-header">
        <div className="learning-brand">
          <Icon name="chip" size={27} />
          <strong>
            PLC 学习实验室{' '}
            <small>
              v{version} · {location.protocol === 'plc-app:' ? '桌面教学' : '本地教学'}
            </small>
          </strong>
        </div>
        <div className="learning-utilities">
          <button onClick={() => setResource('courses')}>课程与实验</button>
          <button onClick={() => setResource('knowledge')}>知识工具箱</button>
          <button onClick={() => onWorkbench()}>完整工作台</button>
        </div>
      </header>
      <div className="learning-layout">
        <aside className="learning-route" aria-label="第一课学习路线">
          <h2>第一课学习路线</h2>
          <p>按钮亮灯 · 六阶段</p>
          <ol className="learning-roadmap" aria-label="第一课学习顺序">
            {learningPhases.map((p, i) => (
              <li
                key={p}
                aria-current={i === resume ? 'step' : undefined}
                data-complete={i < completed}
              >
                <span aria-hidden="true">
                  {i < completed ? <Icon name="check" size={16} /> : i + 1}
                </span>
                <div>
                  <strong>{p}</strong>
                  <small>
                    {
                      [
                        '先看懂每个部分',
                        '改变输入，观察结果',
                        '一步一步画出线路',
                        '把缺少的元件补上',
                        '从空白开始验证',
                        '换一个条件再试试',
                      ][i]
                    }
                  </small>
                </div>
              </li>
            ))}
          </ol>
          <div className="learning-route-progress">
            <span>
              已完成阶段{' '}
              <strong>
                {completed} / {learningPhases.length}
              </strong>
            </span>
            <progress aria-label="第一课已完成阶段" value={completed} max={learningPhases.length} />
            <small>按实际学习进度记录</small>
          </div>
        </aside>
        <main className="learning-home" id="learning-main">
          <span className="eyebrow">从这里开始 · 第一课</span>
          <h1>让一盏灯，按你的规则亮起来。</h1>
          <p className="learning-lead">
            先认识按钮、程序和灯，再看一个真的会运行的例子。每次只做一件事，最后自己搭出第一条线路。
          </p>
          <section className="learning-entry">
            <div className="learning-entry-meta">
              <span>第一课 · 按钮亮灯</span>
              <span>零基础入门</span>
            </div>
            <h2>
              {savedLesson.finished
                ? '第一课操作已完成：可以回顾或进入下一项目'
                : resume > 0
                  ? `当前任务：继续${learningPhases[resume]}`
                  : '当前任务：认识按钮、条件和灯'}
            </h2>
            <p>目标：接通按钮后扫描，灯亮；断开后扫描，灯灭。你会知道每个元件为什么放在这里。</p>
            <div
              className="learning-circuit"
              role="img"
              aria-label="结构示意：亮灯按钮提供输入，常开触点判断条件，输出线圈写入结果，指示灯显示输出。此图不表示运行状态。"
            >
              {(['input', 'contact', 'coil', 'lamp'] as const).map((kind, i) => (
                <div className="learning-circuit-object" key={kind}>
                  <LearningSymbol kind={kind} />
                  <strong>{['亮灯按钮', '常开触点', '输出线圈', '指示灯'][i]}</strong>
                  <small>{['提供输入', '判断条件', '写入结果', '显示输出'][i]}</small>
                </div>
              ))}
            </div>
            <p className="circuit-caption">控制关系示意 · 进入课堂后，用真实扫描验证结果</p>
            <div className="learning-entry-action">
              <button className="button primary" onClick={onStart}>
                {savedLesson.finished
                  ? '回顾第一课：变化任务 →'
                  : resume > 0
                    ? `继续第一课：${learningPhases[resume]} →`
                    : '开始第一课：按钮亮灯 →'}
              </button>
              <span>不需要先会画电路</span>
            </div>
          </section>
          <div className="learning-home-footer">
            <button
              className="knowledge-link"
              onClick={() => window.dispatchEvent(new Event('plc-open-backup'))}
            >
              备份或迁移学习数据
            </button>
            <p>
              <Icon name="lock" size={16} />
              独立练习空间 · 草稿保存在{location.protocol === 'plc-app:' ? '本应用' : '当前浏览器'}
            </p>
            <details>
              <summary>这门课学完以后去哪里？</summary>
              <p>
                按钮亮灯 → 停止条件 → 延时亮灯 →
                指导书的11项实验。其余课程从上方“课程与实验”进入；看不懂元件时打开“知识工具箱”。
              </p>
            </details>
          </div>
        </main>
      </div>
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
