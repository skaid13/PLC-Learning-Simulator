import { VariableManager } from './VariableManager';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ProgramWorkspace, LadderNetwork } from '../types';
import {
  createNetwork,
  cloneNetwork,
  allContacts,
  instructionNames,
  newId,
  type EditorAction,
  type EditorSelection,
  type EditorTool,
} from '../editor/model';
import { validateProgram, type ProgramIssue } from '../editor/validation';
import { Icon } from './Icon';
import { LadderNetworkView } from './LadderNetworkView';
import { InstructionInspector } from './InstructionInspector';
import { Modal } from './Modal';
import type { NetworkTrace } from '../engine/scan';

export function LadderEditor({
  program,
  onAction,
  running,
  traces,
  runtimeControls,
  locate,
}: {
  program: ProgramWorkspace;
  onAction: (action: EditorAction) => void;
  running: boolean;
  traces: NetworkTrace[];
  runtimeControls: ReactNode;
  locate?: { networkId: string; instructionId: string; request: number };
}) {
  const [clipboard, setClipboard] = useState<LadderNetwork | null>(null);
  const [tool, setTool] = useState<EditorTool>('select');
  const [selection, setSelection] = useState<EditorSelection | null>(null);
  const [message, setMessage] = useState('先选择一种元件工具，再点击网络中的＋空位放置。');
  const [showIssues, setShowIssues] = useState(false);
  const [deleteNetworkId, setDeleteNetworkId] = useState<string | null>(null);
  const networkRefs = useRef(new Map<string, HTMLDivElement>());
  useEffect(() => {
    if (!locate || !program.networks.some((n) => n.id === locate.networkId)) return;
    setSelection({ networkId: locate.networkId, instructionId: locate.instructionId });
    setTool('select');
    setMessage('已定位输出的实际写入网络。');
    networkRefs.current
      .get(locate.networkId)
      ?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }, [locate, program.experimentId]);
  const selectedNetwork = program.networks.find((item) => item.id === selection?.networkId);
  const selectedInstruction =
    (selectedNetwork &&
      allContacts(selectedNetwork).find((item) => item.id === selection?.instructionId)) ??
    (selectedNetwork?.coil?.id === selection?.instructionId ? selectedNetwork?.coil : undefined);
  const issues = validateProgram(program);
  const errors = issues.filter((item) => item.severity === 'error').length;
  const warnings = issues.length - errors;
  const instructionCount = program.networks.reduce(
    (sum, item) => sum + allContacts(item).length + (item.coil ? 1 : 0),
    0,
  );
  const select = (networkId: string, instructionId: string | null) => {
    setSelection({ networkId, instructionId });
    setTool('select');
    setMessage(
      instructionId
        ? '已选中元件，在下方设置变量、修改类型或删除。'
        : '已选中网络，可在下方修改名称。',
    );
  };
  const place = (networkId: string, slot: 'contact' | 'coil', branch = 0) => {
    if (running) {
      setMessage('请先停止运行，再放置或修改元件。');
      return;
    }
    if (slot === 'contact' && (tool === 'normallyOpen' || tool === 'normallyClosed')) {
      const id = newId();
      onAction({
        type: 'addContact',
        networkId,
        contact: { id, kind: 'contact', contactType: tool, variableId: null },
        branch,
      });
      setSelection({ networkId, instructionId: id });
      setMessage(`已放置${instructionNames[tool]}，请在下方选择变量。`);
    } else if (slot === 'coil' && tool === 'coil') {
      const id = newId();
      onAction({ type: 'addCoil', networkId, instructionId: id });
      setSelection({ networkId, instructionId: id });
      setMessage('已放置输出线圈，请在下方选择输出或内部变量。');
    } else
      setMessage(
        tool === 'select'
          ? '请先选择常开触点、常闭触点或输出线圈工具，再点击对应空位。'
          : slot === 'contact'
            ? '线圈请放在网络最右侧的“末端线圈”位置。'
            : '触点请放在网络左侧的“添加触点”位置。',
      );
  };
  const locateIssue = (issue: ProgramIssue) => {
    if (!issue.networkId) return;
    setSelection({ networkId: issue.networkId, instructionId: issue.instructionId });
    setTool('select');
    networkRefs.current
      .get(issue.networkId)
      ?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  };
  return (
    <section className="panel ladder-panel live-editor" aria-label="梯形图编程区">
      <div className="panel-heading">
        <div className="heading-label">
          <Icon name="branch" />
          <h2>梯形图编程</h2>
        </div>
        <span className="small-badge">基础串联 · LD</span>
      </div>
      <div className="editor-tab">
        <span className="status-dot" />
        <strong>{program.name}</strong>
        <span className="editor-tab-label">
          {program.networks.length} 个网络 · {instructionCount} 个元件
        </span>
        <span className="memory-note">刷新会丢失</span>
      </div>
      <fieldset disabled={running} className="editor-fieldset">
        <div className="ladder-tools" role="group" aria-label="绘图工具">
          {(['select', 'normallyOpen', 'normallyClosed', 'coil'] as const).map((item) => (
            <button
              key={item}
              aria-pressed={tool === item}
              className={tool === item ? 'active' : ''}
              onClick={() => {
                setTool(item);
                setMessage(
                  item === 'select'
                    ? '点击网络名称或元件进行选择。'
                    : `已选择${instructionNames[item]}，点击对应的＋空位放置。`,
                );
              }}
            >
              <span aria-hidden="true">
                {
                  { select: '↖', normallyOpen: '─| |─', normallyClosed: '─|/|─', coil: '─( )─' }[
                    item
                  ]
                }
              </span>
              {item === 'select' ? '选择' : instructionNames[item]}
            </button>
          ))}
        </div>
        <div className="editing-guidance" role="status" aria-label="编辑提示">
          <Icon name="info" size={15} />
          <span>{message}</span>
        </div>
        <div className="network-list" aria-label="梯形图网络列表">
          {program.networks.map((network, index) => (
            <div
              key={network.id}
              ref={(element) => {
                if (element) networkRefs.current.set(network.id, element);
                else networkRefs.current.delete(network.id);
              }}
            >
              <LadderNetworkView
                network={network}
                index={index}
                count={program.networks.length}
                variables={program.variables}
                selection={selection}
                tool={tool}
                running={running}
                trace={traces.find((trace) => trace.networkId === network.id)}
                onSelect={(instructionId) => select(network.id, instructionId)}
                onPlace={(slot, branch) => place(network.id, slot, branch)}
                onAddBranch={() => onAction({ type: 'addBranch', networkId: network.id })}
                onDeleteBranch={(branch) =>
                  onAction({ type: 'deleteBranch', networkId: network.id, branch })
                }
                onDelete={() => setDeleteNetworkId(network.id)}
                onMove={(direction) =>
                  onAction({ type: 'moveNetwork', networkId: network.id, direction })
                }
              />
            </div>
          ))}
        </div>
        <div className="editor-management">
          <button
            className="button secondary"
            onClick={() => {
              const network = createNetwork();
              onAction({ type: 'addNetwork', network });
              setSelection({ networkId: network.id, instructionId: null });
              setMessage('已添加空网络。可先命名，再选择工具放置元件。');
            }}
          >
            ＋ 添加网络
          </button>
          <button
            className="button secondary"
            disabled={!selectedNetwork}
            onClick={() => {
              if (selectedNetwork) {
                setClipboard(cloneNetwork(selectedNetwork));
                setMessage('已复制选中网络，变量引用保持不变。');
              }
            }}
          >
            复制网络
          </button>
          <button
            className="button secondary"
            disabled={!clipboard || program.networks.length >= 500}
            onClick={() => {
              if (clipboard) {
                const copied = cloneNetwork(clipboard);
                onAction({ type: 'addNetwork', network: copied });
                setSelection({ networkId: copied.id, instructionId: null });
                setMessage('已粘贴网络。普通线圈重复写同一变量会被结构检查拦截，请重新绑定目标。');
              }
            }}
          >
            粘贴网络
          </button>
          <span>每支路最多 4 个触点 · 支路之间并联</span>
          <button className="button secondary" onClick={() => setShowIssues(true)}>
            <Icon name="check" size={14} />
            检查结构
          </button>
        </div>
        <p className="diagram-scroll-hint">窄屏可在梯形图内横向滚动，查看末端线圈。</p>
        <div className="variable-actions">
          {(['boolean', 'number'] as const).map((dataType) => (
            <button
              key={dataType}
              onClick={() => {
                const count = program.variables.filter(
                  (v) => (v.dataType ?? 'boolean') === dataType && v.kind === 'internal',
                ).length;
                onAction({
                  type: 'addVariable',
                  variable: {
                    id: newId(),
                    name: `SIM_${dataType === 'number' ? 'N' : 'M'}_${String(count).padStart(2, '0')}`,
                    kind: 'internal',
                    description: '自定义教学变量',
                    dataType,
                    initialValue: 0,
                  },
                });
              }}
            >
              ＋ {dataType === 'number' ? '数值' : '布尔'}变量
            </button>
          ))}
        </div>
        <VariableManager program={program} onAction={onAction} />
        <InstructionInspector
          network={selectedNetwork}
          instruction={selectedInstruction ?? undefined}
          variables={program.variables}
          onAction={onAction}
          onDeleteInstruction={() => {
            if (!selection?.instructionId) return;
            onAction({
              type: 'deleteInstruction',
              networkId: selection.networkId,
              instructionId: selection.instructionId,
            });
            setSelection({ networkId: selection.networkId, instructionId: null });
            setMessage('元件已删除。其余触点保持从左到右的串联顺序。');
          }}
        />
      </fieldset>
      {showIssues && (
        <section className="program-diagnostics" aria-label="结构检查结果">
          <div className="diagnostics-heading">
            <strong>
              结构检查：{errors} 项错误 · {warnings} 项提示
            </strong>
            <button className="text-button" onClick={() => setShowIssues(false)}>
              收起
            </button>
          </div>
          {issues.length ? (
            <ul>
              {issues.map((issue, index) => (
                <li key={`${issue.code}-${index}`} className={issue.severity}>
                  <button onClick={() => locateIssue(issue)}>
                    {issue.severity === 'error' ? '错误' : '提示'} · {issue.message}
                    <span>定位 →</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="structure-valid">基础结构检查通过。不能据此判定实验控制逻辑正确。</p>
          )}
        </section>
      )}
      <div className="variable-convention">
        <Icon name="info" size={14} />
        <p>SIM_* 是本仿真器自定义的教学变量；I-xx / O-xx 仅为指导书端子标记，不是官方编程地址。</p>
      </div>
      {runtimeControls}
      <div className="editor-notice">
        <Icon name="lock" size={15} />
        <p>本软件的指令和变量为教学简化实现，不生成可下载到真实 PLC 的工程文件。</p>
      </div>
      {deleteNetworkId && (
        <Modal
          title="删除网络？"
          onClose={() => setDeleteNetworkId(null)}
          footer={
            <>
              <button className="button secondary" onClick={() => setDeleteNetworkId(null)}>
                取消
              </button>
              <button
                className="button danger"
                onClick={() => {
                  onAction({ type: 'deleteNetwork', networkId: deleteNetworkId });
                  if (selection?.networkId === deleteNetworkId) setSelection(null);
                  setDeleteNetworkId(null);
                  setMessage('网络已删除；其余网络与元件已保留。');
                }}
              >
                确认删除网络
              </button>
            </>
          }
        >
          <p>将删除这个网络及其中的全部元件。可以通过工作台上方的撤销恢复。其它网络不会删除。</p>
        </Modal>
      )}
    </section>
  );
}
