import type { Simulator } from '../engine/useSimulator';
import { statusNames } from '../engine/runtime';
import { Icon } from './Icon';

export function RuntimeControls({ simulator }: { simulator: Simulator }) {
  const { state, start, stop, step, reset } = simulator;
  const running = state.status === 'running';
  return (
    <section className="runtime-controls" aria-label="运行控制">
      <div className="execution-toolbar">
        <div>
          <button className="run-button" disabled={running} onClick={start}>
            <Icon name="play" size={14} />
            运行
          </button>
          <button disabled={!running} onClick={stop}>
            <Icon name="stop" size={14} />
            停止
          </button>
          <button disabled={running} onClick={step}>
            单步扫描
          </button>
          <button onClick={() => reset()}>
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
      <p className="runtime-guidance">
        {running
          ? '正在连续扫描。修改输入，观察下次扫描的变量变化；先停止才能编辑程序。'
          : state.status === 'stopped'
            ? '已保留最后扫描结果。输入变化将在下一次单步或运行时采样；编辑程序会自动复位。'
            : '设置右侧虚拟输入，再运行或单步扫描。复位会清零所有值，保留梯形图。'}
      </p>
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
