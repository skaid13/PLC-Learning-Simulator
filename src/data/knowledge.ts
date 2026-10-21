/** 中文教学语义以本项目引擎为准，不承诺真实PLC硬件能力。 */
export const knowledgeDetails: Record<
  string,
  { purpose: string; difference: string; practice: string }
> = {
  normallyOpen: {
    purpose: '要求“按钮接通时允许动作”，就选常开：读取输入是不是TRUE。触点只判断，不写结果。',
    difference: '常开在TRUE时成立，常闭在FALSE时成立。软件符号与真实按钮的常开/常闭接线是两件事。',
    practice: '在按钮亮灯课接通输入，先预测再扫描；断开后再扫描，对照灯亮和灯灭。',
  },
  normallyClosed: {
    purpose:
      '要求“没有停止请求才允许动作”，且停止输入TRUE代表请求停止时，选常闭。先弄清输入的有效状态。',
    difference: '它对读到的布尔值取反，不表示“灯默认常亮”，也不能推断硬件接线或故障安全性。',
    practice: '在第一课的变式中把常开改为常闭；验证输入FALSE时灯亮，TRUE时灯灭。',
  },
  coil: {
    purpose: '输出需要每次扫描都跟随条件时使用普通线圈，例如按住亮、松开灭。',
    difference: '触点负责读，线圈负责写；普通线圈每扫描写TRUE或FALSE，SET只在成立时写TRUE。',
    practice: '接通→扫描→断开但不扫描，灯暂时保留；再扫描灯才灭。',
  },
  set: {
    purpose: '短按启动后需要记住运行状态时使用。必须同时设计停止和RESET条件。',
    difference: '普通线圈在条件FALSE时写FALSE；SET在条件FALSE时保持，不会自动释放。',
    practice: '在独立草稿里用SET写内部标志；接通扫描再断开扫描，观察保持；用RESET清除。',
  },
  reset: {
    purpose: '需要明确取消一个已保持的状态时使用，例如停止时清除运行标志。',
    difference: 'RESET指令只清除目标，界面“复位”初始化整个运行状态。多个写入依网络顺序执行。',
    practice: '让SET和RESET指向同一内部变量，分别触发；再交换网络顺序，预测同时成立时的最终值。',
  },
  ton: {
    purpose: '要求条件连续满足一段时间后才动作，例如持续接通两秒才亮灯。',
    difference: 'TON在接通时累计；TOF在条件断开后延时关闭。停止扫描不推进逻辑时间。',
    practice: '打开延时亮灯，预置2000ms；接通单步9次不亮，第10次亮；中途断开扫描累计清零。',
  },
  tof: {
    purpose: '要求关闭请求后继续保持一段时间，例如许可撤销后风机延时停止。',
    difference: '接通立即写TRUE，断开才开始延时；TON接通后也需要等待。',
    practice: '在另存的延时练习改为TOF 2000ms；接通扫描立刻亮，断开后逐次扫描观察熄灭时机。',
  },
  pulse: {
    purpose: '需要按周期执行一个单扫描动作，例如序号每秒增加一次。',
    difference: '周期脉冲只持续一次扫描，不是高低各占一半的方波，也不是物理脉冲输出。',
    practice: '预置1000ms，每次单步200ms；记录第5、10次扫描脉冲TRUE及其余FALSE。',
  },
  ctu: {
    purpose: '要统计新的到达事件而非按住时长时使用，例如工件逐个经过传感器。',
    difference: 'CTU只数通路上升沿，ADD在每次通路成立的扫描都执行。',
    practice: '预置3，接通后连续扫描只计1；断开扫描后再接通才计第2次。',
  },
  resetCounter: {
    purpose: '新一批开始时把上批计数清零。',
    difference: '要与CTU使用同一个计数目标；复位整个运行会同时清除其他状态。',
    practice: 'CTU累计两次后触发对应计数复位，检查累计0且完成输出FALSE。',
  },
  comparison: {
    purpose: '要求“阶段等于2”或“余额足够”等数值关系时使用。',
    difference: '布尔条件读TRUE/FALSE，数值比较读数字；比较结果不会再受常闭符号取反。',
    practice: '新建数值变量初值1，比较等于1后扫描；初值改2会复位，再扫描比较结果应FALSE。',
  },
  move: {
    purpose: '要把阶段直接改为指定编号时使用，例如从阶段1转到阶段2。',
    difference: 'MOV覆盖为给定值，ADD在原值上累加；后续网络可读到本扫描已写入值。',
    practice: '给数值变量MOV 2，重复扫描仍为2；再比较ADD 1的重复累加。',
  },
  add: {
    purpose: '需要数量或余额增加、减少时使用，常配上升沿控制只执行一次。',
    difference: '通路持续TRUE时每扫描都会加；要计事件可以用CTU，或给ADD加边沿。',
    practice: '对数值变量ADD 1，输入保持接通单步3次；启用上升沿后重复测试，比较次数。',
  },
  input: {
    purpose: '输入提供消息：按钮或传感器现在是什么状态。SIM_IN_00是第一课的虚拟亮灯按钮。',
    difference:
      '输入是供程序读取的值；程序不能用线圈写输入。输入开关是待采样值，扫描表显示最后采样。',
    practice: '第一课接通“亮灯按钮”，观察待采样提示；单步后检查输入采样为TRUE。',
  },
  output: {
    purpose: '输出把程序判断结果交给装置：SIM_OUT_00在第一课驱动指示灯。',
    difference: '输出不是按钮的直接连线。输入变化必须经过程序扫描才改变输出。',
    practice: '观察第一课灯的状态和最后输出值；改变输入但不扫描，输出保持最后结果。',
  },
  internal: {
    purpose: '不对应实体端子的记事格，可存“运行中”等布尔标志，也可存阶段、余额等数值。',
    difference: '输入来自外界，输出驱动装置，内部变量仅用于程序内部。布尔值与数值不可混用。',
    practice: '在完整编辑器新建布尔变量“运行标志”，用SET/RESET写入，再用触点读取控制灯。',
  },
  series: {
    purpose: '多个要求必须同时满足时，把触点串联，例如启动且没有停止请求。',
    difference: '串联是“并且”，并联是“或者”；串联任一条件FALSE则整条支路不成立。',
    practice: '停止条件项目分别扫描00、10、11、01：只有启动TRUE且停止FALSE的组合亮灯。',
  },
  parallel: {
    purpose: '有任一个条件满足即可动作时建立并联，例如两处任一按钮都能开灯。',
    difference: '并联支路内部仍从左到右串联；本软件空支路无条件成立，应避免误建。',
    practice: '独立草稿用两个输入分别放在并联支路，测试00灭、10亮、01亮、11亮。',
  },
  edge: {
    purpose: '只在条件从FALSE变TRUE的那次扫描执行，例如一次按钮操作只加一次。',
    difference: '持续条件会一直成立；上升沿只成立一次。两次扫描之间快速按下又松开可能未被采样。',
    practice: '给ADD前触点启用上升沿，保持输入接通扫描3次只加1；断开扫描后再接通才再加。',
  },
  step: {
    purpose: '一次读取输入、计算程序、写输出，方便逐次看清因果；每次推进200ms教学逻辑时间。',
    difference: '运行会不断重复扫描；单步做完一次就停。现实等待不等于逻辑时间自动推进。',
    practice: '第一课接通输入后按一次单步，查看扫描编号加1、输出改变。',
  },
  run: {
    purpose: '需要连续观察动作和定时过程时，让程序重复扫描。',
    difference: '连续运行时不能编辑程序；先停止再修改。速度改变等待时间，不改变每次200ms逻辑时间。',
    practice: '先用单步理解按钮亮灯，再连续运行切换输入，观察下一扫描响应；最后停止。',
  },
  stop: {
    purpose: '暂停扫描，把最后结果留在屏幕上分析。',
    difference: '停止保留输出，不等于输出全部关闭；复位才初始化运行值。',
    practice: '灯亮时停止，断开输入，灯暂时仍亮；单步后才变灭。',
  },
  resetRuntime: {
    purpose: '重新做一次运行实验时，重置输入、输出、计时计数和装置状态，保留梯形图。',
    difference: '复位不清程序；重新开始练习会替换当前教学阶段草稿，必须先确认和备份。',
    practice: '灯亮后点击复位，确认灯灭、扫描0次，而触点和线圈仍在。',
  },
};
export const knowledgeGroups = [
  { title: '先认识信号', topics: ['input', 'output', 'internal'] },
  {
    title: '条件与结果',
    topics: ['normallyOpen', 'normallyClosed', 'coil', 'series', 'parallel', 'comparison'],
  },
  {
    title: '记忆、时间和次数',
    topics: ['set', 'reset', 'ton', 'tof', 'pulse', 'ctu', 'resetCounter', 'edge', 'move', 'add'],
  },
  { title: '操作与扫描', topics: ['step', 'run', 'stop', 'resetRuntime'] },
];
export const knowledgeNames: Record<string, string> = {
  input: '输入变量',
  output: '输出变量',
  internal: '内部变量',
  series: '串联（并且）',
  parallel: '并联（或者）',
  edge: '上升沿',
  step: '单步扫描',
  run: '连续运行',
  stop: '停止运行',
  resetRuntime: '复位运行状态',
};
