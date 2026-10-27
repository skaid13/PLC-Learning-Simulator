import { LearningSymbol } from './LearningSymbol';

/** 只读的线路拆解与编程前确认；不持有草稿，也不派发编辑操作。 */
export function LessonPreparation({
  phase,
  answer,
  onAnswer,
}: {
  phase: 2 | 4;
  answer: string;
  onAnswer: (value: string) => void;
}) {
  const planning = phase === 4;
  const correct = planning ? 'invert' : 'read';
  const choices = planning
    ? [
        ['invert', '把常开改为常闭，保留按钮输入和灯输出的绑定'],
        ['rename', '把输入变量改名，灯就会自动反着亮'],
        ['output', '让触点读取灯输出，不再读取按钮'],
      ]
    : [
        ['read', '触点读取按钮并判断，线圈把判断结果写给灯'],
        ['wire', '按钮不经过扫描就直接给灯供电'],
        ['write', '触点把TRUE写进按钮，再由线圈读取按钮'],
      ];
  return (
    <section className="lesson-preparation" aria-label={planning ? '编程前确认' : '只读线路拆解'}>
      <div className="lesson-demo">
        <h2>{planning ? '先想清楚，只改哪一处？' : '一条线路，分工只有两件事'}</h2>
        <div className="demo-rung" aria-label="只读结构示意，尚未执行">
          <span>
            <LearningSymbol kind={planning ? 'contactClosed' : 'contact'} />
            <small>{planning ? '常闭' : '常开'} · 读SIM_IN_00 / I-00</small>
          </span>
          <b>→</b>
          <span>
            <LearningSymbol kind="coil" />
            <small>普通线圈 · 写SIM_OUT_00 / O-00</small>
          </span>
        </div>
        <p className="demo-caption">结构示意，不表示实时执行；本阶段无需重复扫描。</p>
      </div>
      <div className="lesson-preparation-notes">
        {planning ? (
          <>
            <h3>目标：断开时亮，接通时灭</h3>
            <p>
              常闭判断输入是否为FALSE，适合这个新规则。下一阶段点击触点，在“图上触点类型”选常闭；也可使用下方属性栏。
            </p>
            <p>
              输入仍绑定I-00，线圈仍绑定O-00。变量名称只是便于识别的标签，改名不会改变端子或取反逻辑；自定义名称在再次调用时仍可见。
            </p>
            <p>
              修改后先检查结构，再保持默认FALSE预测灯亮并扫描；接通TRUE后预测灯灭并扫描。停止保留最后输出，复位清运行值，均不清空程序。
            </p>
          </>
        ) : (
          <>
            <h3>触点读条件，线圈写结果</h3>
            <p>
              左侧常开触点读取按钮输入I-00：TRUE成立，FALSE不成立。右侧普通线圈每次扫描都把通路结果写到O-00，灯随后显示这个输出。
            </p>
            <p>
              串联表示条件依次都要满足。本例只有一个条件，所以一个触点足够；不需要并联、自保持或定时器。
            </p>
            <p>
              软件触点是逻辑判断，不代表真实按钮的接线。第二阶段已观察亮灭，这里只需看懂分工，不再重复操作。
            </p>
          </>
        )}
      </div>
      <fieldset id="lesson-review" className="lesson-question">
        <legend>
          {planning ? '下一阶段应怎样改变规则？' : '这条线路中的触点和线圈分别做什么？'}
        </legend>
        {choices.map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="lesson-review"
              value={value}
              checked={answer === value}
              onChange={() => onAnswer(value)}
            />
            {label}
          </label>
        ))}
        {answer && (
          <p role="status">
            {answer === correct
              ? '理解正确，可以继续。'
              : planning
                ? '再想一下：规则由触点类型决定，改名不会让条件取反；触点仍要读取按钮。'
                : '再想一下：输入提供消息，触点只读判断，线圈写输出；变化必须经过扫描。'}
          </p>
        )}
      </fieldset>
    </section>
  );
}
