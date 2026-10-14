import { ExecutionExplanation } from './components/ExecutionExplanation';
import { FoundationCourse } from './components/FoundationCourse';
import { useState, type CSSProperties } from 'react';
import { GuidedPractice } from './components/GuidedPractice';
import { GuideHighlight, type GuideTarget } from './components/GuideHighlight';
import type { EditorSnapshot } from './teaching/guide';
import { downloadText } from './storage/projects';
import type { ScanState } from './engine/scan';
import { loadProjects, saveProjects } from './storage/projects';
import { ProjectToolbar } from './components/ProjectToolbar';
import { allExperiments as experiments } from './data/catalog';
import type { LearningMode, ProgramWorkspace } from './types';
import { Header } from './components/Header';
import { TeachingPanel } from './components/TeachingPanel';
import { LadderEditor } from './components/LadderEditor';
import { createWorkspace, editProgram, type EditorAction } from './editor/model';
import { SimulationPanel } from './components/SimulationPanel';
import { createReferenceProgram } from './data/referencePrograms';
import { curriculum } from './data/curriculum';
import { ExperimentDetails } from './components/ExperimentDetails';
import { Modal } from './components/Modal';
import { Icon } from './components/Icon';
import { useSimulator } from './engine/useSimulator';
import { statusNames } from './engine/runtime';
import { RuntimeControls } from './components/RuntimeControls';

export default function App() {
  const [experimentId, setExperimentId] = useState(experiments[0].id);
  const [mode, setMode] = useState<LearningMode>('teaching');
  const [editorSnapshot, setEditorSnapshot] = useState<EditorSnapshot>({
    tool: 'select',
    selection: null,
  });
  const [checkedProgram, setCheckedProgram] = useState<ProgramWorkspace>();
  const [guideTarget, setGuideTarget] = useState<GuideTarget | null>(null);
  const [explanationScan, setExplanationScan] = useState<ScanState>();
  const [blankPractice, setBlankPractice] = useState(false);
  const [editorWidth, setEditorWidth] = useState(1.92);
  const [modal, setModal] = useState<'explain' | 'details' | 'foundation' | null>(null);
  const [loaded] = useState(() => loadProjects(window.localStorage));
  const [saveMessage, setSaveMessage] = useState(loaded.message);
  const [locate, setLocate] = useState<
    { networkId: string; instructionId: string; request: number } | undefined
  >();
  const [pendingReference, setPendingReference] = useState<ProgramWorkspace | null>(null);
  const [explainTarget, setExplainTarget] = useState<string | undefined>();
  const [pendingImport, setPendingImport] = useState<ProgramWorkspace | null>(null);
  const [history, setHistory] = useState<
    Record<string, { past: ProgramWorkspace[]; future: ProgramWorkspace[] }>
  >({});
  const [programs, setPrograms] = useState<Record<string, ProgramWorkspace>>(() => ({
    ...loaded.programs,
    [experiments[0].id]: loaded.programs[experiments[0].id] ?? createWorkspace(experiments[0]),
  }));
  const experiment = experiments.find((item) => item.id === experimentId) ?? experiments[0];
  const program = programs[experiment.id];
  const simulator = useSimulator(program);
  const changeExperiment = (id: string) => {
    const next = experiments.find((item) => item.id === id);
    if (!next) return;
    if (id === experimentId) return;
    const nextProgram = programs[id] ?? createWorkspace(next);
    setPrograms((previous) => ({ ...previous, [id]: nextProgram }));
    simulator.reset(nextProgram);
    setLocate(undefined);
    setExperimentId(id);
    setExplanationScan(undefined);
    setCheckedProgram(undefined);
    setEditorSnapshot({ tool: 'select', selection: null, actionCount: 0 });
  };
  const replaceProgram = (nextProgram: ProgramWorkspace, record = true) => {
    if (simulator.state.status === 'running') return;
    if (record && programs[nextProgram.experimentId])
      setHistory((h) => ({
        ...h,
        [nextProgram.experimentId]: {
          past: [
            ...(h[nextProgram.experimentId]?.past ?? []),
            programs[nextProgram.experimentId],
          ].slice(-50),
          future: [],
        },
      }));
    const next = { ...programs, [nextProgram.experimentId]: nextProgram };
    setPrograms(next);
    setSaveMessage(saveProjects(window.localStorage, next));
    if (nextProgram.experimentId !== experiment.id) setExperimentId(nextProgram.experimentId);
    simulator.reset(nextProgram);
  };
  const editCurrentProgram = (action: EditorAction) => {
    if (simulator.state.status === 'running') return;
    const nextProgram = editProgram(program, action);
    if (nextProgram !== program) replaceProgram(nextProgram);
  };
  const travelHistory = (direction: 'past' | 'future') => {
    const h = history[experiment.id] ?? { past: [], future: [] };
    const source = h[direction];
    const target = source.at(-1);
    if (!target) return;
    setHistory((previous) => ({
      ...previous,
      [experiment.id]:
        direction === 'past'
          ? { past: h.past.slice(0, -1), future: [...h.future, program] }
          : { past: [...h.past, program], future: h.future.slice(0, -1) },
    }));
    replaceProgram(target, false);
  };

  return (
    <div className="app-shell">
      <Header
        experiment={experiment}
        mode={mode}
        onExperimentChange={changeExperiment}
        onModeChange={setMode}
      />
      <main className="main-content">
        <div className="workspace-heading">
          <div>
            <div className="workspace-eyebrow">
              <span />
              学习工作台<span className="slash">/</span>
              <span>{mode === 'teaching' ? '基础入门' : '自由练习'}</span>
            </div>
            <h2>
              {mode === 'teaching' ? '理解每一步，掌握每一次控制。' : '自由探索你的控制思路。'}
            </h2>
          </div>
          <div className="workspace-learning-actions">
            <button className="manual-button" onClick={() => setModal('foundation')}>
              <Icon name="book" size={17} />
              文字基础课堂
            </button>
            <button className="manual-button" onClick={() => setModal('details')}>
              <Icon name="book" size={17} />
              实验指导书摘要
              <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>
        <ProjectToolbar
          program={program}
          running={simulator.state.status === 'running'}
          canUndo={!!history[experiment.id]?.past.length}
          canRedo={!!history[experiment.id]?.future.length}
          message={saveMessage}
          recovery={loaded.recovery}
          onUndo={() => travelHistory('past')}
          onRedo={() => travelHistory('future')}
          onSave={() => setSaveMessage(saveProjects(window.localStorage, programs))}
          onMessage={setSaveMessage}
          onImport={setPendingImport}
          onReference={() => setPendingReference(createReferenceProgram(experiment))}
        />
        <label className="layout-control">
          编辑区宽度
          <input
            type="range"
            min="1.2"
            max="3.4"
            step="0.1"
            value={editorWidth}
            onChange={(e) => setEditorWidth(Number(e.target.value))}
          />
          <span>窄屏自动堆叠</span>
        </label>
        <div
          className="workspace-grid"
          style={{ '--editor-width': `${editorWidth}fr` } as CSSProperties}
        >
          <TeachingPanel
            program={program}
            onTarget={setGuideTarget}
            guide={
              <GuidedPractice
                key={experiment.id}
                enabled={mode === 'teaching'}
                context={{
                  program,
                  runtime: simulator.state,
                  editor: editorSnapshot,
                  checkedProgram,
                  explanationScan,
                }}
                onTarget={setGuideTarget}
                onBlank={() => setBlankPractice(true)}
              />
            }
            mode={mode}
            experiment={experiment}
            onProject={changeExperiment}
            onFoundation={() => setModal('foundation')}
            onShowDetails={() => setModal('details')}
            onStartLearning={() => setMode('teaching')}
          />
          <LadderEditor
            onEditorState={setEditorSnapshot}
            onCheck={() => setCheckedProgram(program)}
            key={experiment.id}
            program={program}
            onAction={editCurrentProgram}
            running={simulator.state.status === 'running'}
            traces={simulator.state.scan.traces}
            locate={locate}
            runtimeControls={
              <RuntimeControls simulator={simulator} onNew={() => setBlankPractice(true)} />
            }
          />
          <SimulationPanel
            experiment={experiment}
            simulator={simulator}
            onExplain={(id) => {
              setExplanationScan(simulator.state.scan);
              setExplainTarget(id);
              setModal('explain');
            }}
            onDetails={() => setModal('details')}
          />
        </div>
        <div className="workspace-footnote">
          <span>
            <Icon name="info" size={14} />
            草稿自动保存在当前浏览器。跨电脑或浏览器使用时，请导出 JSON。
          </span>
          <span>学习 · 编程 · 观察 · 理解</span>
        </div>
      </main>
      <footer className="status-bar">
        <div>
          <span className={`status-dot ${simulator.state.status === 'running' ? '' : 'muted'}`} />
          <strong>{statusNames[simulator.state.status]}</strong>
          <span className="footer-divider" />
          <span>
            {simulator.state.status === 'running' ? '扫描中 · 编辑已锁定' : '可编辑'} · 扫描{' '}
            {simulator.state.scan.scanCount} 次
          </span>
        </div>
        <div>
          <span>
            实验 {experiment.number} · {experiment.shortName}
          </span>
          <span className="footer-divider" />
          <span>{mode === 'teaching' ? '教学模式' : '自由模式'}</span>
          <span className="footer-divider" />
          <span>教学简化系统</span>
        </div>
      </footer>
      <GuideHighlight target={guideTarget} />
      {blankPractice && (
        <Modal
          title="备份后建立空白练习？"
          onClose={() => setBlankPractice(false)}
          footer={
            <>
              <button className="button secondary" onClick={() => setBlankPractice(false)}>
                取消，保留当前程序
              </button>
              <button
                className="button primary"
                disabled={simulator.state.status === 'running'}
                onClick={() => {
                  downloadText(
                    JSON.stringify(program, null, 2),
                    `PLC-${experiment.id}-练习前备份.json`,
                  );
                  replaceProgram(createWorkspace(experiment));
                  setBlankPractice(false);
                }}
              >
                导出备份并建立空白练习
              </button>
            </>
          }
        >
          <p>
            将下载当前程序
            JSON，再替换为本实验空白工作区。请保留下载文件；替换可撤销恢复。其他实验草稿不变，引导进度不会被清除。只想重新看提示时请选择“重新开始引导”，无需清空程序。
          </p>
        </Modal>
      )}
      {pendingReference && (
        <Modal
          title="教学参考程序"
          onClose={() => setPendingReference(null)}
          footer={
            <>
              <button className="button secondary" onClick={() => setPendingReference(null)}>
                继续自己编程
              </button>
              <button
                className="button primary"
                disabled={simulator.state.status === 'running'}
                onClick={() => {
                  replaceProgram(pendingReference);
                  setPendingReference(null);
                }}
              >
                载入参考程序
              </button>
            </>
          }
        >
          <p>{curriculum[experiment.id].principle}</p>
          <p>
            共 {pendingReference.networks.length}{' '}
            个可编辑网络。载入会替换当前草稿，可撤销恢复。先导出可保存一份独立备份。
          </p>
          <details>
            <summary>展开参考网络顺序</summary>
            <ol>
              {pendingReference.networks.map((n) => (
                <li key={n.id}>{n.name}</li>
              ))}
            </ol>
          </details>
          <div className="tip">
            <p>{curriculum[experiment.id].assumptions}</p>
          </div>
          <p>这是根据指导书要求独立编写的教学程序，不是官方软件工程。</p>
        </Modal>
      )}
      {pendingImport && (
        <Modal
          title="载入导入程序？"
          onClose={() => setPendingImport(null)}
          footer={
            <>
              <button onClick={() => setPendingImport(null)}>取消</button>
              <button
                disabled={simulator.state.status === 'running'}
                onClick={() => {
                  replaceProgram(pendingImport);
                  setPendingImport(null);
                }}
              >
                确认载入
              </button>
            </>
          }
        >
          <p>
            将载入“{experiments.find((e) => e.id === pendingImport.experimentId)?.name}
            ”的程序，替换该实验草稿。当前实验的替换可以撤销；其他实验的草稿保留。建议先导出备份。
          </p>
        </Modal>
      )}
      {modal === 'foundation' && (
        <FoundationCourse
          onClose={() => setModal(null)}
          onProject={(id) => {
            changeExperiment(id);
            setMode('teaching');
            setModal(null);
          }}
        />
      )}
      {modal && modal !== 'foundation' && (
        <Modal
          title={modal === 'explain' ? '为什么这样运行？' : '实验指导书摘要'}
          onClose={() => setModal(null)}
        >
          {modal === 'explain' ? (
            <ExecutionExplanation
              simulator={simulator}
              target={explainTarget}
              onLocate={(networkId, instructionId) => {
                setLocate({ networkId, instructionId, request: Date.now() });
                setModal(null);
              }}
            />
          ) : (
            <ExperimentDetails experiment={experiment} />
          )}
        </Modal>
      )}
    </div>
  );
}
