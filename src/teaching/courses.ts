import { signalCourses } from './coursesSignal';
import { feedbackCourses } from './coursesFeedback';
/** 课程只描述教学任务；不驱动装置，不改变公共 PLC 扫描语义。 */
export interface Course {
  application: string;
  prerequisites: { term: string; explanation: string }[];
  flow: string[];
  design: string[];
  build: string[];
  observations: string[];
  troubleshooting: { symptom: string; check: string }[];
  challenge: { task: string; hints: string[]; criteria: string[] };
  inputMeaning: Record<string, string>;
  outputMeaning: string;
}

export const courses: Record<string, Course> = {
  ...signalCourses,
  ...feedbackCourses,
  led: {
    application:
      '电梯楼层牌、计数显示器都需要把一个数字变成若干发光段。本实验先学会控制一个段，再用“状态序号”组织完整显示循环。',
    prerequisites: [
      {
        term: '输入、输出与内部变量',
        explanation:
          '启动按钮是输入，A～H 是输出；内部变量是 PLC 的记事本，没有实体接线端子。SIM_* 只属于本软件。',
      },
      {
        term: '常开、常闭与线圈',
        explanation:
          '常开触点读到 TRUE 时成立，常闭读到 FALSE 时成立；普通线圈每次扫描都把通路结果写给目标。触点不是在屏幕上拖动的真实开关。',
      },
      {
        term: 'SET 与 RESET',
        explanation:
          'SET 只在通路成立时写 TRUE，否则保持；RESET 只在成立时写 FALSE。按钮松开后仍亮，需要保持状态，不能只用普通线圈代替 SET。',
      },
      {
        term: '扫描和程序顺序',
        explanation:
          '一次扫描从上到下计算网络。后面的写入可能覆盖前面的值，因此“先清除段，再按图案置位”的顺序很重要。停止后按钮变化不会自动更新最后扫描值。',
      },
      {
        term: '周期脉冲、ADD 与比较',
        explanation:
          '周期脉冲只在指定的扫描短暂为 TRUE，ADD 才加一次。若把持续 TRUE 直接接 ADD，每 200 ms 就会加一次，图案会跳得过快。数值比较用于判断当前序号。',
      },
    ],
    flow: [
      '启动按钮 → SET 内部启动标志',
      '启动标志 → 每秒一个脉冲 → 显示序号加 1',
      '序号达到 24 → 回到 0',
      '0～7 选择 A～H 单段；8～23 选择 0～9/A/b/C/d/E/F',
      '每扫描先 RESET 所有段，再 SET 当前图案需要的段',
    ],
    design: [
      '先做最小实验：启动输入 I-00 的常开触点 → 普通线圈 O-00。接通时 A 亮，松开再扫描时 A 灭。这只练习输入与输出，不是完整显示任务。',
      '再把 A 的普通线圈改成 SET，比较“松开后保持”的差异。运行复位能清运行值，但不会把 SET 指令改回普通线圈。',
      '完整实验用内部“显示启动”保持启动状态，用数值“显示序号”保存图案，而不是为每个图案再造一个按钮。',
      '图案 0 的段组合是 A/B/C/D/E/F，图案 1 是 B/C。同一输出可以由多个序号选择条件驱动，支路之间是“或”。',
      '完整程序较长，先独立完成单段和 SET 小练习，再按搭建清单扩展；参考程序可用于对照网络顺序，需主动确认才载入。',
    ],
    build: [
      '最小网络：选“常开触点” → 网络 1 左侧“＋” → 元件变量选 SIM_IN_00；再选“输出线圈” → 末端“＋” → 变量选 SIM_OUT_00。',
      '检查结构，接通右侧启动输入后“单步扫描”。先确认 A 亮，再断开启动并单步，确认 A 灭。',
      '选末端线圈，执行指令改为 SET 置位，重新绑定 SIM_OUT_00。重复接通/扫描/断开/扫描，观察 A 保持。',
      '完整循环：添加布尔“显示启动”与数值“显示序号”（初值 0）；启动触点 → SET 显示启动。',
      '添加布尔脉冲变量；显示启动触点 → 周期脉冲 1000 ms；脉冲触点 → ADD 显示序号，常数 1。',
      '显示序号 ≥ 24 → MOV 显示序号，常数 0。数值触点在属性里选择“数值比较”并绑定数值变量。',
      '每个段先建无触点 RESET 网络，再建 SET 网络：显示启动与对应序号串联，不同序号用并联支路。按 0～7 单段、8～23 字符表建立段映射。',
      '检查完整循环：A～H → 0～9 → A/b/C/d/E/F → A；每图案 1 秒为教学设定。载入参考只用于对照，不表示你已独立完成。',
    ],
    observations: [
      '先用单步比较输入开关（待采样）与变量表（最后扫描）的区别。',
      '连续运行后可短接启动，再断开；内部启动标志保持，完整程序继续循环。',
      '在“为什么这样运行？”选择某段，读取实际比较条件与最后写入，确认先 RESET 后 SET。',
      '停止保留画面；复位回到初始状态并断开输入，程序还在。完整周期 24 个图案不是本节单段练习的结果。',
    ],
    troubleshooting: [
      {
        symptom: '接通按钮后 A 不亮',
        check:
          '检查触点是否绑定 I-00、线圈是否绑定 O-00，是否已经扫描。未绑定变量与编错逻辑是两类问题。',
      },
      {
        symptom: '松开按钮后 A 仍亮',
        check:
          '先再扫描。如果普通线圈仍亮，检查是否误选 SET、存在并联空支路或另一个网络在写 A。SET 保持则是预期。',
      },
      {
        symptom: '显示跳步或某段常亮',
        check:
          '查看序号 ADD 是否使用单扫描脉冲；检查每个段的 RESET 是否在 SET 之前，是否遗漏某序号的段组合。',
      },
    ],
    challenge: {
      task: '不载入参考：把单段练习改成“按钮松开时 B 亮，按下时 B 灭”，然后恢复成 SET 保持练习。完整任务再尝试把 1000 ms 改为 2000 ms，并解释哪一个网络改变了节拍。',
      hints: [
        '先想：按钮松开代表 FALSE，哪种触点在 FALSE 时成立？',
        '常闭触点 → 普通线圈，目标由 A 改为 B（O-01）；修改会复位运行状态。',
      ],
      criteria: [
        '在空闲状态断开按钮后单步，B 为 TRUE；接通后单步，B 为 FALSE。',
        '能说明常闭逻辑与 SET 保持的区别。',
        '完整循环的 24 个图案顺序保持，2000 ms 只是学习变式，不是指导书的新要求。',
      ],
    },
    inputMeaning: {
      'I-00': 'TRUE 表示启动按钮接通；断开后必须再次扫描才能观察结果。SET 启动标志可在松开后保持。',
    },
    outputMeaning: 'TRUE 表示对应发光段亮，FALSE 表示灭；H 是小数点。段组合决定显示字符。',
  },
};
