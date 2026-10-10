import type { KeyboardEvent } from 'react';
import type { BoolVariable, LadderInstruction, LadderNetwork } from '../types';
import {
  instructionNames,
  MAX_CONTACTS,
  type EditorSelection,
  type EditorTool,
} from '../editor/model';
import type { NetworkTrace } from '../engine/scan';

interface Props {
  network: LadderNetwork;
  index: number;
  count: number;
  variables: BoolVariable[];
  selection: EditorSelection | null;
  tool: EditorTool;
  running: boolean;
  trace?: NetworkTrace;
  onSelect: (instructionId: string | null) => void;
  onPlace: (slot: 'contact' | 'coil') => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}

function activate(event: KeyboardEvent<SVGGElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

export function LadderNetworkView({
  network,
  index,
  count,
  variables,
  selection,
  tool,
  running,
  trace,
  onSelect,
  onPlace,
  onDelete,
  onMove,
}: Props) {
  const selectedNetwork = selection?.networkId === network.id;
  const renderInstruction = (
    instruction: LadderInstruction | null,
    x: number,
    slot: 'contact' | 'coil',
    slotIndex = 0,
  ) => {
    const selected =
      selectedNetwork && instruction !== null && selection?.instructionId === instruction.id;
    const variable = variables.find((item) => item.id === instruction?.variableId);
    const available = slot === 'coil' || slotIndex === network.contacts.length;
    const name = instruction
      ? instruction.kind === 'coil'
        ? '输出线圈'
        : instructionNames[instruction.contactType]
      : slot === 'coil'
        ? '线圈'
        : `触点 ${slotIndex + 1}`;
    const label = instruction
      ? `网络 ${index + 1} ${name} ${variable?.name ?? '未绑定变量'}${instruction.kind === 'contact' ? ` 位置 ${slotIndex + 1}` : ''}`
      : `网络 ${index + 1} 放置${name}`;
    const action = () => (instruction ? onSelect(instruction.id) : onPlace(slot));
    const ready =
      slot === 'coil'
        ? tool === 'coil'
        : (tool === 'normallyOpen' || tool === 'normallyClosed') && available;
    const contactTrace = trace?.contacts.find((item) => item.instructionId === instruction?.id);
    const path = instruction?.kind === 'coil' ? trace?.result : contactTrace?.path;
    return (
      <g
        key={instruction?.id ?? `${slot}-${slotIndex}`}
        role="button"
        tabIndex={instruction || (available && !running) ? 0 : -1}
        aria-label={label}
        aria-pressed={instruction ? selected : undefined}
        aria-disabled={!instruction && (!available || running) ? true : undefined}
        className={`ladder-cell ${path === true ? 'path-true' : path === false ? 'path-false' : ''} ${selected ? 'is-selected' : ''} ${!instruction ? 'is-empty' : ''} ${!available && !instruction ? 'is-future' : ''}`}
        onClick={available || instruction ? action : undefined}
        onKeyDown={available || instruction ? (event) => activate(event, action) : undefined}
      >
        {instruction && trace && (
          <title>
            {instruction.kind === 'coil'
              ? `最后扫描线圈：${path ? 'TRUE' : 'FALSE'}`
              : `读取值：${contactTrace?.value ? 'TRUE' : 'FALSE'}；触点条件：${contactTrace?.condition ? '成立' : '不成立'}；串联通路：${path ? '成立' : '不成立'}`}
          </title>
        )}
        <rect x={x - 46} y="25" width="92" height="119" rx="7" className="cell-background" />
        {instruction ? (
          <>
            <text
              x={x}
              y="43"
              textAnchor="middle"
              className={`diagram-variable ${!variable ? 'unbound' : ''}`}
            >
              {variable?.name ?? '未选择变量'}
            </text>
            <path
              d={`M${x - 46} 77H${x - (instruction.kind === 'contact' ? 12 : 14.5)}M${x + (instruction.kind === 'contact' ? 12 : 14.5)} 77H${x + 46}`}
              className="diagram-wire"
            />
            {instruction.kind === 'contact' ? (
              <g className="diagram-symbol">
                <path d={`M${x - 12} 63V91M${x + 12} 63V91`} />
                {instruction.contactType === 'normallyClosed' && (
                  <path d={`M${x - 17} 93L${x + 17} 61`} />
                )}
              </g>
            ) : (
              <g className="diagram-symbol">
                <path
                  d={`M${x - 7} 60Q${x - 22} 77 ${x - 7} 94M${x + 7} 60Q${x + 22} 77 ${x + 7} 94`}
                />
              </g>
            )}
            <text x={x} y="115" textAnchor="middle" className="diagram-description">
              {variable ? (variable.terminal ?? '内部变量') : '点击设置'}
            </text>
          </>
        ) : (
          <>
            <path d={`M${x - 46} 77H${x + 46}`} className="diagram-wire" />
            <rect
              x={x - 28}
              y="94"
              width="56"
              height="28"
              rx="5"
              className={`slot-outline ${ready ? 'ready' : ''}`}
            />
            <text x={x} y="114" textAnchor="middle" className="slot-plus">
              {available ? '+' : '·'}
            </text>
            <text x={x} y="138" textAnchor="middle" className="diagram-description">
              {slot === 'coil' ? '末端线圈' : available ? '添加触点' : '顺序添加'}
            </text>
          </>
        )}
      </g>
    );
  };
  return (
    <section
      className={`network-card ${selectedNetwork ? 'is-selected' : ''}`}
      aria-label={`网络 ${index + 1}`}
    >
      <div className="network-heading">
        <button
          className="network-select"
          aria-pressed={selectedNetwork && !selection?.instructionId}
          onClick={() => onSelect(null)}
        >
          网络 {String(index + 1).padStart(2, '0')}
        </button>
        <span className="network-name" title={network.name}>
          {network.name || '未命名网络'}
        </span>
        {trace && (
          <span className={`network-result ${trace.result ? 'is-true' : ''}`}>
            {trace.result ? 'TRUE' : 'FALSE'}
          </span>
        )}
        <div className="network-actions">
          <button
            aria-label={`上移网络 ${index + 1}`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            aria-label={`下移网络 ${index + 1}`}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </button>
          <button
            aria-label={`删除网络 ${index + 1}`}
            disabled={count === 1}
            title={count === 1 ? '至少保留一个网络；可以单独删除元件' : '删除此网络前需确认'}
            onClick={onDelete}
          >
            删除
          </button>
        </div>
      </div>
      <div className="diagram-viewport">
        <svg
          viewBox="0 0 700 150"
          className="network-diagram"
          role="group"
          aria-label={`网络 ${index + 1} 梯形图`}
        >
          <path d="M30 18V137M670 18V137" className="diagram-rail" />
          <path d="M30 77H670" className="diagram-wire" />
          <text x="12" y="81" className="rail-index">
            {String(index + 1).padStart(2, '0')}
          </text>
          {Array.from({ length: MAX_CONTACTS }, (_, i) =>
            renderInstruction(network.contacts[i] ?? null, 96 + i * 115, 'contact', i),
          )}
          {renderInstruction(network.coil, 604, 'coil')}
        </svg>
      </div>
    </section>
  );
}
