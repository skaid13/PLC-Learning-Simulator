import type { Experiment } from '../types';

export function ExperimentDetails({ experiment }: { experiment: Experiment }) {
  return (
    <>
      <span className="eyebrow">指导书内容摘要 · 实验 {experiment.number}</span>
      <h3>{experiment.name}</h3>
      <h4>实验目标</h4>
      <p>{experiment.objective}</p>
      <h4>控制要求</h4>
      <ol>
        {experiment.requirements.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ol>
      <div className="detail-io">
        {(['inputs', 'outputs'] as const).map((type) => (
          <section key={type}>
            <h4>{type === 'inputs' ? '输入设备' : '输出设备'}</h4>
            <table>
              <caption className="sr-only">{type === 'inputs' ? '输入' : '输出'} I/O 摘要</caption>
              <thead>
                <tr>
                  <th>设备 / 信号</th>
                  <th>指导书端子标记</th>
                </tr>
              </thead>
              <tbody>
                {experiment[type].map((item) => (
                  <tr key={item.terminal}>
                    <td>{item.label}</td>
                    <td>
                      <code>{item.terminal}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
      <p className="source-note">
        来源：《PLC实验箱实验指导书0827》对应实验章节；指导书目录标注起始页 {experiment.manualPage}
        （非重新渲染页码）。I-xx、O-xx 按原文记录为端子标记，不声明为真实罗克韦尔软件变量地址。
      </p>
      {experiment.notes && (
        <>
          <h4>待核实事项</h4>
          <ul>
            {experiment.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      )}
      <p className="source-note">
        本阶段仅整理要求，尚未实现该实验的专属教学、控制程序和仿真。入门课中的按钮示例是额外的基础教学示例。
      </p>
    </>
  );
}
