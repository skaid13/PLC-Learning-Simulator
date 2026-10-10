import type { Experiment } from '../types';
import type { Simulator } from '../engine/useSimulator';
import { Icon } from './Icon';
import { PlantDrawing } from './PlantDrawing';
import { VariableMonitor } from './VariableMonitor';
import { curriculum } from '../data/curriculum';
import { sensorTerminals } from '../simulation/plant';
export function SimulationPanel({
  experiment,
  simulator,
  onExplain,
  onDetails,
}: {
  experiment: Experiment;
  simulator: Simulator;
  onExplain: (id?: string) => void;
  onDetails: () => void;
}) {
  const { state, setSetting } = simulator;
  return (
    <aside className="panel simulation-panel" aria-label="实验仿真区">
      <div className="panel-heading">
        <div className="heading-label">
          <Icon name="monitor" />
          <h2>实验仿真</h2>
        </div>
        <span className="subtle-label">输出驱动</span>
      </div>
      <div className="simulation-content">
        <div className="apparatus-heading">
          <span className="eyebrow">EXPERIMENT {experiment.number}</span>
          <h3>{experiment.shortName}</h3>
          <p>扫描 → 输出 → 装置 → 反馈</p>
        </div>
        <PlantDrawing simulator={simulator} />
        <div className="plant-status">
          逻辑时间 {((state.scan.elapsedMs ?? 0) / 1000).toFixed(1)} s ·{' '}
          {state.status === 'running'
            ? '连续运行'
            : state.status === 'idle'
              ? '等待程序'
              : '保留最后状态'}
        </div>
        <div className="output-lights" aria-label="输出对象">
          {state.program.variables
            .filter((v) => v.kind === 'output')
            .map((v) => (
              <button
                key={v.id}
                className={state.scan.values[v.id] === true ? 'on' : ''}
                onClick={() => onExplain(v.id)}
                title="查看实际执行条件"
              >
                <span className="lamp" />
                {v.description}
                <small>{v.terminal}</small>
              </button>
            ))}
        </div>
        {!!sensorTerminals[experiment.id] && (
          <label className="plant-setting">
            <input
              type="checkbox"
              checked={state.autoSensors}
              onChange={(e) => setSetting('autoSensors', e.target.checked)}
            />
            自动位置 / 液位传感器
          </label>
        )}
        <details className="fault-controls">
          <summary>故障注入与教学设定</summary>
          <label className="plant-setting">
            <input
              type="checkbox"
              checked={state.stalled}
              onChange={(e) => setSetting('stalled', e.target.checked)}
            />
            执行器卡滞（冻结物理变化）
          </label>
          {!!sensorTerminals[experiment.id] && (
            <label className="plant-setting">
              <input
                type="checkbox"
                checked={state.stuckSensors}
                onChange={(e) => setSetting('stuckSensors', e.target.checked)}
              />
              冻结自动传感器采样值
            </label>
          )}
          <p>{curriculum[experiment.id].assumptions}</p>
          <p>复位会解除注入、重置装置和运行值；保留程序及数值变量定义的初值。</p>
        </details>
        {state.plant.alerts.length > 0 && (
          <div className="plant-alert" role="status">
            {state.plant.alerts.map((a) => (
              <p key={a}>{a}</p>
            ))}
          </div>
        )}
        <button className="button secondary full" onClick={onDetails}>
          查看实验要求与 I/O
          <Icon name="arrow" size={14} />
        </button>
        <VariableMonitor simulator={simulator} />
        <section className="explain-card">
          <div className="explain-icon">
            <Icon name="light" size={21} />
          </div>
          <h4>从结果追溯条件</h4>
          <p>点击输出对象，查看最后一次扫描的输入条件、定时或计数和写入顺序。</p>
          <button className="button explain-button full" onClick={() => onExplain()}>
            为什么这样运行？
            <Icon name="arrow" size={14} />
          </button>
        </section>
      </div>
      <div className="panel-bottom-note">
        <Icon name="lock" size={14} />
        <span>教学模型 · 不连接实体 PLC</span>
      </div>
    </aside>
  );
}
