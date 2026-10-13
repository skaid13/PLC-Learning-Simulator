import { useState, type ReactNode } from 'react';
import type { Experiment } from '../types';
import { curriculum } from '../data/curriculum';
import { courses } from '../teaching/courses';
import { useLessonProgress } from '../teaching/lessonProgress';
import { CourseChapter } from './CourseChapter';
export function ExperimentLesson({
  guide,
  experiment,
  onFoundation,
  onDetails,
}: {
  guide?: ReactNode;
  experiment: Experiment;
  onFoundation: () => void;
  onDetails: () => void;
}) {
  const progress = useLessonProgress(experiment.id);
  const step = progress.chapter,
    setStep = progress.go;
  const [answer, setAnswer] = useState<number | null>(null),
    [submitted, setSubmitted] = useState(false),
    [reference, setReference] = useState(false);
  const lesson = curriculum[experiment.id];
  const course = courses[experiment.id];
  const titles = ['目标与要求', '控制原理', '输入与输出', '动手编程', '调试与故障', '实验理解检查'];
  return (
    <aside className="panel teaching-panel" aria-label="教学指导区">
      <div className="panel-heading">
        <h2>实验教学</h2>
        <button className="text-button" onClick={onFoundation}>
          入门基础
        </button>
      </div>
      {guide}
      <div className="lesson-intro">
        <span className="eyebrow">EXPERIMENT {experiment.number}</span>
        <h3>{experiment.shortName}</h3>
        <p>步骤 {step + 1} / 6 · 可随时回顾</p>
        <p>已读 {progress.read.length} / 6 节 · 已读不代表掌握</p>
        <progress aria-label="实验阅读进度" value={progress.read.length} max={6} />
      </div>
      <nav className="step-list" aria-label="实验教学步骤">
        {titles.map((title, i) => (
          <button
            key={title}
            className={`step-item ${i === step ? 'selected' : ''}`}
            onClick={() => setStep(i)}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="step-number">0{i + 1}</span>
            {title}
            {progress.read.includes(i) && <span aria-label="已读">✓</span>}
          </button>
        ))}
      </nav>
      <section className="lesson-content" aria-label="实验步骤内容">
        <h3>{titles[step]}</h3>
        {course && <CourseChapter course={course} experiment={experiment} chapter={step} />}
        {step === 0 && (
          <>
            <p>{experiment.objective}</p>
            <ol>
              {experiment.requirements.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </>
        )}
        {step === 1 && (
          <>
            <p>{lesson.principle}</p>
            <div className="tip">
              <p>
                输入 → 扫描网络 → 输出 → 装置变化 → 传感器反馈。程序使用实际执行轨迹解释每一步。
              </p>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <p>
              输入 {experiment.inputs.length} 点，输出 {experiment.outputs.length} 点；SIM_*
              是教学变量，I-xx / O-xx 是指导书端子。
            </p>
            <ul>
              {experiment.inputs.map((i) => (
                <li key={i.terminal}>
                  {i.terminal} · {i.label}
                </li>
              ))}
            </ul>
            <button className="button secondary full" onClick={onDetails}>
              查看完整 I/O 与要求
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <ol>
              {lesson.practice.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <p>
              先自己尝试，再按工作台上方“查看参考程序”。载入参考会要求确认，原草稿可以撤销恢复。
            </p>
          </>
        )}
        {step === 4 && (
          <>
            <ul>
              {lesson.faults.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p>
              先停止并检查结构，再单步扫描。使用“为什么这样运行？”读取实际条件，定位对应网络。卡滞与传感器冻结可以在装置下方注入或解除。
            </p>
          </>
        )}
        {step === 5 && (
          <div className="quiz">
            <p>{lesson.question}</p>
            <fieldset>
              <legend className="sr-only">实验问题</legend>
              {lesson.options.map((text, i) => (
                <label key={text}>
                  <input
                    type="radio"
                    name={`quiz-${experiment.id}`}
                    checked={answer === i}
                    onChange={() => {
                      setAnswer(i);
                      setSubmitted(false);
                    }}
                  />
                  {text}
                </label>
              ))}
            </fieldset>
            <button
              className="button primary full"
              disabled={answer === null}
              onClick={() => setSubmitted(true)}
            >
              提交实验答案
            </button>
            {submitted && (
              <p
                role="status"
                className={`feedback ${answer === lesson.correct ? 'correct' : 'incorrect'}`}
              >
                {answer === lesson.correct ? '回答正确。' : '再想一想。'}
                {lesson.feedback}
              </p>
            )}
            <button
              className="text-button"
              aria-expanded={reference}
              onClick={() => setReference(!reference)}
            >
              {reference ? '收起实验答案' : '查看实验答案'}
            </button>
            {reference && (
              <p>
                {lesson.options[lesson.correct]}。{lesson.feedback}
              </p>
            )}
          </div>
        )}
        <details className="model-notes">
          <summary>本实验的教学设定与边界</summary>
          <p>{lesson.assumptions}</p>
          {experiment.notes?.map((n) => (
            <p key={n}>指导书备注：{n}</p>
          ))}
        </details>
      </section>
      <div className="course-read">
        <button className="button secondary" onClick={progress.markRead}>
          标记本节已读
        </button>
        <p>{progress.message}</p>
      </div>
      <div className="lesson-navigation">
        <button className="button secondary" disabled={!step} onClick={() => setStep(step - 1)}>
          上一步
        </button>
        <button className="button primary" disabled={step === 5} onClick={() => setStep(step + 1)}>
          下一步
        </button>
      </div>
    </aside>
  );
}
