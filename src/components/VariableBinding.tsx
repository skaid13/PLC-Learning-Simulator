import { useEffect, useState } from 'react';
import type { BoolVariable, LadderInstruction } from '../types';
import { newId, type EditorAction } from '../editor/model';

export function VariableBinding({
  instruction,
  networkId,
  variables,
  onAction,
  inline = false,
  disabled = false,
}: {
  instruction: LadderInstruction;
  networkId: string;
  variables: BoolVariable[];
  onAction: (action: EditorAction) => void;
  inline?: boolean;
  disabled?: boolean;
}) {
  const numeric =
    instruction.kind === 'contact'
      ? !!instruction.comparison
      : ['move', 'add'].includes(instruction.operation ?? 'coil');
  const eligible = variables.filter(
    (v) =>
      (instruction.kind !== 'coil' || v.kind !== 'input') && (v.dataType === 'number') === numeric,
  );
  const current = variables.find((v) => v.id === instruction.variableId);
  const [name, setName] = useState(current?.name ?? '');
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    setName(current?.name ?? '');
    setMessage('');
  }, [current?.id, current?.name]);
  const error = (value: string, except?: string) =>
    !value.trim()
      ? '名称不能为空。'
      : variables.some((v) => v.id !== except && v.name === value.trim())
        ? '已有同名变量，请选择复用或换一个名称。'
        : '';
  const rename = () => {
    if (disabled || !current || name === current.name) return;
    const problem = error(name, current.id);
    if (problem) {
      setMessage(problem);
      return;
    }
    onAction({ type: 'updateVariable', variableId: current.id, patch: { name: name.trim() } });
    setMessage('名称已保存，所有引用同步更新；地址和绑定保持。');
  };
  return (
    <div className="variable-binding">
      <label className="inspector-field variable-field">
        {inline ? '图上元件变量' : '元件变量'}
        <select
          aria-label={inline ? '图上元件变量' : '元件变量'}
          data-guide={inline ? 'inline-variable' : 'variable'}
          value={instruction.variableId ?? ''}
          disabled={disabled}
          onChange={(e) =>
            onAction({
              type: 'setVariable',
              networkId,
              instructionId: instruction.id,
              variableId: e.target.value || null,
            })
          }
        >
          <option value="">请选择变量</option>
          {(['input', 'output', 'internal'] as const).map((kind) => (
            <optgroup
              key={kind}
              label={
                { input: '输入变量', output: '输出变量', internal: '内部变量（可重复调用）' }[kind]
              }
            >
              {eligible
                .filter((v) => v.kind === kind)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.description}
                    {v.terminal ? ` · ${v.terminal}` : ''}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      {current && (
        <div className="variable-name-edit">
          <label className="inspector-field">
            变量名称
            <input
              aria-label={inline ? '图上变量名称' : '选中变量名称'}
              value={name}
              maxLength={40}
              disabled={disabled}
              onChange={(e) => setName(e.target.value)}
              onBlur={rename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  rename();
                }
              }}
            />
          </label>
          <button type="button" disabled={disabled} onClick={rename}>
            保存名称
          </button>
          <small>
            {current.terminal ? `固定端子 ${current.terminal}` : '内部变量，无实体端子'} ·
            改名同步所有引用
          </small>
        </div>
      )}
      <details className="create-variable">
        <summary>新建内部变量并绑定</summary>
        <label className="inspector-field">
          新变量名称
          <input
            aria-label={inline ? '图上新变量名称' : '新变量名称'}
            value={newName}
            maxLength={40}
            disabled={disabled}
            onChange={(e) => setNewName(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={disabled || variables.length >= 500}
          onClick={() => {
            const problem = error(newName);
            if (problem) {
              setMessage(problem);
              return;
            }
            onAction({
              type: 'createAndBindVariable',
              networkId,
              instructionId: instruction.id,
              variable: {
                id: newId(),
                name: newName.trim(),
                description: '自定义教学变量',
                kind: 'internal',
                dataType: numeric ? 'number' : 'boolean',
                initialValue: 0,
              },
            });
            setNewName('');
            setMessage('已创建并绑定；其他元件可从内部变量中再次选择。');
          }}
        >
          创建{numeric ? '数值' : '布尔'}变量并绑定
        </button>
      </details>
      {message && (
        <p role={message.includes('不能为空') || message.includes('同名') ? 'alert' : 'status'}>
          {message}
        </p>
      )}
    </div>
  );
}
