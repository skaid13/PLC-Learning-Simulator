import { useState } from 'react';
import type { Simulator } from '../engine/useSimulator';

/** 只读取最近扫描轨迹；绝不据此自动判定完整实验合格。 */
export function LiveLearningFeedback({ simulator }: { simulator: Simulator }) {
  const { state } = simulator;
  const outputs = state.program.variables.filter((v) => v.kind === 'output');
  const [selected, setSelected] = useState('');
  const target = outputs.find((v) => v.id === selected) ?? outputs[0];
  const pending = state.program.variables.filter(
    (v) =>
      v.kind === 'input' && (state.inputs[v.id] === true) !== (state.scan.values[v.id] === true),
  );
  const writers = state.scan.traces.filter((t) => t.coil.variableId === target?.id);
  const lastWrite = [...writers].reverse().find((t) => t.coil.written !== false);
  const value = target && state.scan.values[target.id];
  return (
    <section className="live-learning" aria-label="输入到装置的实际反馈">
      <h4>输入 → 判断 → 输出 → 装置</h4>
      <p>
        {state.status === 'error'
          ? '下一步：停止尝试运行，按结构错误提示定位并修正程序。'
          : pending.length
            ? `有 ${pending.length} 个输入与最后采样值不同。${state.status === 'running' ? '等待下一次扫描。' : '下一步：点击单步扫描，采样这些变化。'}`
            : state.scan.scanCount === 0
              ? '下一步：检查结构，设置右侧输入，再单步扫描。未扫描前没有可解释的执行结果。'
              : state.status === 'running'
                ? '连续扫描中：观察输出与装置；要编辑程序请先停止。'
                : '当前保留最后扫描结果。可改变输入后再次单步，或点击运行连续观察。'}
      </p>
      {pending.length > 0 && (
        <p className="pending-inputs">
          待采样：
          {pending
            .map((v) => `${v.description} ${state.inputs[v.id] === true ? 'TRUE' : 'FALSE'}`)
            .join('；')}
        </p>
      )}
      {target && (
        <>
          <label>
            观察哪个输出？
            <select
              aria-label="教学反馈输出"
              value={target.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {outputs.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.description} · {v.terminal}
                </option>
              ))}
            </select>
          </label>
          {state.scan.scanCount > 0 && (
            <div className="scan-evidence">
              <p>
                扫描 #{state.scan.scanCount}：{target.description} ={' '}
                <strong>{String(value).toUpperCase()}</strong>。
                {lastWrite
                  ? `最后实际写入来自网络 ${state.program.networks.findIndex((n) => n.id === lastWrite.networkId) + 1}。`
                  : '本扫描没有网络实际写入此输出，保留原值。'}
              </p>
              {writers.map((t) => (
                <details key={t.networkId}>
                  <summary>
                    网络 {state.program.networks.findIndex((n) => n.id === t.networkId) + 1} · 通路
                    {t.result ? '成立' : '不成立'} ·{' '}
                    {t.coil.written === false ? '未写入' : '已写入'}
                  </summary>
                  <ul>
                    {t.contacts.map((c) => (
                      <li key={c.instructionId}>
                        {state.program.variables.find((v) => v.id === c.variableId)?.name}：读取{' '}
                        {String(c.value).toUpperCase()}，条件{c.condition ? '成立' : '不成立'}
                        ，到此通路{c.path ? '成立' : '不成立'}。
                      </li>
                    ))}
                  </ul>
                  <p>本网络结果 {String(t.coil.value).toUpperCase()}；最终值仍由扫描顺序决定。</p>
                </details>
              ))}
              <p>
                TRUE
                表示输出命令接通；装置能否动作还取决于使能、互锁、卡滞等教学模型条件。它不代表整个实验已经合格。
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
