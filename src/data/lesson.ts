export const learningSteps = [
  { title: '认识实验', subtitle: '先认识 PLC 与实验装置' },
  { title: '学习原理', subtitle: '了解输入、处理与输出' },
  { title: '分析输入输出', subtitle: '分清按钮与指示灯' },
  { title: '编写梯形图', subtitle: '了解后续编程任务' },
  { title: '运行仿真', subtitle: '了解后续观察方法' },
  { title: '理解检查', subtitle: '用一道小题巩固知识' },
] as const;

export const foundationQuestion = {
  title: '在“按下按钮，指示灯亮起”的例子中，哪个是 PLC 的输入设备？',
  options: [
    {
      id: 'button',
      text: '按钮',
      feedback: '正确！按钮把人的操作传给 PLC，因此它是输入设备。指示灯接收控制结果，是输出设备。',
    },
    {
      id: 'lamp',
      text: '指示灯',
      feedback:
        '指示灯是输出设备：它接收 PLC 的控制结果。输入设备负责把外界信息送给 PLC，例如按钮。',
    },
    {
      id: 'program',
      text: '梯形图程序',
      feedback:
        '梯形图程序描述控制规则，属于处理逻辑。输入设备负责提供外界信号，在这个例子中是按钮。',
    },
  ],
  correctId: 'button',
};
