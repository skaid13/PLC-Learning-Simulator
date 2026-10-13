import { experiments } from '../data/experiments';
import type { Experiment, LearningMode } from '../types';
import { Icon } from './Icon';
import { version } from '../../package.json';

interface Props {
  experiment: Experiment;
  mode: LearningMode;
  onExperimentChange: (id: string) => void;
  onModeChange: (mode: LearningMode) => void;
}

export function Header({ experiment, mode, onExperimentChange, onModeChange }: Props) {
  return (
    <>
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Icon name="chip" size={25} />
          </div>
          <div>
            <h1>PLC 实验教学与仿真系统</h1>
            <span>
              PLC LEARNING LAB <i /> 从认识到实践
            </span>
          </div>
        </div>
        <div className="mode-switch" role="group" aria-label="学习模式">
          <button
            className={mode === 'teaching' ? 'active' : ''}
            aria-pressed={mode === 'teaching'}
            onClick={() => onModeChange('teaching')}
          >
            <Icon name="book" size={16} />
            教学模式
          </button>
          <button
            className={mode === 'free' ? 'active' : ''}
            aria-pressed={mode === 'free'}
            onClick={() => onModeChange('free')}
          >
            <Icon name="grid" size={16} />
            自由模式
          </button>
        </div>
        <div className="local-indicator">
          <span className="status-dot" />
          本地学习工作台<span className="version">v{version}</span>
        </div>
      </header>
      <section className="experiment-bar" aria-label="实验选择区">
        <div className="experiment-picker">
          <label htmlFor="experiment-select">当前实验</label>
          <select
            id="experiment-select"
            value={experiment.id}
            onChange={(e) => onExperimentChange(e.target.value)}
          >
            {experiments.map((item) => (
              <option key={item.id} value={item.id}>
                实验 {item.number} · {item.name}
              </option>
            ))}
          </select>
        </div>
        <span className="separator" />
        <span className="hardware">
          <Icon name="chip" size={15} />
          参考设备 <strong>Rockwell 2080-LC50-24QVB</strong>
        </span>
        <span className="phase-tag">11 项实验 · 教学仿真</span>
      </section>
    </>
  );
}
