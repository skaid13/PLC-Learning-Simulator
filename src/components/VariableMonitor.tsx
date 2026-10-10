import { sensorTerminals } from '../simulation/plant';
import type { Simulator } from '../engine/useSimulator';

export function VariableMonitor({ simulator }: { simulator: Simulator }) {
  const { state, setInput } = simulator;
  return (
    <section className="variable-monitor" aria-label="变量调试">
      <div className="monitor-heading">
        <h3>变量调试</h3>
        <span>最后扫描值</span>
      </div>
      <p>
        输入开关表示待采样值。自动传感器启用时，位置和液位输入由装置在下一扫描采样；关闭后可手动操作。TRUE
        / FALSE 是教学布尔状态。
      </p>
      <div className="monitor-inputs" role="group" aria-label="虚拟输入">
        {state.program.variables
          .filter((variable) => variable.kind === 'input')
          .map((variable) => (
            <label className="input-row" key={variable.id}>
              <span>
                <code>{variable.name}</code>
                <small>
                  {variable.description} · {variable.terminal}
                </small>
              </span>
              <input
                disabled={
                  state.autoSensors &&
                  (sensorTerminals[state.program.experimentId] ?? []).some(
                    (n) => variable.terminal === `I-${String(n).padStart(2, '0')}`,
                  )
                }
                type="checkbox"
                role="switch"
                aria-label={`虚拟输入 ${variable.name} ${variable.description}`}
                checked={state.inputs[variable.id] === true}
                onChange={(event) => setInput(variable.id, event.target.checked)}
              />
            </label>
          ))}
      </div>
      <div className="monitor-table-scroll">
        <table>
          <caption>变量值（扫描 {state.scan.scanCount} 次）</caption>
          <thead>
            <tr>
              <th scope="col">变量 / 含义</th>
              <th scope="col">类型</th>
              <th scope="col">值</th>
            </tr>
          </thead>
          <tbody>
            {state.program.variables.map((variable) => {
              const value = state.scan.values[variable.id];
              return (
                <tr key={variable.id}>
                  <th scope="row">
                    <code>{variable.name}</code>
                    <small>{variable.description}</small>
                  </th>
                  <td>{{ input: '输入', output: '输出', internal: '内部' }[variable.kind]}</td>
                  <td>
                    <span className={`bool-value ${value === true ? 'is-true' : ''}`}>
                      {typeof value === 'number' ? value : value ? 'TRUE' : 'FALSE'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="monitor-note">
        触点绿色表示该处串联通路成立；灰色表示不成立。停止后保留最后高亮，复位清除。切换实验停止并复位；切换模式保留运行。
      </p>
    </section>
  );
}
