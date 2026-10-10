import { useState } from 'react';
import type { Simulator } from '../engine/useSimulator';
import { operationNames } from '../editor/validation';
import { allContacts } from '../editor/model';
const display = (v: boolean | number | undefined) =>
  typeof v === 'number' ? String(v) : v ? 'TRUE' : 'FALSE';
export function ExecutionExplanation({
  simulator,
  target,
  onLocate,
}: {
  simulator: Simulator;
  target?: string;
  onLocate: (networkId: string, instructionId: string) => void;
}) {
  const { state } = simulator;
  const [selected, setSelected] = useState(
    target ?? state.program.variables.find((v) => v.kind === 'output')?.id ?? '',
  );
  const variable = state.program.variables.find((v) => v.id === selected);
  const value = state.scan.values[selected];
  const writers = state.program.networks.flatMap((n, index) => {
    const t = state.scan.traces.find((t) => t.networkId === n.id);
    return t && n.coil && (n.coil.variableId === selected || n.coil.countVariableId === selected)
      ? [{ network: n, index, trace: t, coil: n.coil }]
      : [];
  });
  const last = writers.filter((w) => w.trace.coil.written !== false).at(-1);
  return (
    <section className="execution-explanation" aria-label="实际执行解释">
      <label className="inspector-field">
        解释对象
        <select
          aria-label="解释对象"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {state.program.variables.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} · {v.description}
            </option>
          ))}
        </select>
      </label>
      {!state.scan.scanCount ? (
        <p className="explain-empty">
          尚未扫描，无法说明输出原因。请运行或单步扫描后查看；当前显示的是复位初值。
        </p>
      ) : (
        <>
          <div className="explanation-fact">
            <strong>
              {variable?.description}：{display(value)}
            </strong>
            <p>
              依据扫描 #{state.scan.scanCount} · 逻辑时间{' '}
              {((state.scan.elapsedMs ?? 0) / 1000).toFixed(1)} s 的实际执行记录。
              {state.status === 'running'
                ? '连续运行时记录持续更新。'
                : '已停止，显示最后一次扫描。'}
            </p>
            {last && (
              <p>
                最后实际写入：网络 {last.index + 1} ·{' '}
                {operationNames[last.coil.operation ?? 'coil']}。
              </p>
            )}
          </div>
          {variable?.kind === 'input' ? (
            <p>
              本次扫描采样值是 {display(value)}；当前开关待采样值是{' '}
              {display(state.inputs[selected])}。开关变化在下一次扫描生效。
            </p>
          ) : !writers.length ? (
            <p>没有网络写入这个变量。值来自复位初值或之前保留的状态；请检查是否绑定了正确输出。</p>
          ) : (
            <ol className="writer-list">
              {writers.map(({ network, index, trace, coil }) => (
                <li key={network.id}>
                  <div className="writer-title">
                    <strong>
                      网络 {index + 1} · {network.name || '未命名'}
                    </strong>
                    <button onClick={() => onLocate(network.id, coil.id)}>在梯形图中定位</button>
                  </div>
                  <p>
                    支路 OR 结果：{trace.result ? '成立' : '不成立'}；执行{' '}
                    {operationNames[coil.operation ?? 'coil']}。
                  </p>
                  {trace.contacts.length ? (
                    <ul>
                      {trace.contacts.map((c) => {
                        const instruction = allContacts(network).find(
                          (i) => i.id === c.instructionId,
                        );
                        const v = state.program.variables.find((v) => v.id === c.variableId);
                        return (
                          <li key={c.instructionId}>
                            <span>
                              支路 {(c.branch ?? 0) + 1} · {v?.name}（{v?.description}）读取{' '}
                              {display(c.value)}；
                              {instruction?.comparison
                                ? `${instruction.comparison.operator.toUpperCase()} ${instruction.comparison.value}`
                                : instruction?.contactType === 'normallyClosed'
                                  ? '常闭条件'
                                  : '常开条件'}
                              {instruction?.edge ? ' + 上升沿检测' : ''} →{' '}
                              <b>{c.condition ? '成立' : '不成立'}</b>；此处串联通路
                              {c.path ? '成立' : '不成立'}。
                            </span>
                            {v?.kind === 'internal' && (
                              <button className="trace-variable" onClick={() => setSelected(v.id)}>
                                追踪此变量
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p>此网络没有触点，按无条件导通计算。</p>
                  )}
                  {['ton', 'tof', 'pulse'].includes(coil.operation ?? '') && (
                    <p>
                      累计 {trace.coil.elapsed ?? 0} / {coil.preset ?? 1000} ms。
                      {coil.operation === 'ton'
                        ? '通路断开即清零。'
                        : coil.operation === 'tof'
                          ? '通路断开后延时保留。'
                          : '到期发出一个扫描周期脉冲。'}
                    </p>
                  )}
                  {['ctu', 'resetCounter'].includes(coil.operation ?? '') && (
                    <p>
                      记录计数：{trace.coil.count ?? 0}；预置 {coil.preset ?? 1}。CTU
                      只计算通路由假变真的次数。
                    </p>
                  )}
                  <p>
                    {coil.countVariableId === selected
                      ? `计数显示写入值：${trace.coil.count ?? 0}`
                      : trace.coil.written === false
                        ? `条件不成立，本指令未写入；保留 ${display(trace.coil.previous)}。`
                        : `本次写入：${display(trace.coil.previous)} → ${display(trace.coil.value)}。`}
                    {last?.network.id !== network.id
                      ? ' 后续网络可能再次写入，请按顺序查看。'
                      : ' 这是本次扫描该变量的最后实际写入。'}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <p className="explanation-boundary">
            解释只证明程序本次怎样执行，不判定实验要求是否全部满足。装置卡滞、相反运动互锁和未使能，可能使物理动作与输出不同，请同时查看装置提示。
          </p>
        </>
      )}
    </section>
  );
}
