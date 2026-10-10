import type { ProgramWorkspace } from '../types';
import type { EditorAction } from '../editor/model';
import { allContacts } from '../editor/model';
export function VariableManager({
  program,
  onAction,
}: {
  program: ProgramWorkspace;
  onAction: (a: EditorAction) => void;
}) {
  return (
    <details className="variable-manager">
      <summary>管理内部变量（名称、说明、数值初值）</summary>
      {program.variables
        .filter((v) => v.kind === 'internal')
        .map((v) => {
          const used = program.networks.some(
            (n) =>
              allContacts(n).some((c) => c.variableId === v.id) ||
              [n.coil?.variableId, n.coil?.sourceVariableId, n.coil?.countVariableId].includes(
                v.id,
              ),
          );
          return (
            <div key={v.id} className="variable-config">
              <label>
                名称
                <input
                  aria-label={`变量名称 ${v.name}`}
                  maxLength={40}
                  value={v.name}
                  onChange={(e) =>
                    onAction({
                      type: 'updateVariable',
                      variableId: v.id,
                      patch: { name: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                说明
                <input
                  aria-label={`变量说明 ${v.name}`}
                  maxLength={100}
                  value={v.description}
                  onChange={(e) =>
                    onAction({
                      type: 'updateVariable',
                      variableId: v.id,
                      patch: { description: e.target.value },
                    })
                  }
                />
              </label>
              {v.dataType === 'number' && (
                <label>
                  复位初值
                  <input
                    type="number"
                    min={-1000000}
                    max={1000000}
                    value={v.initialValue ?? 0}
                    onChange={(e) =>
                      onAction({
                        type: 'updateVariable',
                        variableId: v.id,
                        patch: { initialValue: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              )}
              <button
                disabled={used}
                title={used ? '请先移除引用' : '移除未使用的内部变量'}
                onClick={() => onAction({ type: 'deleteVariable', variableId: v.id })}
              >
                移除
              </button>
            </div>
          );
        })}
      <p>物理 I/O 端子固定；正在被引用的变量需先解除引用。</p>
    </details>
  );
}
