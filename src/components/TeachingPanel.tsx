import { useState } from 'react';
import { foundationQuestion, learningSteps } from '../data/lesson';
import type { Experiment, LearningMode } from '../types';
import { Icon } from './Icon';

interface Props {
  mode: LearningMode;
  experiment: Experiment;
  step: number;
  onStepChange: (step: number) => void;
  onShowDetails: () => void;
  onStartLearning: () => void;
}

export function TeachingPanel({
  mode,
  experiment,
  step,
  onStepChange,
  onShowDetails,
  onStartLearning,
}: Props) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const selectedOption = foundationQuestion.options.find((option) => option.id === answer);
  return (
    <aside className="panel teaching-panel" aria-label="教学指导区">
      <div className="panel-heading">
        <div className="heading-label">
          <Icon name="book" />
          <h2>教学指导</h2>
        </div>
        <span className="subtle-label">{mode === 'teaching' ? '循序渐进' : '自主探索'}</span>
      </div>
      {mode === 'free' ? (
        <div className="free-content">
          <span className="eyebrow">FREE PRACTICE</span>
          <h3>按自己的节奏探索</h3>
          <p>你可以自由切换实验，查看指导书中的目标、控制要求和 I/O 表摘要。</p>
          <div className="free-card">
            <Icon name="grid" size={26} />
            <h4>你的工作区已保留</h4>
            <p>教学模式与自由模式共用当前程序。切换模式不会清空工作区。</p>
          </div>
          <p className="notice-text">
            在中间选择触点或线圈，点击＋空位放置，再设置变量。运行仿真与逻辑解释将在后续阶段开放。
          </p>
          <button className="button secondary full" onClick={onShowDetails}>
            查看当前实验要求
            <Icon name="arrow" size={15} />
          </button>
          <button className="text-button" onClick={onStartLearning}>
            <Icon name="book" size={16} />
            回到 PLC 入门教学
          </button>
        </div>
      ) : (
        <>
          <div className="lesson-intro">
            <span className="eyebrow">入门课 · 所有实验共用</span>
            <h3>从零认识 PLC</h3>
            <p>先理解控制的基本思路，再开始你的第一个实验。</p>
            <div className="progress-label">
              <span>学习步骤</span>
              <strong>
                {step + 1} <span>/ {learningSteps.length}</span>
              </strong>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="当前学习位置"
              aria-valuemin={1}
              aria-valuemax={6}
              aria-valuenow={step + 1}
            >
              <span style={{ width: `${((step + 1) / learningSteps.length) * 100}%` }} />
            </div>
          </div>
          <nav className="step-list" aria-label="教学步骤">
            {learningSteps.map((item, index) => (
              <button
                key={item.title}
                className={`step-item ${step === index ? 'selected' : ''}`}
                aria-current={step === index ? 'step' : undefined}
                onClick={() => onStepChange(index)}
              >
                <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                <span>{item.title}</span>
                {step === index && <Icon name="arrow" size={14} />}
              </button>
            ))}
          </nav>
          <section className="lesson-content" aria-label="当前步骤内容">
            <div className="section-kicker">STEP {String(step + 1).padStart(2, '0')}</div>
            <h3>{step === 0 ? '什么是 PLC？' : learningSteps[step].title}</h3>
            {step === 0 && (
              <>
                <p>
                  PLC 是<strong>可编程逻辑控制器</strong>
                  。你可以把它理解为一位按照程序做判断的“控制员”。
                </p>
                <div className="concept-flow">
                  <span>接收信息</span>
                  <Icon name="arrow" size={13} />
                  <span>按规则判断</span>
                  <Icon name="arrow" size={13} />
                  <span>控制设备</span>
                </div>
                <p>例如：按钮把“按下”的信息送给 PLC，PLC 根据程序决定是否让指示灯亮起。</p>
                <div className="tip">
                  <Icon name="light" size={18} />
                  <p>
                    先记住：设备怎么动作，取决于<strong>输入信息和你编写的程序</strong>。
                  </p>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <h4>什么是输入？</h4>
                <p>输入是送给 PLC 的信息。按钮、开关和传感器都可以告诉 PLC 外界发生了什么。</p>
                <h4>什么是输出？</h4>
                <p>输出是 PLC 发出的控制结果，可以用来控制指示灯、电机或阀门。</p>
                <div className="tip">
                  <Icon name="light" />
                  <p>输入 → 程序判断 → 输出。按钮按下后是否亮灯，要看程序如何规定。</p>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <p>用“按钮控制指示灯”这个教学例子区分设备：</p>
                <div className="io-example">
                  <span>按钮</span>
                  <b>输入设备</b>
                  <span>指示灯</span>
                  <b>输出设备</b>
                </div>
                <p>
                  当前实验“{experiment.shortName}”的输入输出来自指导书。编辑器用 SIM_*
                  教学变量与这些端子对应，暂不连接实体设备或运行。
                </p>
                <button className="button secondary full" onClick={onShowDetails}>
                  查看实验 I/O 摘要
                  <Icon name="arrow" size={14} />
                </button>
              </>
            )}
            {step === 3 && (
              <>
                <p>
                  梯形图是一种图形化控制程序。先选“常开触点”或“常闭触点”，再点击网络左侧的＋空位，最后选择变量。
                </p>
                <div className="tip">
                  <Icon name="light" />
                  <p>
                    常开触点在变量为 TRUE 时条件成立，常闭触点在变量为 FALSE
                    时条件成立。串联表示所有触点条件都成立。
                  </p>
                </div>
                <p>
                  再选“输出线圈”，放到最右侧并绑定输出或内部变量。点“检查结构”查找遗漏；结构通过不代表控制任务已经完成。每个网络最多
                  4 个串联触点。
                </p>
              </>
            )}
            {step === 4 && (
              <>
                <p>后续运行时，你将操作虚拟输入，观察程序控制的输出，再与实验要求比较。</p>
                <div className="tip">
                  <Icon name="lock" />
                  <p>PLC 执行引擎和实验仿真尚未开放。右侧仅为静态占位，不表示程序正在运行。</p>
                </div>
                <p>观察时不仅要问“发生了什么”，也要问“为什么会发生”。</p>
              </>
            )}
            {step === 5 && (
              <div className="quiz">
                <p>{foundationQuestion.title}</p>
                <fieldset>
                  <legend className="sr-only">选择输入设备</legend>
                  {foundationQuestion.options.map((option, index) => (
                    <label key={option.id} className={answer === option.id ? 'chosen' : ''}>
                      <input
                        type="radio"
                        name="foundation-answer"
                        value={option.id}
                        checked={answer === option.id}
                        onChange={() => {
                          setAnswer(option.id);
                          setSubmitted(false);
                        }}
                      />
                      <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                      {option.text}
                    </label>
                  ))}
                </fieldset>
                <button
                  className="button primary full"
                  disabled={!answer}
                  onClick={() => setSubmitted(true)}
                >
                  检查答案
                  <Icon name="check" size={16} />
                </button>
                {submitted && (
                  <div
                    className={`feedback ${answer === foundationQuestion.correctId ? 'correct' : 'incorrect'}`}
                    role="status"
                  >
                    {selectedOption?.feedback}
                  </div>
                )}
                <button
                  className="text-button"
                  aria-expanded={showReference}
                  onClick={() => setShowReference((value) => !value)}
                >
                  {showReference ? '收起参考答案' : '查看参考答案'}
                </button>
                {showReference && (
                  <p className="reference-answer">
                    参考答案：按钮。判断方法是看信息的方向：按钮把操作信息送给
                    PLC；指示灯接收控制结果。本题按预设选项判定。
                  </p>
                )}
              </div>
            )}
          </section>
          <div className="lesson-navigation">
            <button
              className="button secondary"
              disabled={step === 0}
              onClick={() => onStepChange(step - 1)}
            >
              上一步
            </button>
            <button
              className="button primary"
              disabled={step === learningSteps.length - 1}
              onClick={() => onStepChange(step + 1)}
            >
              下一步
              <Icon name="arrow" size={14} />
            </button>
          </div>
        </>
      )}
      <div className="panel-bottom-note">
        <Icon name="info" size={14} />
        <span>共用 PLC 入门课 · 专属实验教学后续开放</span>
      </div>
    </aside>
  );
}
