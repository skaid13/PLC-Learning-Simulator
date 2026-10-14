import type { Experiment } from '../types';

export function ExperimentDetails({ experiment }: { experiment: Experiment }) {
  return (
    <>
      <span className="eyebrow">
        {experiment.id.startsWith('starter-') ? '独立入门项目' : '指导书内容摘要'} ·{' '}
        {experiment.number}
      </span>
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
                  <th>
                    {experiment.id.startsWith('starter-') ? '虚拟练习端子' : '指导书端子标记'}
                  </th>
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
        {experiment.id.startsWith('starter-')
          ? '独立设计的入门练习，不属于实验指导书。虚拟端子用于教学，不连接实体设备。'
          : `来源：《PLC实验箱实验指导书0827》对应实验章节；目录起始页 ${experiment.manualPage}。I-xx、O-xx 为原文端子标记，不声明为官方软件地址。`}
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
        请按控制要求实际运行验收；结构检查通过或载入参考程序，不代表已经独立掌握。
      </p>
    </>
  );
}
