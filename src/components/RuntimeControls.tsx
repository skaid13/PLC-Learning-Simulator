import type { Simulator } from '../engine/useSimulator';
import { statusNames } from '../engine/runtime';
import { Icon } from './Icon';

export function RuntimeControls({
  simulator,
  onNew,
}: {
  simulator: Simulator;
  onNew?: () => void;
}) {
  const { state, start, stop, step, reset } = simulator;
  const running = state.status === 'running';
  return (
    <section className="runtime-controls" aria-label="运行控制">
      <div className="execution-toolbar">
        <div>
          <button data-guide="run" className="run-button" disabled={running} onClick={start}>
            <Icon name="play" size={14} />
            运行
          </button>
          <button data-guide="stop" disabled={!running} onClick={stop}>
            <Icon name="stop" size={14} />
            停止
          </button>
          <button data-guide="step" disabled={running} onClick={step}>
            单步扫描
          </button>
          <button data-guide="reset" onClick={() => reset()}>
            <Icon name="reset" size={14} />
            复位
          </button>
        </div>
        <span>
          <span className={`status-dot ${running ? '' : 'muted'}`} />
          {statusNames[state.status]}
        </span>
      </div>
      <div className="scan-summary" aria-label="扫描状态">
        <strong>扫描 {state.scan.scanCount} 次</strong>
        <span>名义间隔 200 ms · 教学简化</span>
      </div>
      <label className="speed-control">
        仿真速度
        <select
          aria-label="仿真速度"
          value={simulator.speed}
          onChange={(e) => simulator.setSpeed(Number(e.target.value))}
        >
          {[1, 5, 20].map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
        <span>每次扫描逻辑时间 200 ms</span>
      </label>
      <p className="runtime-guidance">
        {running
          ? '正在连续扫描。修改输入，观察下次扫描的变量变化；先停止才能编辑程序。'
          : state.status === 'stopped'
            ? '已保留最后扫描结果。输入变化将在下一次单步或运行时采样；编辑程序会自动复位。'
            : '设置右侧虚拟输入，再运行或单步扫描。复位重置输入、输出、定时/计数和装置；数值变量恢复定义初值，保留梯形图。'}
      </p>
      <details className="runtime-help">
        <summary>运行、停止、复位、重建有什么不同？</summary>
        <dl>
          <dt>编辑程序</dt>
          <dd>选择工具、放置元件、绑定变量。编辑会重置运行状态；运行时先停止才能编辑。</dd>
          <dt>设置输入</dt>
          <dd>
            右侧开关是待采样值，扫描后才参与判断。自动传感器由装置反馈，关闭自动后才能手动模拟。
          </dd>
          <dt>单步扫描</dt>
          <dd>执行一次，逻辑时间推进 200 ms，随后停止。适合看清因果。</dd>
          <dt>连续运行</dt>
          <dd>周期性扫描，装置由实际输出驱动；速度只改变墙上等待时间，每次逻辑时间仍为 200 ms。</dd>
          <dt>停止</dt>
          <dd>暂停扫描，保留最后输出、计时、装置位置和程序。它不保证把输出关断。</dd>
          <dt>复位</dt>
          <dd>
            停止扫描，重置输入、布尔值、定时/计数、装置和故障注入；数值变量回到定义初值。程序与教学进度保留。
          </dd>
          <dt>重建空白程序</dt>
          <dd>替换当前实验程序，需要先导出备份并确认，可撤销；不是运行复位。</dd>
        </dl>
        {onNew && (
          <button disabled={running} className="button secondary" onClick={onNew}>
            重建空白程序（先备份）
          </button>
        )}
      </details>
      {state.issues.length > 0 && (
        <div role="alert" className="runtime-error">
          <strong>无法运行：请先修正程序结构。</strong>
          <ul>
            {state.issues.map((issue, index) => (
              <li key={index}>{issue.message}</li>
            ))}
          </ul>
          <p>点击“检查结构”可定位问题。</p>
        </div>
      )}
    </section>
  );
}
