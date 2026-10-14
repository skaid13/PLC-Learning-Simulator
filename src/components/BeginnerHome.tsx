import type { ReactNode } from 'react';
import { starterExperiments, starterLessons } from '../data/starters';

export function BeginnerHome({
  onProject,
  onFoundation,
}: {
  onProject: (id: string) => void;
  onFoundation: () => void;
}) {
  return (
    <section className="beginner-home" aria-label="零基础入门">
      <span className="eyebrow">从这里开始 · 不需要编程基础</span>
      <h3>先让一盏灯按你的规则亮起来</h3>
      <p>不用先背全部指令。花几分钟认识下面四件事，再完成三个小项目，最后进入实验课程。</p>
      <div className="foundation-entry">
        <strong>完全没接触过 PLC？先上文字基础课。</strong>
        <p>十课按顺序讲清概念，附推理例子、自查答案和对应练习。不需要先会电路或编程。</p>
        <button className="button primary full" onClick={onFoundation}>
          基础课堂：从零打基础
        </button>
      </div>
      <div className="foundation-concepts">
        <details open>
          <summary>1. PLC 到底做什么？</summary>
          <p>
            PLC
            是可编程逻辑控制器。它不断读取外界消息，按你写的规则判断，再控制灯、电机或阀门。你负责写规则，它负责重复执行。
          </p>
          <p className="concept-example">
            例如：如果按钮按下，就让灯亮。这里按钮是输入，灯是输出，“如果……就……”是程序。
          </p>
        </details>
        <details>
          <summary>2. 输入、输出和变量是什么？</summary>
          <p>
            输入把按钮和传感器的信息送进来；输出把控制结果送出去。变量像一个带名字的小格子，用来存这些信息。
          </p>
          <p>
            布尔变量只有 TRUE（真／接通）和 FALSE（假／断开）。SIM_IN_00
            是本软件的输入变量，SIM_OUT_00 是输出变量；00
            是编号。内部变量像便签，只用于程序内部记录。
          </p>
          <p>右侧开关表示准备送入的信息，变量表显示最后一次扫描读到的信息，它们可能暂时不同。</p>
        </details>
        <details>
          <summary>3. 怎样读一条梯形图？</summary>
          <p>
            一条横向线路叫一个网络。左边触点判断条件，右边线圈写出结果；从左到右读，从上到下执行各网络。
          </p>
          <p>
            常开触点读到 TRUE 时成立；常闭读到 FALSE
            时成立。串联表示“并且”，并联表示“或者”。绿色表示本次扫描的条件通路成立，并不是模拟真实电流。
          </p>
          <p>
            搭建顺序：选工具 → 点击＋放置 →
            在元件属性绑定变量。符号和变量两者都要设置。点元件可展开解析。
          </p>
        </details>
        <details>
          <summary>4. 为什么点了按钮，灯还没变？</summary>
          <p>
            输入开关改变的是待采样值。单步扫描才会读取输入、计算程序、更新输出。每次单步推进 200 ms
            逻辑时间；运行则自动重复。
          </p>
          <p>
            停止保留上一次结果，复位清除运行值但保留程序。修改程序也会复位，所以改完后请重新设置输入并扫描。
          </p>
          <p>
            先猜结果，再点击单步，最后看灯、绿色通路和“为什么这样运行？”。这比只记点击顺序更容易学会。
          </p>
        </details>
      </div>
      <h4>三个小项目 · 每次增加一个知识点</h4>
      <div className="starter-cards">
        {starterExperiments.map((e, i) => (
          <button key={e.id} className="starter-card" onClick={() => onProject(e.id)}>
            <span className="starter-number">0{i + 1}</span>
            <strong>{e.shortName}</strong>
            <span>{['输入 → 条件 → 输出', '常闭触点 + 串联条件', 'TON 定时 + 断开清零'][i]}</span>
            <small>打开独立练习 →</small>
          </button>
        ))}
      </div>
      <p className="notice-text">
        每个项目都从独立草稿开始，操作完成后引导自动前进。三个项目和正式实验分别保存，来回切换可以继续。
      </p>
    </section>
  );
}

export function StarterLesson({
  id,
  guide,
  onHome,
}: {
  id: string;
  guide?: ReactNode;
  onHome: () => void;
}) {
  const e = starterExperiments.find((e) => e.id === id)!,
    lesson = starterLessons[id];
  return (
    <aside className="panel teaching-panel" aria-label="教学指导区">
      <div className="panel-heading">
        <h2>入门小项目</h2>
        <button className="text-button" onClick={onHome}>
          回到入门地图
        </button>
      </div>
      <section className="starter-lesson">
        <span className="eyebrow">{e.number} · 一个新的知识点</span>
        <h3>{e.shortName}</h3>
        <p>{lesson.before}</p>
        <details open>
          <summary>这次要做到什么？</summary>
          <ul>
            {e.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </details>
        <details>
          <summary>怎么搭建？先看整体思路</summary>
          <ol>
            {lesson.build.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </details>
        <div className="prediction-card">
          <strong>先猜，再动手</strong>
          <p>{lesson.predict}</p>
          <details>
            <summary>操作后展开对照</summary>
            <p>{lesson.observe}</p>
          </details>
        </div>
      </section>
      {guide}
      <details className="starter-next">
        <summary>完成后自己改一次</summary>
        <p>{lesson.next}</p>
        <p>能自己预测并验证结果，再进入下一个项目。参考程序是对照工具，不代替独立练习。</p>
      </details>
    </aside>
  );
}
