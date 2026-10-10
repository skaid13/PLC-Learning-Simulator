import { useState, type CSSProperties } from 'react';
import { loadProjects, saveProjects } from './storage/projects';
import { ProjectToolbar } from './components/ProjectToolbar';
import { experiments } from './data/experiments';
import type { LearningMode, ProgramWorkspace } from './types';
import { Header } from './components/Header';
import { TeachingPanel } from './components/TeachingPanel';
import { LadderEditor } from './components/LadderEditor';
import { createWorkspace, editProgram, type EditorAction } from './editor/model';
import { SimulationPlaceholder } from './components/SimulationPlaceholder';
import { ExperimentDetails } from './components/ExperimentDetails';
import { Modal } from './components/Modal';
import { Icon } from './components/Icon';
import { useSimulator } from './engine/useSimulator';
import { statusNames } from './engine/runtime';
import { RuntimeControls } from './components/RuntimeControls';
import { VariableMonitor } from './components/VariableMonitor';

export default function App() {
  const [experimentId, setExperimentId] = useState(experiments[0].id);
  const [mode, setMode] = useState<LearningMode>('teaching');
  const [step, setStep] = useState(0);
  const [editorWidth, setEditorWidth] = useState(1.92);
  const [modal, setModal] = useState<'explain' | 'details' | null>(null);
  const [loaded] = useState(() => loadProjects(window.localStorage));
  const [saveMessage, setSaveMessage] = useState(loaded.message);
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
    setExperimentId(id);
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
          <button className="manual-button" onClick={() => setModal('details')}>
            <Icon name="book" size={17} />
            实验指导书摘要
            <Icon name="arrow" size={14} />
          </button>
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
          onReference={() => setSaveMessage('参考程序正在接入；当前草稿已保留。')}
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
            mode={mode}
            experiment={experiment}
            step={step}
            onStepChange={setStep}
            onShowDetails={() => setModal('details')}
            onStartLearning={() => setMode('teaching')}
          />
          <LadderEditor
            key={experiment.id}
            program={program}
            onAction={editCurrentProgram}
            running={simulator.state.status === 'running'}
            traces={simulator.state.scan.traces}
            runtimeControls={<RuntimeControls simulator={simulator} />}
          />
          <SimulationPlaceholder
            experiment={experiment}
            onExplain={() => setModal('explain')}
            onDetails={() => setModal('details')}
            monitor={<VariableMonitor simulator={simulator} />}
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
      {pendingImport && (
        <Modal
          title="载入导入程序？"
          onClose={() => setPendingImport(null)}
          footer={
            <>
              <button onClick={() => setPendingImport(null)}>取消</button>
              <button
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
      {modal && (
        <Modal
          title={modal === 'explain' ? '为什么这样运行？' : '实验指导书摘要'}
          onClose={() => setModal(null)}
        >
          {modal === 'explain' ? (
            <div className="explanation-placeholder">
              <div className="empty-icon">
                <Icon name="light" size={28} />
              </div>
              <p>动态逻辑解释功能将在后续阶段开放。</p>
            </div>
          ) : (
            <ExperimentDetails experiment={experiment} />
          )}
        </Modal>
      )}
    </div>
  );
}
