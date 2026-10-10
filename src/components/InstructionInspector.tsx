import type { BoolVariable, LadderInstruction, LadderNetwork } from '../types';
import { instructionNames, type EditorAction } from '../editor/model';
import { Icon } from './Icon';

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
        <Icon name="info" size={16} />
        <p>点击网络名称可命名网络；点击元件可设置变量和编辑类型。</p>
      </section>
    );
  const variable = variables.find((item) => item.id === instruction?.variableId);
  const eligible = variables.filter(
    (item) => instruction?.kind !== 'coil' || item.kind !== 'input',
  );
  const name = instruction
    ? instruction.kind === 'coil'
      ? '输出线圈'
      : instructionNames[instruction.contactType]
    : '网络属性';
  const index = network.contacts.findIndex((item) => item.id === instruction?.id);
  return (
    <section className="inspector" aria-label="元件属性">
      <div className="inspector-heading">
        <strong>{name}</strong>
        <span>{instruction ? '已选中 · 修改即时生效' : '为网络添加易读的说明'}</span>
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
            placeholder="例如：启动条件"
            onChange={(event) =>
              onAction({ type: 'renameNetwork', networkId: network.id, name: event.target.value })
            }
          />
        </label>
      ) : (
        <>
          <div className="inspector-fields">
            {instruction.kind === 'contact' && (
              <label className="inspector-field">
                触点类型
                <select
                  value={instruction.contactType}
                  onChange={(event) =>
                    onAction({
                      type: 'changeContactType',
                      networkId: network.id,
                      instructionId: instruction.id,
                      contactType:
                        event.target.value === 'normallyOpen' ? 'normallyOpen' : 'normallyClosed',
                    })
                  }
                >
                  <option value="normallyOpen">常开触点</option>
                  <option value="normallyClosed">常闭触点</option>
                </select>
              </label>
            )}
            <label className="inspector-field variable-field">
              元件变量
              <select
                value={instruction.variableId ?? ''}
                onChange={(event) =>
                  onAction({
                    type: 'setVariable',
                    networkId: network.id,
                    instructionId: instruction.id,
                    variableId: event.target.value || null,
                  })
                }
              >
                <option value="">请选择变量</option>
                {(['input', 'output', 'internal'] as const).map((kind) => {
                  const items = eligible.filter((item) => item.kind === kind);
                  return items.length ? (
                    <optgroup
                      key={kind}
                      label={{ input: '输入变量', output: '输出变量', internal: '内部变量' }[kind]}
                    >
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.description}
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })}
              </select>
            </label>
          </div>
          <div className="inspector-description">
            <p>
              {variable
                ? `${variable.description} · ${variable.terminal ? `对应指导书端子 ${variable.terminal}` : '内部布尔标志，无实体端子'}`
                : '新元件尚未绑定变量，请在上方选择。'}
              <br />
              {instruction.kind === 'coil'
                ? '教学规则：线圈只能写输出或内部变量，不能写输入。'
                : instruction.contactType === 'normallyOpen'
                  ? '教学规则：该变量为 TRUE 时，常开触点条件成立。'
                  : '教学规则：该变量为 FALSE 时，常闭触点条件成立；这不是按钮物理接线状态。'}
            </p>
            {instruction.kind === 'contact' && (
              <div className="contact-order">
                <button
                  disabled={index === 0}
                  onClick={() =>
                    onAction({
                      type: 'moveContact',
                      networkId: network.id,
                      instructionId: instruction.id,
                      direction: -1,
                    })
                  }
                  aria-label="左移选中触点"
                >
                  ←
                </button>
                <button
                  disabled={index === network.contacts.length - 1}
                  onClick={() =>
                    onAction({
                      type: 'moveContact',
                      networkId: network.id,
                      instructionId: instruction.id,
                      direction: 1,
                    })
                  }
                  aria-label="右移选中触点"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
