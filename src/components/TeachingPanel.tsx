import { useEffect, useState, type ReactNode } from 'react';
import { ExperimentLesson } from './ExperimentLesson';
import { BeginnerHome, StarterLesson } from './BeginnerHome';
import type { Experiment, LearningMode, ProgramWorkspace } from '../types';
import type { GuideTarget } from './GuideHighlight';
interface Props {
  program: ProgramWorkspace;
  onTarget: (target: GuideTarget | null) => void;
  guide?: ReactNode;
  mode: LearningMode;
  experiment: Experiment;
  onShowDetails: () => void;
  onStartLearning: () => void;
  onProject: (id: string) => void;
  onFoundation: () => void;
}
export function TeachingPanel({
  program,
  onTarget,
  guide,
  mode,
  experiment,
  onShowDetails,
  onStartLearning,
  onProject,
  onFoundation,
}: Props) {
  const [view, setView] = useState<'home' | 'course' | 'starter'>('home');
  useEffect(() => {
    setView((previous) =>
      experiment.id.startsWith('starter-')
        ? 'starter'
        : previous === 'starter'
          ? 'course'
          : previous,
    );
  }, [experiment.id]);
  const openProject = (id: string) => {
    onStartLearning();
    onProject(id);
    setView('starter');
  };
  if (mode === 'teaching' && experiment.id.startsWith('starter-') && view !== 'home')
    return <StarterLesson id={experiment.id} guide={guide} onHome={() => setView('home')} />;
  if (mode === 'teaching' && view === 'course' && !experiment.id.startsWith('starter-'))
    return (
      <ExperimentLesson
        key={experiment.id}
        program={program}
        onTarget={onTarget}
        guide={guide}
        experiment={experiment}
        onFoundation={() => setView('home')}
        onDetails={onShowDetails}
      />
    );
  return (
    <aside className="panel teaching-panel" aria-label="教学指导区">
      <div className="panel-heading">
        <h2>学习路线</h2>
        <span className="subtle-label">理解 → 动手 → 验证</span>
      </div>
      {mode === 'free' ? (
        <div className="free-content">
          <h3>按自己的节奏探索</h3>
          <p>教学模式与自由模式共用当前程序。切换模式不会清空工作区。</p>
          <button className="button secondary full" onClick={onShowDetails}>
            查看当前实验要求
          </button>
          <button className="text-button" onClick={onStartLearning}>
            回到 PLC 入门教学
          </button>
        </div>
      ) : (
        <>
          <BeginnerHome onProject={openProject} onFoundation={onFoundation} />
          <button
            className="lesson-course-button"
            onClick={() => {
              setView(experiment.id.startsWith('starter-') ? 'starter' : 'course');
              onStartLearning();
            }}
          >
            学习当前实验：{experiment.shortName} →
          </button>
          <details className="foundation-guide">
            <summary>已了解基础？直接练当前输入与输出</summary>
            {guide}
          </details>
        </>
      )}
    </aside>
  );
}
