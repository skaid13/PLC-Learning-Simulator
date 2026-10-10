import { useState } from 'react';
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

export default function App() {
  const [experimentId, setExperimentId] = useState(experiments[0].id);
  const [mode, setMode] = useState<LearningMode>('teaching');
  const [step, setStep] = useState(0);
  const [modal, setModal] = useState<'explain' | 'details' | null>(null);
  const [programs, setPrograms] = useState<Record<string, ProgramWorkspace>>(() => ({
    [experiments[0].id]: createWorkspace(experiments[0]),
  }));
  const experiment = experiments.find((item) => item.id === experimentId) ?? experiments[0];
  const program = programs[experiment.id];
  const changeExperiment = (id: string) => {
    const next = experiments.find((item) => item.id === id);
    if (!next) return;
    setPrograms((previous) =>
      previous[id] ? previous : { ...previous, [id]: createWorkspace(next) },
    );
    setExperimentId(id);
  };
  const editCurrentProgram = (action: EditorAction) =>
    setPrograms((previous) => ({
      ...previous,
      [experiment.id]: editProgram(previous[experiment.id], action),
    }));

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
        <div className="workspace-grid">
          <TeachingPanel
            mode={mode}
            experiment={experiment}
            step={step}
            onStepChange={setStep}
            onShowDetails={() => setModal('details')}
            onStartLearning={() => setMode('teaching')}
          />
          <LadderEditor key={experiment.id} program={program} onAction={editCurrentProgram} />
          <SimulationPlaceholder
            experiment={experiment}
            onExplain={() => setModal('explain')}
            onDetails={() => setModal('details')}
          />
        </div>
        <div className="workspace-footnote">
          <span>
            <Icon name="info" size={14} />
            第二阶段：基础梯形图编辑。各实验工作区保留在当前网页内，刷新会丢失。
          </span>
          <span>学习 · 编程 · 观察 · 理解</span>
        </div>
      </main>
      <footer className="status-bar">
        <div>
          <span className="status-dot muted" />
          <strong>未运行</strong>
          <span className="footer-divider" />
          <span>可编辑 · 执行引擎尚未开放</span>
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
