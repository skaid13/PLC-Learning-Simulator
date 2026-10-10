import type { Experiment } from '../types';
import { Icon } from './Icon';

function StaticDisplay({ isLed }: { isLed: boolean }) {
  return (
    <svg
      className="static-display"
      viewBox="0 0 260 180"
      role="img"
      aria-label={isLed ? '未通电的 LED 数码管静态占位' : '实验装置静态占位'}
    >
      <rect x="12" y="12" width="236" height="156" rx="10" fill="#f5f7f6" stroke="#dbe3df" />
      {[
        [23, 23],
        [237, 23],
        [23, 157],
        [237, 157],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} stroke="#b9c6c0">
          <circle cx={x} cy={y} r="3" fill="none" />
          <path d={`M${x - 2} ${y}h4`} />
        </g>
      ))}
      {isLed ? (
        <g transform="translate(93 29)">
          <rect x="-11" y="-3" width="96" height="126" rx="5" fill="#e9eeeb" />
          <g fill="#d0dad4">
            <path d="m9 6 5-5h39l5 5-5 5H14Z" />
            <path d="m61 9 5 5v35l-5 6-5-6V14Z" />
            <path d="m61 63 5 5v35l-5 6-5-6V68Z" />
            <path d="m9 112 5-5h39l5 5-5 5H14Z" />
            <path d="m6 63 5 5v35l-5 6-5-6V68Z" />
            <path d="m6 9 5 5v35l-5 6-5-6V14Z" />
            <path d="m9 59 5-5h39l5 5-5 5H14Z" />
            <circle cx="76" cy="112" r="5" />
          </g>
          <g fill="#86988c" fontSize="8" fontFamily="monospace">
            <text x="30" y="-7">
              A
            </text>
            <text x="73" y="37">
              B
            </text>
            <text x="73" y="89">
              C
            </text>
            <text x="30" y="130">
              D
            </text>
            <text x="-12" y="89">
              E
            </text>
            <text x="-12" y="37">
              F
            </text>
            <text x="30" y="49">
              G
            </text>
            <text x="86" y="115">
              H
            </text>
          </g>
        </g>
      ) : (
        <g stroke="#b7c6bd" fill="none" strokeWidth="2">
          <rect x="84" y="44" width="92" height="73" rx="5" />
          <path d="M97 62h20m-20 12h42m-42 12h20M84 98h92M106 117v17m24-17v17m24-17v17" />
          <circle cx="158" cy="62" r="5" />
        </g>
      )}
    </svg>
  );
}

export function SimulationPlaceholder({
  experiment,
  onExplain,
  onDetails,
}: {
  experiment: Experiment;
  onExplain: () => void;
  onDetails: () => void;
}) {
  return (
    <aside className="panel simulation-panel" aria-label="实验仿真区">
      <div className="panel-heading">
        <div className="heading-label">
          <Icon name="monitor" />
          <h2>实验仿真</h2>
        </div>
        <span className="subtle-label">静态占位</span>
      </div>
      <div className="simulation-content">
        <div className="apparatus-heading">
          <span className="eyebrow">EXPERIMENT {experiment.number}</span>
          <h3>{experiment.shortName}</h3>
          <p>虚拟实验箱 · 仿真尚未开放</p>
        </div>
        <div className="apparatus">
          <div className="apparatus-title">
            <span>BDT-PLC-A</span>
            <span>装置占位图</span>
          </div>
          <StaticDisplay isLed={experiment.id === 'led'} />
          <div className="apparatus-footer">
            <span className="status-dot muted" />
            等待后续阶段接入程序
          </div>
        </div>
        <div className="io-summary">
          <span>指导书 I/O</span>
          <span>
            <b>{experiment.inputs.length}</b> 输入 <i /> <b>{experiment.outputs.length}</b> 输出
          </span>
        </div>
        <div className="simulation-message">
          <Icon name="info" size={17} />
          <p>这里将呈现你编写的程序的运行结果。当前画面不会响应输入，也不代表真实运行状态。</p>
        </div>
        <button className="button secondary full" onClick={onDetails}>
          查看实验要求与 I/O
          <Icon name="arrow" size={14} />
        </button>
        <section className="explain-card">
          <div className="explain-icon">
            <Icon name="light" size={21} />
          </div>
          <h4>不只观察，更要理解</h4>
          <p>未来你可以选择一个输出，追溯它与梯形图之间的逻辑关系。</p>
          <button className="button explain-button full" onClick={onExplain}>
            <Icon name="light" size={16} />
            为什么这样运行？
            <Icon name="arrow" size={14} />
          </button>
          <span>动态逻辑解释 · 后续阶段开放</span>
        </section>
      </div>
      <div className="panel-bottom-note">
        <Icon name="lock" size={14} />
        <span>教学仿真用途 · 不连接真实 PLC</span>
      </div>
    </aside>
  );
}
