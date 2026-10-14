import type { LadderInstruction } from '../types';

const help: Record<string, { title: string; meaning: string; example: string; mistake: string }> = {
  normallyOpen: {
    title: '常开触点 · 判断是否为 TRUE',
    meaning:
      '触点读取一个变量，不会改变变量。读取 TRUE 时条件成立，FALSE 时不成立；串联的全部条件成立，通路才成立。',
    example: '绑定亮灯按钮：按钮接通→TRUE→通路成立；按钮断开→FALSE→通路不成立。',
    mistake: '常开是程序判断方式，不等于实际按钮一定采用常开接线。放置后还要绑定变量。',
  },
  normallyClosed: {
    title: '常闭触点 · 判断是否为 FALSE',
    meaning: '对布尔值作相反判断：变量 FALSE 时成立，TRUE 时不成立。用于“没有停止请求”等条件。',
    example: '停止输入 TRUE 表示按下。常闭读取它时不成立，灯的串联通路被切断。',
    mistake: '不要把“变量为 FALSE”理解成元件失效；常闭就是在这个状态下允许通路成立。',
  },
  comparison: {
    title: '数值比较 · 判断一个数',
    meaning:
      '读取数值变量与比较值，按等于、大于或小于等关系判断。这里直接使用比较结果，常开/常闭符号不会再次取反。',
    example: '相位等于 1 时允许南北绿灯亮；相位是 3 时该条件不成立。',
    mistake: '数值变量与布尔变量不同，先在属性中选择数值比较，再绑定数值变量。',
  },
  coil: {
    title: '普通线圈 · 每扫描更新结果',
    meaning: '通路成立写 TRUE，不成立写 FALSE。用于灯随按钮变化，不会在按钮松开后自行保持。',
    example: '按钮常开→灯线圈：接通后扫描灯亮；断开后扫描灯灭。',
    mistake: '线圈必须绑定输出或内部变量，不能写输入。开关改变后要扫描才看到新结果。',
  },
  set: {
    title: 'SET · 记住接通状态',
    meaning: '通路成立时写 TRUE，不成立时不写入，所以保持原值。要用 RESET 或运行复位清除。',
    example: '启动按钮短按后，内部运行标志仍保持 TRUE。',
    mistake: 'SET 不是普通线圈。松开按钮不会自动灭灯；多个写入按网络顺序执行。',
  },
  reset: {
    title: 'RESET · 清除保持状态',
    meaning: '通路成立时写 FALSE，否则不改值。常与 SET 成对使用。',
    example: '停止按钮→RESET 运行标志，解除之前 SET 的保持。',
    mistake: '指令 RESET 只改目标变量；界面的“复位”会重置整个运行状态，二者范围不同。',
  },
  ton: {
    title: 'TON · 持续满足后延时接通',
    meaning:
      '通路持续成立就累计逻辑时间，达到预置值后目标为 TRUE。通路断开时累计清零且目标为 FALSE。',
    example: '预置 2000 ms，每扫描 200 ms：持续接通十次扫描达到两秒。',
    mistake: '2000 ms 才是两秒。停止期间时间冻结；断开后重新接通不是接着旧时间计时。',
  },
  tof: {
    title: 'TOF · 断开后延时关闭',
    meaning: '通路成立时目标立即为 TRUE；条件断开后继续保持，直到预置时间达到才关闭。',
    example: '按钮松开后，指示灯继续亮两秒。',
    mistake: 'TOF 与 TON 的计时触发时机相反，不要仅根据“延时”两个字选择。',
  },
  pulse: {
    title: '周期脉冲 · 定期成立一次扫描',
    meaning: '许可成立后累计时间，每达到周期只让目标为 TRUE 一次扫描，其余扫描为 FALSE。',
    example: '1000 ms 周期配 200 ms 扫描，每秒亮 200 ms，适合黄灯闪烁。',
    mistake: '这是本软件的单扫描脉冲，不是高低各占一半的方波；周期至少为两次扫描时间。',
  },
  ctu: {
    title: 'CTU · 只数新的上升沿',
    meaning:
      '通路从 FALSE 变 TRUE 时加一次。持续 TRUE 不会每扫描累加；达到预置次数后完成目标为 TRUE。',
    example: '按钮接通、扫描、断开、扫描，再接通才会产生第二次计数。',
    mistake: '一直按住只计一次；“复位计数”可以清除累计。',
  },
  resetCounter: {
    title: '复位计数 · 清除次数',
    meaning: '通路成立时将对应计数目标的累计清零，并清除完成状态。',
    example: '开始下一批次时，把上一次 CTU 的次数清零。',
    mistake: '必须与 CTU 指向同一个目标；如果选择计数显示变量，也应保持一致。',
  },
  move: {
    title: 'MOV · 写入一个数值',
    meaning: '条件成立时把常数或读取变量的值复制给目标数值变量，否则保持原值。',
    example: '计时完成→MOV 相位 2，进入下一个交通灯阶段。',
    mistake: '不是每次加一；后面的网络能读到本扫描已写入的值，需要理解网络顺序。',
  },
  add: {
    title: 'ADD · 给目标加数',
    meaning: '每次通路成立，将常数或读取变量的值加到目标上。',
    example: '单扫描周期脉冲→ADD 显示序号 1，每个脉冲只前进一步。',
    mistake: '持续 TRUE 会每扫描都加一次；需要按钮边沿或周期脉冲限制次数。',
  },
};
export function InstructionHelp({
  instruction,
  tool,
}: {
  instruction?: LadderInstruction;
  tool?: string;
}) {
  const key =
    instruction?.kind === 'contact'
      ? instruction.comparison
        ? 'comparison'
        : instruction.contactType
      : instruction?.kind === 'coil'
        ? (instruction.operation ?? 'coil')
        : (tool ?? 'normallyOpen');
  const entry = help[key];
  if (!entry) return null;
  return (
    <details className="instruction-help" key={key}>
      <summary>元件解析：{entry.title}</summary>
      <p>{entry.meaning}</p>
      <h4>用在什么地方？</h4>
      <p>{entry.example}</p>
      {instruction?.kind === 'contact' && instruction.edge && (
        <p>
          当前还启用了上升沿：整个条件由 FALSE 变 TRUE 时，仅成立一次扫描。下一次需先变回 FALSE。
        </p>
      )}
      <h4>新手容易弄错</h4>
      <p>{entry.mistake}</p>
    </details>
  );
}
