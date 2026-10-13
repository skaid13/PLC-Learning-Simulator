import type { Course } from '../teaching/courses';
import type { Experiment } from '../types';

export function CourseChapter({
  course,
  experiment,
  chapter,
}: {
  course: Course;
  experiment: Experiment;
  chapter: number;
}) {
  return (
    <div className="course-chapter">
      {chapter === 0 && (
        <>
          <h4>为什么学这个实验？</h4>
          <p>{course.application}</p>
          <h4>学习路线</h4>
          <ol>
            <li>先理解输入和输出，做一个最小可运行网络。</li>
            <li>观察真实扫描结果，解释每一步。</li>
            <li>扩展到指导书任务，再独立完成变式。</li>
          </ol>
        </>
      )}
      {chapter === 1 && (
        <>
          <h4>先修知识 · 点击展开</h4>
          {course.prerequisites.map((c) => (
            <details key={c.term} className="knowledge-card">
              <summary>{c.term}</summary>
              <p>{c.explanation}</p>
            </details>
          ))}
          <h4>控制流程</h4>
          <ol>
            {course.flow.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <h4>程序为什么这样设计？</h4>
          {course.design.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </>
      )}
      {chapter === 2 && (
        <>
          <p>端子是指导书标记，SIM_* 是仿真变量。以下状态说明以本软件教学模型为准。</p>
          <div className="course-io">
            <table>
              <caption>输入与输出的意义及有效状态</caption>
              <thead>
                <tr>
                  <th>方向 / 端子</th>
                  <th>名称 / 变量</th>
                  <th>状态含义</th>
                </tr>
              </thead>
              <tbody>
                {(['input', 'output'] as const).flatMap((kind) =>
                  experiment[kind === 'input' ? 'inputs' : 'outputs'].map((v) => (
                    <tr key={v.terminal}>
                      <td>
                        {kind === 'input' ? '输入' : '输出'} {v.terminal}
                      </td>
                      <td>
                        {v.label}
                        <br />
                        <code>
                          SIM_{kind === 'input' ? 'IN' : 'OUT'}_{v.terminal.slice(2)}
                        </code>
                      </td>
                      <td>
                        {kind === 'input' ? course.inputMeaning[v.terminal] : course.outputMeaning}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      {chapter === 3 && (
        <>
          <h4>从最小网络到完整任务</h4>
          <ol>
            {course.build.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p className="notice-text">
            手把手练习与完整实验分层学习。完成最小网络不代表完成整本指导书要求。
          </p>
        </>
      )}
      {chapter === 4 && (
        <>
          <h4>如何运行与观察</h4>
          <ol>
            {course.observations.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          {course.troubleshooting.map((t) => (
            <details className="knowledge-card" key={t.symptom}>
              <summary>{t.symptom}</summary>
              <p>{t.check}</p>
            </details>
          ))}
        </>
      )}
      {chapter === 5 && (
        <>
          <h4>独立练习</h4>
          <p>{course.challenge.task}</p>
          {course.challenge.hints.map((hint, i) => (
            <details className="knowledge-card" key={hint}>
              <summary>练习提示 {i + 1}</summary>
              <p>{hint}</p>
            </details>
          ))}
          <h4>完成标准 · 请实际操作自查</h4>
          <ul>
            {course.challenge.criteria.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p>开放性解释按标准自查，软件不会自动理解或判分自然语言答案。</p>
        </>
      )}
    </div>
  );
}
