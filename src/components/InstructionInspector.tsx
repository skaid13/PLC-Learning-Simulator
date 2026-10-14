import { InstructionHelp } from './InstructionHelp';
import type { BoolVariable, CoilInstruction, LadderInstruction, LadderNetwork } from '../types';
import { instructionNames, type EditorAction } from '../editor/model';
import { operations, operationNames } from '../editor/validation';

interface Props {
  network: LadderNetwork | undefined;
  instruction: LadderInstruction | undefined;
  variables: BoolVariable[];
  onAction: (action: EditorAction) => void;
  onDeleteInstruction: () => void;
}
export function InstructionInspector({
  network,
  instruction,
  variables,
  onAction,
  onDeleteInstruction,
}: Props) {
  if (!network)
    return (
      <section className="inspector inspector-empty" aria-label="元件属性">
        <p>点击网络名称或元件可编辑属性。</p>
      </section>
    );
  const operation = instruction?.kind === 'coil' ? (instruction.operation ?? 'coil') : 'coil';
  const needsNumber =
    instruction?.kind === 'coil'
      ? ['move', 'add'].includes(operation)
      : !!(instruction?.kind === 'contact' && instruction.comparison);
  const eligible = variables.filter(
    (v) =>
      (instruction?.kind !== 'coil' || v.kind !== 'input') &&
      (v.dataType === 'number') === needsNumber,
  );
  const variable = variables.find((v) => v.id === instruction?.variableId);
  const branch =
    [network.contacts, ...(network.branches ?? [])].find((b) =>
      b.some((i) => i.id === instruction?.id),
    ) ?? [];
  const index = branch.findIndex((i) => i.id === instruction?.id);
  const coilPatch = (patch: Partial<CoilInstruction>) =>
    onAction({ type: 'updateCoil', networkId: network.id, patch });
  const contactPatch = (patch: {
    comparison?: Extract<LadderInstruction, { kind: 'contact' }>['comparison'];
    edge?: 'rising';
  }) =>
    instruction &&
    onAction({
      type: 'updateContact',
      networkId: network.id,
      instructionId: instruction.id,
      patch,
    });
  return (
    <section className="inspector" aria-label="元件属性">
      <div className="inspector-heading">
        <strong>
          {instruction
            ? instruction.kind === 'coil'
              ? operationNames[operation]
              : instructionNames[instruction.contactType]
            : '网络属性'}
        </strong>
        <span>已选中 · 修改即时生效</span>
        {instruction && (
          <button className="delete-instruction" onClick={onDeleteInstruction}>
            删除选中元件
          </button>
        )}
      </div>
      {!instruction ? (
        <label className="inspector-field">
          网络名称
          <input
            maxLength={40}
            value={network.name}
            onChange={(e) =>
              onAction({ type: 'renameNetwork', networkId: network.id, name: e.target.value })
            }
          />
        </label>
      ) : (
        <>
          <div className="inspector-fields">
            {instruction.kind === 'contact' ? (
              <>
                <label className="inspector-field">
                  触点类型
                  <select
                    value={instruction.contactType}
                    onChange={(e) =>
                      onAction({
                        type: 'changeContactType',
                        networkId: network.id,
                        instructionId: instruction.id,
                        contactType: e.target.value as 'normallyOpen' | 'normallyClosed',
                      })
                    }
                  >
                    <option value="normallyOpen">常开触点</option>
                    <option value="normallyClosed">常闭触点</option>
                  </select>
                </label>
                <label className="inspector-field">
                  条件方式
                  <select
                    value={instruction.comparison ? 'number' : 'boolean'}
                    onChange={(e) => {
                      contactPatch({
                        comparison:
                          e.target.value === 'number' ? { operator: 'eq', value: 0 } : undefined,
                      });
                    }}
                  >
                    <option value="boolean">布尔条件</option>
                    <option value="number">数值比较</option>
                  </select>
                </label>
                {instruction.comparison && (
                  <>
                    <label className="inspector-field">
                      比较运算
                      <select
                        value={instruction.comparison.operator}
                        onChange={(e) =>
                          contactPatch({
                            comparison: {
                              ...instruction.comparison!,
                              operator: e.target.value as 'eq',
                            },
                          })
                        }
                      >
                        {(['eq', 'ne', 'gt', 'ge', 'lt', 'le'] as const).map((op, i) => (
                          <option key={op} value={op}>
                            {
                              [
                                '等于 =',
                                '不等于 ≠',
                                '大于 >',
                                '大于等于 ≥',
                                '小于 <',
                                '小于等于 ≤',
                              ][i]
                            }
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="inspector-field">
                      比较值
                      <input
                        type="number"
                        min={-1000000}
                        max={1000000}
                        value={instruction.comparison.value}
                        onChange={(e) =>
                          contactPatch({
                            comparison: {
                              ...instruction.comparison!,
                              value: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </label>
                  </>
                )}
                <label className="inspector-field">
                  边沿检测
                  <select
                    value={instruction.edge ?? ''}
                    onChange={(e) => contactPatch({ edge: e.target.value ? 'rising' : undefined })}
                  >
                    <option value="">持续条件</option>
                    <option value="rising">条件上升沿（单次扫描）</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="inspector-field">
                  执行指令
                  <select
                    data-guide="operation"
                    aria-label="执行指令"
                    value={operation}
                    onChange={(e) =>
                      coilPatch({
                        operation: e.target.value as CoilInstruction['operation'],
                        variableId: null,
                        preset: ['ctu'].includes(e.target.value)
                          ? 1
                          : ['move', 'add'].includes(e.target.value)
                            ? 0
                            : 1000,
                        sourceVariableId: undefined,
                        countVariableId: undefined,
                      })
                    }
                  >
                    {operations.map((op) => (
                      <option key={op} value={op}>
                        {operationNames[op]}
                      </option>
                    ))}
                  </select>
                </label>
                {['ton', 'tof', 'pulse', 'ctu', 'move', 'add'].includes(operation) && (
                  <label className="inspector-field">
                    {['ton', 'tof', 'pulse'].includes(operation)
                      ? '预置时间（ms）'
                      : operation === 'ctu'
                        ? '预置计数'
                        : '常数'}
                    <input
                      data-guide="preset"
                      type="number"
                      value={instruction.preset ?? 0}
                      onChange={(e) => coilPatch({ preset: Number(e.target.value) })}
                    />
                  </label>
                )}
                {['move', 'add', 'ctu', 'resetCounter'].includes(operation) && (
                  <label className="inspector-field">
                    {['move', 'add'].includes(operation)
                      ? '读取数值变量（可选）'
                      : '计数显示变量（可选）'}
                    <select
                      value={
                        (['move', 'add'].includes(operation)
                          ? instruction.sourceVariableId
                          : instruction.countVariableId) ?? ''
                      }
                      onChange={(e) =>
                        coilPatch(
                          ['move', 'add'].includes(operation)
                            ? { sourceVariableId: e.target.value || undefined }
                            : { countVariableId: e.target.value || undefined },
                        )
                      }
                    >
                      <option value="">
                        {['move', 'add'].includes(operation) ? '使用常数' : '不写显示变量'}
                      </option>
                      {variables
                        .filter((v) => v.dataType === 'number')
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} · {v.description}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </>
            )}
            <label className="inspector-field variable-field">
              元件变量
              <select
                data-guide="variable"
                aria-label="元件变量"
                value={instruction.variableId ?? ''}
                onChange={(e) =>
                  onAction({
                    type: 'setVariable',
                    networkId: network.id,
                    instructionId: instruction.id,
                    variableId: e.target.value || null,
                  })
                }
              >
                <option value="">请选择变量</option>
                {(['input', 'output', 'internal'] as const).map((kind) => {
                  const items = eligible.filter((v) => v.kind === kind);
                  return items.length ? (
                    <optgroup
                      key={kind}
                      label={{ input: '输入变量', output: '输出变量', internal: '内部变量' }[kind]}
                    >
                      {items.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} · {v.description}
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })}
              </select>
            </label>
          </div>
          <InstructionHelp instruction={instruction} />
          <div className="inspector-description">
            <p>
              {variable
                ? `${variable.description} · ${variable.terminal ?? '内部教学变量'}`
                : '请绑定与指令类型对应的变量。'}
              <br />
              {instruction.kind === 'contact'
                ? instruction.comparison
                  ? '数值比较直接使用比较运算；常开/常闭符号不反转比较结果。'
                  : '常开在 TRUE 时成立；常闭在 FALSE 时成立。上升沿只在条件由假变真时成立一次。'
                : '从上到下执行。SET / RST 保留值；TON 通路断开清零；CTU 只计算通路上升沿。详见执行规则。'}
            </p>
            {instruction.kind === 'contact' && (
              <div className="contact-order">
                {([-1, 1] as const).map((direction) => (
                  <button
                    key={direction}
                    aria-label={direction === -1 ? '左移选中触点' : '右移选中触点'}
                    disabled={direction === -1 ? index <= 0 : index === branch.length - 1}
                    onClick={() =>
                      onAction({
                        type: 'moveContact',
                        networkId: network.id,
                        instructionId: instruction.id,
                        direction,
                      })
                    }
                  >
                    {direction === -1 ? '←' : '→'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
