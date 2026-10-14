import type { Experiment, ProgramWorkspace } from '../types';
import { createWorkspace } from '../editor/model';

export const starterExperiments: Experiment[] = [
  {
    id: 'starter-lamp',
    number: '入门 1',
    name: '按钮控制指示灯',
    shortName: '按钮亮灯',
    manualPage: 0,
    objective: '亲手建立第一个网络，分清按钮输入、程序条件与灯的输出。',
    requirements: [
      '接通按钮并扫描，指示灯亮。',
      '断开按钮并扫描，指示灯灭。',
      '改变输入后尚未扫描时，灯保留上一次结果。',
    ],
    inputs: [{ terminal: 'I-00', label: '亮灯按钮' }],
    outputs: [{ terminal: 'O-00', label: '指示灯' }],
    notes: ['独立入门教学项目，不是指导书中的实验；端子是虚拟练习标记。'],
  },
  {
    id: 'starter-stop',
    number: '入门 2',
    name: '给指示灯加停止条件',
    shortName: '停止条件',
    manualPage: 0,
    objective: '在已会亮灯的基础上增加一个条件，理解常闭和串联。',
    requirements: [
      '亮灯按钮接通且停止按钮断开时，灯亮。',
      '停止按钮接通时，无论亮灯按钮怎样，灯都灭。',
      '解除停止后，只在亮灯按钮仍接通时重新亮灯。',
    ],
    inputs: [
      { terminal: 'I-00', label: '亮灯按钮' },
      { terminal: 'I-01', label: '停止按钮' },
    ],
    outputs: [{ terminal: 'O-00', label: '指示灯' }],
    notes: [
      '停止输入 TRUE 表示按下。常闭指令对这一逻辑值取反，不表示实际按钮的接线方式。此练习没有自锁。',
    ],
  },
  {
    id: 'starter-delay',
    number: '入门 3',
    name: '持续接通两秒后亮灯',
    shortName: '延时亮灯',
    manualPage: 0,
    objective: '比较立即亮灯与延时亮灯，理解 TON 的预置时间和断开清零。',
    requirements: [
      '按钮持续接通满 2000 ms，灯才亮。',
      '不足两秒就断开，不亮灯且累计时间清零。',
      '重新接通后从零开始计时；灯亮后断开立即在下一扫描熄灭。',
    ],
    inputs: [{ terminal: 'I-00', label: '计时按钮' }],
    outputs: [{ terminal: 'O-00', label: '延时指示灯' }],
    notes: ['每次单步推进 200 ms 逻辑时间；十次接通扫描达到两秒。停止冻结逻辑时间。'],
  },
];
export const starterLessons: Record<
  string,
  { before: string; build: string[]; predict: string; observe: string; next: string }
> = {
  'starter-lamp': {
    before:
      '把 PLC 想成反复检查规则的控制员：按钮提供消息，程序决定是否亮灯。按钮不会绕过程序直接改变灯。',
    build: [
      '放置常开触点，绑定 SIM_IN_00：读取按钮是否接通。',
      '放置普通输出线圈，绑定 SIM_OUT_00：把条件结果写给灯。',
      '检查结构，再用右侧输入开关和单步扫描验证。',
    ],
    predict: '先猜：只接通按钮，尚未点击单步，灯会立刻变化吗？',
    observe:
      '不会。接通是待采样值；单步才读取输入并更新灯。断开后再单步，灯灭。绿色通路表示条件成立。',
    next: '试着把常开改成常闭，预测按钮松开时灯的状态，再进入“停止条件”。',
  },
  'starter-stop': {
    before:
      '先完成按钮亮灯，再增加停止按钮。目标是“想亮灯，并且没有按停止”。两个串联条件必须同时成立。',
    build: [
      '先按引导完成一个按钮控制灯，并验证接通和断开。',
      '在同一支路增加常闭触点，绑定停止输入 SIM_IN_01。',
      '亮灯按钮用常开，停止按钮用常闭，末端仍是普通线圈。',
    ],
    predict: '亮灯按钮与停止按钮同时接通，灯应该亮还是灭？',
    observe:
      '应灭。停止输入 TRUE 时常闭条件为 FALSE，整条串联通路不成立。分别试 00、10、11、01 四组输入。',
    next: '自己解释：为什么停止使用常闭判断？然后学习“延时亮灯”，暂时无需 SET 或自锁。',
  },
  'starter-delay': {
    before:
      '先完成立即亮灯，再把末端改为 TON。它持续记录通路成立的时间；达到预置值才把完成输出写为 TRUE。',
    build: [
      '先完成按钮→普通线圈，观察灯立即跟随按钮。',
      '选末端元件，将执行指令改为 TON，预置时间填 2000，再重新绑定 SIM_OUT_00。',
      '按钮接通后，每次单步推进 200 ms；观察累计时间，十次扫描达到两秒。',
    ],
    predict: '计时一秒就断开，然后重新接通，会接着之前的一秒计时吗？',
    observe: '不会。TON 在通路断开时清零。重新接通重新计时，已亮的灯也在断开后的扫描熄灭。',
    next: '把预置时间改成 3000，预测需要几次单步，再运行验证。之后可进入交通灯课程。',
  },
};
export function createStarterReference(experiment: Experiment): ProgramWorkspace {
  const p = createWorkspace(experiment),
    n = p.networks[0];
  n.name = experiment.shortName;
  n.contacts = [
    {
      id: `${experiment.id}:contact`,
      kind: 'contact',
      contactType: 'normallyOpen',
      variableId: 'input:I-00',
    },
  ];
  if (experiment.id === 'starter-stop')
    n.contacts.push({
      id: `${experiment.id}:stop`,
      kind: 'contact',
      contactType: 'normallyClosed',
      variableId: 'input:I-01',
    });
  n.coil = {
    id: `${experiment.id}:coil`,
    kind: 'coil',
    variableId: 'output:O-00',
    operation: experiment.id === 'starter-delay' ? 'ton' : 'coil',
    preset: 2000,
  };
  return p;
}
