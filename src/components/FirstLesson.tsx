import { useEffect, useRef, useState } from 'react';
import { version } from '../../package.json';
import { editProgram, type EditorAction } from '../editor/model';
import { useSimulator } from '../engine/useSimulator';
import type { ProgramWorkspace } from '../types';
import type { EditorSnapshot } from '../teaching/guide';
import {
  FIRST_LESSON_KEY,
  loadFirstLesson,
  phaseProgram,
  lampProblem,
  verifiedCase,
} from '../teaching/firstLesson';
import { downloadText } from '../storage/projects';
import { learningPhases } from './LearningHome';
import { LadderEditor } from './LadderEditor';
import { GuideHighlight, type GuideTarget } from './GuideHighlight';
import { KnowledgeLibrary } from './KnowledgeLibrary';
import { Modal } from './Modal';
import { LearningSymbol } from './LearningSymbol';
import { Icon } from './Icon';

const objects = [
  {
    name: '亮灯按钮',
    text: '它提供输入消息。接通是TRUE，断开是FALSE；按钮不会直接替你写程序。',
    topic: 'input',
  },
  {
    name: '常开触点',
    text: '它读取按钮，判断是否接通。输入TRUE时条件成立，FALSE时不成立。触点不改变输入。',
    topic: 'normallyOpen',
  },
  {
    name: '输出线圈',
    text: '它把判断结果写给灯。普通线圈每扫描更新：通路成立写TRUE，不成立写FALSE。',
    topic: 'coil',
  },
  {
    name: '指示灯',
    text: '它读取输出结果。SIM_OUT_00是这盏灯的变量名；灯亮说明输出接通，不说明整个实验都已掌握。',
    topic: 'output',
  },
];
const purposes = [
  '认出输入、判断和输出，先不用画程序。',
  '操作现成线路，先建立输入与结果的联系。',
  '逐步放置并绑定元件，理解每一次操作。',
  '只缺一个输出线圈，把已学的步骤用一次。',
  '从空白开始，帮助按需打开，不自动填答案。',
  '只改变判断方式，检验你是否理解常闭。',
];
export function FirstLesson({
  onHome,
  onWorkbench,
  active = true,
}: {
  onHome: () => void;
  onWorkbench: (id?: string) => void;
  active?: boolean;
}) {
  const [loaded] = useState(() => loadFirstLesson(localStorage));
  const [progress, setProgress] = useState(loaded.progress);
  const [storageMessage, setStorageMessage] = useState(
    loaded.warning ?? '教学草稿独立自动保存；原实验程序保留。',
  );
  const [allowSave, setAllowSave] = useState(!loaded.recovery);
  const phase = progress.phase;
  const [initialPrograms] = useState(
    () =>
      Object.fromEntries([1, 2, 3, 4, 5].map((p) => [p, phaseProgram(p)])) as Record<
        string,
        ProgramWorkspace
      >,
  );
  const program = progress.programs[phase] ?? initialPrograms[phase] ?? initialPrograms[1];
  const simulator = useSimulator(program);
  const [editor, setEditor] = useState<EditorSnapshot>({ tool: 'select', selection: null });
  const [checked, setChecked] = useState<ProgramWorkspace>();
  const [seen, setSeen] = useState<number[]>([0]);
  const [object, setObject] = useState(0);
  const [answer, setAnswer] = useState('');
  const [guess, setGuess] = useState<boolean | null>(null);
  const [pending, setPending] = useState<{
    guess: boolean;
    before: number;
    program: ProgramWorkspace;
  } | null>(null);
  const [cases, setCases] = useState({ on: false, off: false });
  const [feedback, setFeedback] = useState('');
  const [hints, setHints] = useState(0);
  const [topic, setTopic] = useState<string | null>(null);
  const [resetPrompt, setResetPrompt] = useState(false);
  const [undo, setUndo] = useState<ProgramWorkspace[]>([]),
    [redo, setRedo] = useState<ProgramWorkspace[]>([]);
  const [target, setTarget] = useState<GuideTarget | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!allowSave) return;
    try {
      localStorage.setItem(FIRST_LESSON_KEY, JSON.stringify(progress));
      setStorageMessage('教学草稿和当前位置已保存；原实验程序保留。');
    } catch {
      setStorageMessage('无法保存教学记录，请导出本阶段程序备份；当前仍可操作。');
    }
  }, [progress, allowSave]);
  useEffect(() => {
    if (!active) {
      simulator.stop();
      setTarget(null);
    }
  }, [active]);
  useEffect(() => {
    if (
      !pending ||
      pending.program !== program ||
      simulator.state.scan.scanCount <= pending.before ||
      simulator.state.program !== program
    )
      return;
    const result = verifiedCase(program, simulator.state, phase === 5);
    const input = simulator.state.scan.values['input:I-00'] === true,
      output = simulator.state.scan.values['output:O-00'] === true;
    if (simulator.state.status === 'error')
      setFeedback('程序结构还不完整，请按上方任务修正后再预测和扫描。');
    else if (pending.guess !== output)
      setFeedback(
        `预测需要修正：本次采样输入${input ? 'TRUE' : 'FALSE'}，${phase === 5 ? '常闭判断对它取反' : '常开判断读取它'}，实际灯${output ? '亮' : '灭'}。想一想原因，重新预测再扫描；这次不计为验证通过。`,
      );
    else if (result) {
      setCases((c) => ({ ...c, [result]: true }));
      setFeedback(
        `预测正确。扫描#${simulator.state.scan.scanCount}：输入${input ? 'TRUE' : 'FALSE'} → ${phase === 5 ? '常闭' : '常开'}条件${output ? '成立' : '不成立'} → 输出${output ? 'TRUE' : 'FALSE'} → 灯${output ? '亮' : '灭'}。`,
      );
    } else setFeedback(lampProblem(program, phase === 5) ?? '请检查当前程序及实际扫描结果。');
    setPending(null);
    setGuess(null);
  }, [simulator.state.scan, simulator.state.status, pending, program, phase]);
  const changePhase = (next: number) => {
    simulator.stop();
    const independent = progress.programs[4];
    const variation =
      next === 5 && independent && !lampProblem(independent)
        ? { ...structuredClone(independent), name: '第一课 · 独立程序的常闭变式' }
        : initialPrograms[next];
    const p = progress.programs[next] ?? variation ?? initialPrograms[1];
    simulator.reset(p);
    setProgress((old) => ({
      ...old,
      phase: next,
      unlocked: Math.max(old.unlocked, next),
      programs: next > 0 ? { ...old.programs, [next]: p } : old.programs,
    }));
    setCases({ on: false, off: false });
    setGuess(null);
    setPending(null);
    setChecked(undefined);
    setHints(0);
    setFeedback('');
    setUndo([]);
    setRedo([]);
    setEditor({ tool: 'select', selection: null });
    setTarget(null);
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest('.first-lesson')?.scrollIntoView({ block: 'start' });
  };
  const replace = (p: ProgramWorkspace, record = true) => {
    if (record) {
      setUndo((u) => [...u, program].slice(-50));
      setRedo([]);
    }
    simulator.reset(p);
    setProgress((old) => ({
      ...old,
      programs: phase > 0 ? { ...old.programs, [phase]: p } : old.programs,
      finished: false,
    }));
    setCases({ on: false, off: false });
    setGuess(null);
    setPending(null);
    setChecked(undefined);
    setFeedback(
      phase === 2
        ? '程序已修改，请完成搭建并检查结构；本阶段不重复观察实验。'
        : '程序已修改，运行已复位。请重新设置输入，两种情况都需要重新验证。',
    );
    setTarget(null);
  };
  const edit = (action: EditorAction) => {
    if (simulator.state.status === 'running' || phase === 1) return;
    const next = editProgram(program, action);
    if (next !== program) replace(next);
  };
  const valid = phase > 0 && !lampProblem(program, phase === 5);
  const ready =
    phase === 0
      ? seen.length === 4 && answer === 'read'
      : phase === 2
        ? valid && checked === program
        : valid && cases.on && cases.off;
  const input = simulator.state.inputs['input:I-00'] === true;
  const sampled = simulator.state.scan.values['input:I-00'] === true;
  const output = simulator.state.scan.values['output:O-00'] === true;
  const n = program.networks[0],
    contact = n.contacts[0];
  let task = {
    title: '保持断开，先做一次扫描',
    action: '不用切换按钮。保持默认FALSE，选择亮/灭预测，再点“预测后单步扫描”。',
    why: '初始灯灭只是复位状态；扫描后才能证明程序怎样处理断开输入。',
    selector: '#lesson-predict',
  };
  if (phase === 0)
    task = {
      title: '依次认识四个对象',
      action: '点击操作区的四张对象卡，读一句用途，再回答一个问题。',
      why: '先分清谁提供消息、谁判断、谁写结果，再动手画线路。',
      selector: '.lesson-objects',
    };
  else if (phase !== 1 && !valid) {
    if (!contact)
      task =
        editor.tool === 'normallyOpen'
          ? {
              title: '放置常开触点',
              action: '点击梯形图左侧“＋ 添加触点”。',
              why: '左侧触点负责读条件。先只放一个。',
              selector: '[data-guide="contact-0-0-0"]',
            }
          : {
              title: '选择常开触点工具',
              action: '点击编辑器工具栏“常开触点”。',
              why: '本课先做按钮接通才亮灯，所以用常开判断TRUE。',
              selector: '[data-guide="tool-normallyOpen"]',
            };
    else if (contact.variableId !== 'input:I-00')
      task = {
        title: '让触点读取亮灯按钮',
        action: '点选触点，在元件旁或下方的变量列表选择亮灯按钮（I-00）。',
        why: '放了符号还要指定读哪个消息，触点不能把输出当作本课按钮。',
        selector:
          editor.selection?.instructionId === contact.id
            ? editor.inlineVariableOpen
              ? '[aria-label="图上元件变量"]'
              : '[aria-label="元件变量"]'
            : '[data-guide="contact-0-0-0"]',
      };
    else if (!n.coil)
      task =
        editor.tool === 'coil'
          ? {
              title: '放置输出线圈',
              action: '点击梯形图最右侧“＋ 末端线圈”。',
              why: '左侧读到条件，右侧把结果写给灯。',
              selector: '[data-guide="coil-0"]',
            }
          : {
              title: '选择输出线圈工具',
              action: '点击工具栏“输出线圈”。',
              why: '按钮的条件要有执行结果，这里用普通线圈让灯跟随条件。',
              selector: '[data-guide="tool-coil"]',
            };
    else if (n.coil.variableId !== 'output:O-00')
      task = {
        title: '让线圈控制指示灯',
        action: '点选末端线圈，在元件旁或下方的变量列表选择指示灯（O-00）。',
        why: '线圈写输出；SIM_OUT_00才对应这盏灯。',
        selector:
          editor.selection?.instructionId === n.coil.id
            ? editor.inlineVariableOpen
              ? '[aria-label="图上元件变量"]'
              : '[aria-label="元件变量"]'
            : '[data-guide="coil-0"]',
      };
    else
      task = {
        title: phase === 5 ? '把常开改为常闭' : '修正当前线路',
        action:
          phase === 5
            ? '点选第一个触点，在“触点类型”选择常闭触点。'
            : '按“检查结构”，根据提示恢复一条常开按钮→普通灯线圈线路。',
        why:
          phase === 5
            ? '新要求是按钮断开时灯亮，因此要判断输入是不是FALSE。'
            : '多余支路、其他指令或错误变量会改变这条简单规则。',
        selector: '[data-guide="contact-0-0-0"]',
      };
  } else if (phase !== 1 && checked !== program)
    task = {
      title: '检查刚搭好的结构',
      action: '点击编辑器下方“检查结构”。',
      why: '先确保元件完整、变量有效；结构正确仍需用实际输入验证。',
      selector: '[data-guide="check"]',
    };
  else if (ready)
    task = {
      title: phase === 2 ? '线路已搭好，结构检查通过' : '两种输入都验证通过',
      action:
        phase === 5
          ? '用自己的话解释常开和常闭的区别，再进入下一项目。'
          : phase === 2
            ? '直接进入“补全程序”；本阶段无需重复上一阶段的亮灭实验。'
            : '点击下方“进入下一阶段”，逐步撤去帮助。',
      why: '能解释并预测结果，比只记住点了哪些按钮更重要。',
      selector: '#lesson-next',
    };
  else if (phase > 0 && (phase === 1 || (valid && checked === program))) {
    const needed = cases.off;
    const stateName = needed ? '接通' : '断开';
    const valueName = needed ? 'TRUE' : 'FALSE';
    if (input !== needed)
      task = {
        title: `接下来验证${stateName}输入`,
        action: `点击“亮灯按钮”，使待采样输入为${valueName}，然后预测并扫描。`,
        why: '验证记录来自实际扫描，两种输入各验证一次即可，不用反复切换。',
        selector: '#lesson-input',
      };
    else
      task = {
        title:
          !needed && !simulator.state.scan.scanCount
            ? '保持断开，先做一次扫描'
            : `预测${stateName}后的灯`,
        action: `${!needed && !simulator.state.scan.scanCount ? '不用切换按钮，保持默认FALSE。' : `保持当前${valueName}。`}选择亮/灭预测，再点“预测后单步扫描”。`,
        why: `复位状态不算验证。${phase === 5 ? '常闭在FALSE时成立、TRUE时不成立。' : '常开在TRUE时成立、FALSE时不成立。'}扫描后才能记录结果。`,
        selector: '#lesson-predict',
      };
  }
  const showGuidance = phase < 4 || hints > 0;
  const locate = () =>
    setTarget({
      selector: `.first-lesson ${task.selector}`,
      text: task.action,
      request: Date.now(),
    });
  useEffect(() => {
    if (!active || phase === 0 || !showGuidance) {
      setTarget(null);
      return;
    }
    setTarget({
      selector: `.first-lesson ${task.selector}`,
      text: task.action,
      request: Date.now(),
    });
  }, [phase, task.selector, active, showGuidance]);
  const scan = () => {
    if (guess === null) {
      setFeedback('先选择你预测的亮或灭，再扫描。');
      return;
    }
    if (!valid) {
      setFeedback(lampProblem(program, phase === 5) ?? '先完成线路。');
      return;
    }
    if (phase > 1 && checked !== program) {
      setFeedback('先点击编辑器的“检查结构”，再进行预测验证。');
      return;
    }
    setPending({ guess, before: simulator.state.scan.scanCount, program });
    simulator.step();
  };
  const exportProgram = () =>
    downloadText(JSON.stringify(program, null, 2), `PLC-第一课-${learningPhases[phase]}.json`);
  return (
    <div className={`learning-shell first-lesson lesson-phase-${phase}`}>
      <header className="learning-header">
        <div className="learning-brand">
          <Icon name="chip" size={27} />
          <strong>
            第一课 · 按钮亮灯<small>v{version} · 从看懂到自己完成</small>
          </strong>
        </div>
        <div className="learning-utilities">
          <button
            onClick={() => {
              simulator.stop();
              setTarget(null);
              onHome();
            }}
          >
            学习首页
          </button>
          <button onClick={() => setTopic(phase === 5 ? 'normallyClosed' : 'normallyOpen')}>
            知识工具箱
          </button>
          <button
            onClick={() => {
              simulator.stop();
              setTarget(null);
              onWorkbench();
            }}
          >
            退出到完整工作台
          </button>
        </div>
      </header>
      <main className="lesson-main">
        <nav className="lesson-phases" aria-label="六阶段学习进度">
          {learningPhases.map((name, i) => (
            <button
              key={name}
              aria-current={phase === i ? 'step' : undefined}
              disabled={i > progress.unlocked}
              onClick={() => changePhase(i)}
            >
              <span>{i + 1}</span>
              {name}
              {i < progress.unlocked && (
                <>
                  <Icon name="check" size={14} />
                  <span className="sr-only">已完成</span>
                </>
              )}
            </button>
          ))}
        </nav>
        <div className="lesson-heading">
          <span className="eyebrow">阶段 {phase + 1} / 6 · 当前只做这一件事</span>
          <h1 ref={heading} tabIndex={-1}>
            {learningPhases[phase]}：
            {
              [
                '按钮、条件和灯',
                '先让现成的程序运行',
                '亲手建立第一条线路',
                '把缺少的结果补上',
                '这次由你从空白开始',
                '按钮断开时，让灯亮',
              ][phase]
            }
          </h1>
          <p>{purposes[phase]}</p>
        </div>
        <p className="lesson-save" role="status">
          {storageMessage}
        </p>
        {loaded.recovery && !allowSave && (
          <div role="alert">
            <p>原始记录尚未覆盖。</p>
            <button onClick={() => downloadText(loaded.recovery!, 'PLC-无法读取的教学记录.txt')}>
              下载原始教学记录
            </button>
            <button onClick={() => setResetPrompt(true)}>确认后开始新的教学记录</button>
          </div>
        )}
        <div className="lesson-columns">
          <aside className="lesson-task" aria-label="当前学习任务">
            <span className="eyebrow">你现在要做什么</span>
            <h2>{showGuidance ? task.title : phase === 5 ? '独立变化任务' : '独立搭建任务'}</h2>
            <p>
              {showGuidance
                ? task.action
                : phase === 5
                  ? '让按钮断开时灯亮、接通时灯灭。只改变触点判断方式，保留按钮与灯的变量。'
                  : '建立一个按钮接通后灯亮、断开后灯灭的程序。请先自己试，不确定时再打开帮助。'}
            </p>
            {contact?.variableId === 'output:O-00' && phase > 1 && (
              <p role="alert">
                当前触点读到了输出SIM_OUT_00。本课应读取按钮输入SIM_IN_00，请改“元件变量”。
              </p>
            )}
            <details open={phase === 0}>
              <summary>为什么这样做？</summary>
              <p>{task.why}</p>
            </details>
            {phase > 0 && (
              <>
                <div className="lesson-help-actions">
                  <button onClick={locate} className="button secondary">
                    定位当前操作
                  </button>
                  <button
                    className="text-button"
                    aria-label={`需要一点帮助（${hints}/3）`}
                    onClick={() => setHints((v) => Math.min(3, v + 1))}
                  >
                    帮助（{hints}/3）
                  </button>
                </div>
                {hints > 0 && (
                  <p className="lesson-hint">
                    {hints === 1
                      ? '方向：左边触点读输入，右边线圈写输出；先确认条件，再完成当前任务。'
                      : hints === 2
                        ? `位置：${task.action}`
                        : `示范思路：常${phase === 5 ? '闭' : '开'}触点绑定SIM_IN_00 → 普通线圈绑定SIM_OUT_00。输入${phase === 5 ? 'FALSE' : 'TRUE'}时灯亮。请手动操作，软件不会替你填入。`}
                  </p>
                )}
                {phase === 2 ? (
                  <p className="lesson-target">
                    本阶段只做搭建与结构检查，亮灭观察已在上一阶段完成。
                  </p>
                ) : (
                  <details className="lesson-verification">
                    <summary>
                      预期结果与验证记录（{Number(cases.on) + Number(cases.off)}/2）
                    </summary>
                    <p className="lesson-target">
                      预期：
                      {phase === 5
                        ? '输入FALSE→灯亮；输入TRUE→灯灭。'
                        : '输入TRUE→灯亮；输入FALSE→灯灭。'}
                      输入改变后必须扫描。
                    </p>
                    <ul className="lesson-checks" aria-label="本阶段验证结果">
                      <li>{cases.on ? '已通过' : '待验证'}：接通输入并正确预测、扫描</li>
                      <li>{cases.off ? '已通过' : '待验证'}：断开输入并正确预测、扫描</li>
                    </ul>
                    <p className="notice-text">
                      编辑或重新进入阶段会清除本次验证，旧扫描不作新程序的证据。
                    </p>
                  </details>
                )}
              </>
            )}
            <details>
              <summary>这几个部分分别有什么用？</summary>
              {objects.map((o) => (
                <button className="knowledge-link" key={o.name} onClick={() => setTopic(o.topic)}>
                  {o.name}：查看用途与例子 →
                </button>
              ))}
            </details>
          </aside>
          <section className="lesson-practice" aria-label="本阶段操作区">
            {phase === 0 ? (
              <>
                <div className="lesson-objects" aria-label="认识四个对象">
                  {objects.map((o, i) => (
                    <button
                      key={o.name}
                      aria-pressed={object === i}
                      onClick={() => {
                        setObject(i);
                        setSeen((v) => (v.includes(i) ? v : [...v, i]));
                      }}
                    >
                      <LearningSymbol kind={(['input', 'contact', 'coil', 'lamp'] as const)[i]} />
                      <strong>{o.name}</strong>
                      <small>{seen.includes(i) ? '已查看' : '点击认识'}</small>
                    </button>
                  ))}
                </div>
                <article className="object-explanation">
                  <h2>{objects[object].name}有什么用？</h2>
                  <p>{objects[object].text}</p>
                  <button onClick={() => setTopic(objects[object].topic)}>
                    展开用途、区别和例子
                  </button>
                </article>
                <p className="lesson-reading-progress" role="status">
                  已认识 {seen.length}/4 个对象。
                  {seen.length < 4
                    ? '亮灯按钮已默认展开；继续点击其余对象，全部看完后出现习题。'
                    : '四项已看完，请完成下面的理解题。'}
                </p>
                {seen.length === 4 && (
                  <fieldset className="lesson-question">
                    <legend>想一想：常开触点负责什么？</legend>
                    {[
                      ['read', '读取按钮，判断它是否接通'],
                      ['write', '直接给输入变量写TRUE'],
                      ['light', '不经过程序就让灯一直亮'],
                    ].map(([value, label]) => (
                      <label key={value}>
                        <input
                          type="radio"
                          name="object-question"
                          value={value}
                          checked={answer === value}
                          onChange={() => setAnswer(value)}
                        />
                        {label}
                      </label>
                    ))}
                    {answer && (
                      <p role="status">
                        {answer === 'read'
                          ? '理解正确：触点读条件，线圈写结果。'
                          : '再想一下：输入提供消息，触点只读不写，输出线圈才把结果写给灯。'}
                      </p>
                    )}
                    <p>已认识 {seen.length}/4 个对象。四个都看过并答对，再观察真实运行。</p>
                  </fieldset>
                )}
              </>
            ) : (
              <>
                <section
                  className="lesson-simulator"
                  aria-label="按钮与实际扫描"
                  hidden={phase === 2 || (phase > 1 && checked !== program)}
                >
                  {phase === 1 && (
                    <div className="lesson-demo">
                      <h2>这条线路已经搭好，先观察</h2>
                      <div className="demo-rung" aria-label="常开按钮接普通线圈示例">
                        <span
                          className={simulator.state.scan.scanCount && sampled ? 'energized' : ''}
                        >
                          <LearningSymbol kind="contact" />
                          <small>常开 · 读SIM_IN_00</small>
                        </span>
                        <b>→</b>
                        <span className={output ? 'energized' : ''}>
                          <LearningSymbol kind="coil" />
                          <small>普通线圈 · 写SIM_OUT_00</small>
                        </span>
                      </div>
                      <p className="demo-caption">常开读取按钮，线圈写入灯；高亮来自实际扫描。</p>
                    </div>
                  )}
                  <div className="lesson-input-output">
                    <div>
                      <span>① 待采样输入</span>
                      <button
                        id="lesson-input"
                        role="switch"
                        aria-label="亮灯按钮"
                        aria-checked={input}
                        onClick={() => {
                          simulator.setInput('input:I-00', !input);
                          setGuess(null);
                        }}
                        className={input ? 'is-on' : ''}
                      >
                        亮灯按钮 · {input ? '接通 TRUE' : '断开 FALSE'}
                      </button>
                      <small>SIM_IN_00 · 不是直接控制灯</small>
                    </div>
                    <span aria-hidden="true">→</span>
                    <div
                      className={`lesson-lamp ${output ? 'lit' : ''}`}
                      role="img"
                      aria-label={`指示灯${simulator.state.scan.scanCount ? (output ? '亮' : '灭') : '尚未扫描'}`}
                    >
                      <LearningSymbol kind="lamp" />
                      <strong>
                        ④ 指示灯：
                        {simulator.state.scan.scanCount ? (output ? '亮' : '灭') : '尚未扫描'}
                      </strong>
                      <small>SIM_OUT_00 = {output ? 'TRUE' : 'FALSE'}</small>
                    </div>
                  </div>
                  <fieldset id="lesson-predict" className="lesson-prediction">
                    <legend>② 先预测：按当前输入，下一次扫描后灯会怎样？</legend>
                    <button aria-pressed={guess === true} onClick={() => setGuess(true)}>
                      我预测：灯会亮
                    </button>
                    <button aria-pressed={guess === false} onClick={() => setGuess(false)}>
                      我预测：灯会灭
                    </button>
                    <button className="button primary" onClick={scan}>
                      预测后单步扫描
                    </button>
                  </fieldset>
                  <div className="lesson-live" aria-label="实际执行链">
                    <strong>③ 最后实际扫描 #{simulator.state.scan.scanCount}</strong>
                    <p>
                      {simulator.state.scan.scanCount
                        ? `采样输入 ${sampled ? 'TRUE' : 'FALSE'} → 通路${simulator.state.scan.traces[0]?.result ? '成立' : '不成立'} → 写出 ${output ? 'TRUE' : 'FALSE'} → 灯${output ? '亮' : '灭'}`
                        : '尚未扫描。选好预测，按一次扫描，程序才读取输入并写出结果。'}
                    </p>
                    {input !== sampled && <p>输入已改变，等待下一次扫描；灯仍保留上次结果。</p>}
                  </div>
                  {feedback && (
                    <p className="lesson-feedback" role="status">
                      {feedback}
                    </p>
                  )}
                  <details>
                    <summary>单步、运行、停止和复位有什么区别？</summary>
                    <p>
                      本课先用单步：一次读取、判断、写出，推进200ms教学逻辑时间。连续运行自动重复；停止保留最后输出；复位初始化运行值但保留程序。
                    </p>
                    {['step', 'run', 'stop', 'resetRuntime'].map((t) => (
                      <button className="knowledge-link" key={t} onClick={() => setTopic(t)}>
                        {
                          {
                            step: '单步扫描',
                            run: '连续运行',
                            stop: '停止运行',
                            resetRuntime: '复位运行状态',
                          }[t]
                        }
                        用途 →
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        simulator.reset();
                        setCases({ on: false, off: false });
                        setPending(null);
                        setGuess(null);
                        setFeedback('运行已复位，程序保留。重新设置输入并验证两种情况。');
                      }}
                    >
                      复位运行状态（保留程序）
                    </button>
                  </details>
                </section>
                {phase !== 1 && (
                  <div className="lesson-editor-wrap">
                    {checked !== program && (
                      <p className="lesson-build-intro">
                        {phase === 2
                          ? '本阶段专注搭建：放好触点和线圈、绑定变量，再检查结构，即可进入补全练习。'
                          : '先完成这一条线路并点击“检查结构”，按钮、预测和扫描区会随后出现。当前阶段只用触点、线圈和两个变量。'}
                      </p>
                    )}
                    <div className="lesson-edit-actions">
                      <button
                        disabled={!undo.length}
                        onClick={() => {
                          const previous = undo.at(-1)!;
                          setUndo((u) => u.slice(0, -1));
                          setRedo((r) => [...r, program]);
                          replace(previous, false);
                        }}
                      >
                        撤销本次编辑
                      </button>
                      <button
                        disabled={!redo.length}
                        onClick={() => {
                          const next = redo.at(-1)!;
                          setRedo((r) => r.slice(0, -1));
                          setUndo((u) => [...u, program]);
                          replace(next, false);
                        }}
                      >
                        重做本次编辑
                      </button>
                      <button onClick={exportProgram}>导出本阶段程序</button>
                      <button onClick={() => setResetPrompt(true)}>重新开始本阶段（先备份）</button>
                    </div>
                    <LadderEditor
                      key={phase}
                      compact
                      program={program}
                      onAction={edit}
                      running={false}
                      traces={simulator.state.scan.traces}
                      onEditorState={setEditor}
                      onCheck={() => {
                        setChecked(program);
                        setFeedback(
                          lampProblem(program, phase === 5) ??
                            (phase === 2
                              ? '结构与本课要求符合，可以直接进入补全程序。'
                              : '结构与本课要求符合。保持默认FALSE先预测并扫描，再接通验证。'),
                        );
                      }}
                      runtimeControls={null}
                    />
                    {phase === 2 && feedback && (
                      <p className="lesson-feedback" role="status">
                        {feedback}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
        <footer className="lesson-next">
          <button
            className="button secondary"
            disabled={phase === 0}
            onClick={() => changePhase(phase - 1)}
          >
            上一个阶段
          </button>
          {phase < 5 ? (
            <button
              id="lesson-next"
              className="button primary"
              disabled={!ready}
              onClick={() => changePhase(phase + 1)}
            >
              进入下一阶段：{learningPhases[phase + 1]} →
            </button>
          ) : (
            <button
              id="lesson-next"
              disabled={!ready}
              className="button primary"
              onClick={() => {
                setProgress((old) => ({ ...old, finished: true }));
                onWorkbench('starter-stop');
              }}
            >
              完成第一课，进入停止条件 →
            </button>
          )}
          <p>
            {ready
              ? '已达到本阶段操作检查。请试着用自己的话解释原因。'
              : phase === 0
                ? '先认识四个对象并回答问题。'
                : phase === 2
                  ? '完成触点与线圈绑定并检查结构，即可继续。'
                  : '先完成当前线路，保持默认断开先预测并扫描，再接通验证。'}
          </p>
        </footer>
        {ready && phase === 5 && (
          <section className="lesson-finish">
            <h2>你已经让同一盏灯遵守两种规则</h2>
            <p>
              请不看说明回答：常开和常闭各判断什么？为什么换一个触点就改变了灯的行为？如果停止后改输入，灯为什么暂时不变？
            </p>
            <p>
              操作检查通过不等于已掌握。请把最困惑的一步告诉我，我们先修好第一课，再推广其余实验。
            </p>
          </section>
        )}
      </main>
      <GuideHighlight
        target={active ? target : null}
        showCallout={false}
        missingText="操作目标当前未显示或不在视野内。请在当前学习任务中点“定位当前操作”；如需选择变量，先点选对应元件展开属性。"
      />
      {topic && (
        <Modal
          title="知识工具箱 · 就近理解这个部分"
          className="foundation-modal"
          onClose={() => setTopic(null)}
        >
          <KnowledgeLibrary initialTopic={topic} />
        </Modal>
      )}
      {resetPrompt && (
        <Modal
          title="先保留程序，再重新开始？"
          onClose={() => setResetPrompt(false)}
          footer={
            <>
              <button onClick={() => setResetPrompt(false)}>取消，保留当前练习</button>
              <button
                onClick={() => {
                  if (loaded.recovery && !allowSave) {
                    downloadText(loaded.recovery, 'PLC-教学原始记录.txt');
                    setAllowSave(true);
                  } else exportProgram();
                  replace(phaseProgram(phase));
                  setResetPrompt(false);
                }}
              >
                导出备份并重新开始本阶段
              </button>
            </>
          }
        >
          <p>
            只替换当前阶段的教学草稿。原实验和其他阶段保留；本次验证会清除。将先下载备份，也可在本页撤销恢复。只想回顾可用“上一个阶段”，无需清空。
          </p>
        </Modal>
      )}
    </div>
  );
}
