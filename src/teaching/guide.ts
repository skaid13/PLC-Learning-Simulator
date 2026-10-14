import type { ProgramWorkspace } from '../types';
import type { RuntimeState } from '../engine/runtime';
import type { EditorSelection, EditorTool } from '../editor/model';
import { validateProgram } from '../editor/validation';
import type { ScanState } from '../engine/scan';

export interface EditorSnapshot {
  tool: EditorTool;
  selection: EditorSelection | null;
  /** Counts deliberate user clicks, including reselecting the same tool. */
  actionCount?: number;
}
export interface GuideContext {
  program: ProgramWorkspace;
  runtime: RuntimeState;
  editor: EditorSnapshot;
  checkedProgram?: ProgramWorkspace;
  explanationScan?: ScanState;
  baseline: ScanState | null;
}
export interface GuideStep {
  id: string;
  title: string;
  instruction: string;
  why: string;
  target: string;
  hints: string[];
  verify: (context: GuideContext) => string | null;
}
export interface MiniSpec {
  input: string;
  output: string;
  description: string;
  sensor?: boolean;
}
export const miniSpecs: Record<string, MiniSpec> = {
  'starter-lamp': {
    input: '00',
    output: '00',
    description: '第一个小项目：按钮接通后扫描，灯亮；断开后扫描，灯灭。',
  },
  'starter-stop': {
    input: '00',
    output: '00',
    description: '先完成按钮亮灯，再亲手加一个常闭停止条件。',
  },
  'starter-delay': {
    input: '00',
    output: '00',
    description: '先完成立即亮灯，再改为持续接通两秒后亮灯。',
  },
  assembly: {
    input: '00',
    output: '00',
    description: '先隔离验证启动→D传送指示，完整生产线另需定时、人工移位与步骤互锁。',
  },
  vending: {
    input: '03',
    output: '09',
    description:
      '仅隔离测试汽水按钮→出货指示线路，不含付款许可；完整售货必须另加余额、价格、扣款和忙状态。',
  },
  conveyor: {
    input: '00',
    output: '04',
    description: '先验证SB1→末端M4线路，不含物料许可/时序/保护；完整输送任务按课程搭建。',
  },
  arm: {
    input: '01',
    output: '05',
    description: '隔离验证启动→下降输出。仅练输入路径，不含到位转移和夹紧，完整取放按课程搭建。',
  },
  elevator: {
    input: '01',
    output: '04',
    description: '隔离验证二层内选→上升输出，不含到站停止与调度；完整电梯任务另需请求和SQ反馈。',
  },
  water: {
    input: '03',
    output: '01',
    sensor: true,
    description: '先关闭自动传感器，隔离验证低水位S4→阀Y；完整控制另需上限、保持、缺水保护及报警。',
  },
  mix: {
    input: '00',
    output: '00',
    description: '先验证启动→A进液阀，再按液位、搅拌和排液步骤搭建完整批次。',
  },
  stepper: {
    input: '02',
    output: '06',
    description: '隔离测试 SB3→使能 ENA；没有脉冲时电机不会转。完整定位任务另需脉冲、方向和计数。',
  },
  traffic: {
    input: '01',
    output: '00',
    description: '先用启动开关控制东西红灯，熟悉输入采样；完整交通任务还需四相位、定时和互锁。',
  },
  tower: {
    input: '00',
    output: '00',
    description: '先用启动控制 L1，再学习11个灯组的序号和并联条件。',
  },
  led: { input: '00', output: '00', description: '启动按钮直接控制 A 段，再比较 SET 保持。' },
};
const button = (name: string) => `[data-guide="${name}"]`;
export function createGuide(experimentId: string): GuideStep[] {
  const spec = miniSpecs[experimentId];
  if (!spec) return [];
  const input = `input:I-${spec.input}`,
    output = `output:O-${spec.output}`;
  const first = (c: GuideContext) => c.program.networks[0];
  const contact = (c: GuideContext) => first(c)?.contacts[0];
  const coil = (c: GuideContext) => first(c)?.coil;
  const matching = (c: GuideContext, op = 'coil') =>
    c.program.networks.length === 1 &&
    first(c).contacts.length === 1 &&
    !first(c).branches?.length &&
    contact(c)?.contactType === 'normallyOpen' &&
    !contact(c)?.comparison &&
    !contact(c)?.edge &&
    contact(c)?.variableId === input &&
    coil(c)?.variableId === output &&
    (coil(c)?.operation ?? 'coil') === op;
  const step = (
    id: string,
    title: string,
    instruction: string,
    why: string,
    target: string,
    verify: GuideStep['verify'],
    hints: string[],
  ): GuideStep => ({ id, title, instruction, why, target: button(target), verify, hints });
  const scan = (id: string, on: boolean, expected: boolean, op = 'coil') =>
    step(
      id,
      `单步验证${on ? '接通' : '断开'}结果`,
      `点击“单步扫描”，观察 ${spec.output === '00' && experimentId === 'led' ? 'A 段' : `O-${spec.output}`} 应为 ${expected ? '亮 / TRUE' : '灭 / FALSE'}。`,
      op === 'set' && !on
        ? 'SET 条件不成立时不写 FALSE，所以松开后保持；这是实际扫描结果。'
        : '输入开关是待采样值；扫描后才更新触点、输出和装置。',
      'step',
      (c) =>
        !matching(c, op) || c.runtime.program !== c.program
          ? '练习需要一个网络：一个绑定指定输入的常开触点 → 指定输出；检查指令、变量和多余支路。'
          : c.runtime.status === 'running'
            ? '请先停止，使用单步观察这一扫描。'
            : c.runtime.scan.scanCount === 0 ||
                c.runtime.scan === c.baseline ||
                c.runtime.status === 'error'
              ? '请在本步执行一次新的单步扫描。'
              : c.runtime.scan.values[input] !== on
                ? `本次扫描输入不是 ${on ? 'TRUE' : 'FALSE'}，请调整输入再扫描。`
                : c.runtime.scan.values[output] !== expected
                  ? '输出与预期不一致；查看真实轨迹，检查其他写入和运行状态。'
                  : null,
      [
        '先确认右侧输入开关，再单步。不要只看开关位置。',
        '观察输出灯、变量表和绿色通路；停止保留的是上一次扫描。',
      ],
    );
  const inputStep = (id: string, on: boolean) =>
    step(
      id,
      `${on ? '接通' : '断开'}输入`,
      `在右侧“变量调试”${on ? '接通' : '断开'} SIM_IN_${spec.input} 开关。`,
      '本软件按钮是开关形式；短按需先接通、扫描，再断开、扫描。',
      `input-${input}`,
      (c) =>
        (c.runtime.inputs[input] === true) === on
          ? null
          : `开关应为 ${on ? '接通' : '断开'}，还没有更新。`,
      [
        '“变量调试”在右侧装置下方，可以滚动定位。',
        '此步只设置待采样值；输出将在下一步扫描后变化。',
      ],
    );
  const steps = [
    step(
      'tool-contact',
      '选择常开触点工具',
      '点击中间绘图工具中的“常开触点”。',
      '先选择元件类型，再决定放置位置。常开在输入 TRUE 时成立。',
      'tool-normallyOpen',
      (c) => (c.editor.tool === 'normallyOpen' ? null : '还未选择常开触点工具。'),
      ['不是点“常闭触点”，两者对 TRUE/FALSE 的判断相反。'],
    ),
    step(
      'place-contact',
      '放置第一个触点',
      '点击网络 1 左侧“＋ 添加触点”。',
      '左侧读条件，右侧执行输出，沿横线从左向右理解。',
      'contact-0-0-0',
      (c) => (contact(c) ? null : '网络 1 还没有触点；选工具后点击左侧空位。'),
      ['左侧是触点空位，最右侧是线圈空位。'],
    ),
    step(
      'bind-contact',
      '给触点绑定输入',
      `在下方元件属性“元件变量”选择 SIM_IN_${spec.input}。`,
      '放置符号还不够，变量决定它读取哪个输入。',
      'variable',
      (c) =>
        contact(c)?.variableId === input && contact(c)?.contactType === 'normallyOpen'
          ? null
          : `触点应为常开并绑定 SIM_IN_${spec.input}；点击网络 1 触点可重新选中。`,
      [
        '属性不显示变量时，先点击刚放置的触点。',
        `从“输入变量”分组选 SIM_IN_${spec.input}，不要选择输出变量。`,
      ],
    ),
    step(
      'tool-coil',
      '选择输出线圈工具',
      '点击绘图工具“输出线圈”。',
      '普通线圈每扫描写入 TRUE 或 FALSE。',
      'tool-coil',
      (c) => (c.editor.tool === 'coil' ? null : '还未选择输出线圈工具。'),
      ['选择工具不会自动放置，还需要点击末端空位。'],
    ),
    step(
      'place-coil',
      '放置末端线圈',
      '点击网络 1 最右侧“＋ 末端线圈”。',
      '一个网络末端执行一个写入动作。',
      'coil-0',
      (c) => (coil(c) ? null : '网络 1 末端还没有线圈。'),
      ['窄屏可横向滚动梯形图查看末端。'],
    ),
    step(
      'bind-coil',
      '给线圈绑定输出',
      `在元件变量选择 SIM_OUT_${spec.output}。`,
      '该输出会直接驱动右侧装置，输入变量不能作为线圈目标。',
      'variable',
      (c) =>
        coil(c)?.variableId === output && (coil(c)?.operation ?? 'coil') === 'coil'
          ? null
          : `末端需普通线圈并绑定 SIM_OUT_${spec.output}。`,
      ['点击末端线圈，然后在“输出变量”分组选目标。'],
    ),
    step(
      'check',
      '检查最小程序结构',
      '点击“检查结构”，修正显示的错误。',
      '结构正确代表能执行，是否满足控制要求还要观察运行结果。',
      'check',
      (c) =>
        c.checkedProgram === c.program &&
        !validateProgram(c.program).some((i) => i.severity === 'error') &&
        matching(c)
          ? null
          : '请检查当前版本：只保留一个常开触点和一个正确绑定的普通线圈。修改后需再次检查。',
      ['点击检查后会在编辑区下方列出可定位的问题。'],
    ),
    inputStep('input-on', true),
    scan('scan-on', true, true),
    inputStep('input-off', false),
    scan('scan-off', false, false),
  ];
  if (experimentId === 'starter-stop') {
    const stopContact = (c: GuideContext) => first(c)?.contacts[1];
    const correct = (c: GuideContext) =>
      c.program.networks.length === 1 &&
      first(c)?.contacts.length === 2 &&
      !first(c)?.branches?.length &&
      contact(c)?.variableId === input &&
      contact(c)?.contactType === 'normallyOpen' &&
      !contact(c)?.comparison &&
      !contact(c)?.edge &&
      stopContact(c)?.variableId === 'input:I-01' &&
      stopContact(c)?.contactType === 'normallyClosed' &&
      !stopContact(c)?.comparison &&
      !stopContact(c)?.edge &&
      coil(c)?.variableId === output &&
      (coil(c)?.operation ?? 'coil') === 'coil';
    steps.push(
      step(
        'stop-tool',
        '选择常闭触点',
        '选“常闭触点”，为停止按钮增加相反判断。',
        '停止按下是 TRUE，需要常闭在这时切断通路。',
        'tool-normallyClosed',
        (c) => (c.editor.tool === 'normallyClosed' ? null : '请选择常闭触点工具。'),
        ['接下来把它串联在第一个触点后面。'],
      ),
      step(
        'stop-place',
        '串联一个停止触点',
        '点击网络 1 中第一个触点右侧的＋，增加第二个触点。',
        '串联表示两个条件都成立，灯才亮。',
        'contact-0-0-1',
        (c) => (stopContact(c) ? null : '请在主支路添加第二个触点。'),
        ['不需要另建网络，也不要添加并联支路。'],
      ),
      step(
        'stop-bind',
        '绑定停止输入',
        '第二个触点保持常闭，元件变量选 SIM_IN_01。',
        '此输入 TRUE 表示按下停止，常闭条件就变为 FALSE。',
        'variable',
        (c) => (correct(c) ? null : '需要常开 SIM_IN_00 与常闭 SIM_IN_01 串联，末端为普通灯线圈。'),
        ['点击第二个触点，在输入分组选 SIM_IN_01。'],
      ),
      inputStep('stop-start-on', true),
      step(
        'stop-press',
        '接通停止按钮',
        '在右侧接通 SIM_IN_01。先猜两个按钮同时接通时灯会怎样。',
        '停止条件优先阻断串联通路。',
        'input-input:I-01',
        (c) => (c.runtime.inputs['input:I-01'] === true ? null : '请接通停止输入 SIM_IN_01。'),
        ['不要断开亮灯按钮，两个开关都应接通。'],
      ),
      step(
        'stop-scan-off',
        '验证停止优先',
        '点击单步，两个按钮都接通时灯应灭。',
        '常闭停止条件不成立，串联通路为 FALSE。',
        'step',
        (c) =>
          correct(c) &&
          c.runtime.status === 'stopped' &&
          c.runtime.scan !== c.baseline &&
          c.runtime.scan.values[input] === true &&
          c.runtime.scan.values['input:I-01'] === true &&
          c.runtime.scan.values[output] === false
            ? null
            : '保持两个按钮接通，使用新的单步扫描验证灯灭。',
        ['观察第二个常闭触点与整个通路的颜色。'],
      ),
      step(
        'stop-release',
        '解除停止',
        '断开右侧 SIM_IN_01，保持 SIM_IN_00 接通。',
        '没有停止请求时，常闭条件重新成立。',
        'input-input:I-01',
        (c) =>
          c.runtime.inputs['input:I-01'] !== true && c.runtime.inputs[input] === true
            ? null
            : '断开停止按钮，并保持亮灯按钮接通。',
        ['解除停止不会自行保持亮灯；亮灯按钮仍需接通。'],
      ),
      step(
        'stop-scan-on',
        '验证允许亮灯',
        '点击单步，确认灯重新亮起。',
        '亮灯 TRUE 且停止 FALSE，两个条件同时成立。',
        'step',
        (c) =>
          correct(c) &&
          c.runtime.status === 'stopped' &&
          c.runtime.scan !== c.baseline &&
          c.runtime.scan.values[input] === true &&
          c.runtime.scan.values['input:I-01'] === false &&
          c.runtime.scan.values[output] === true
            ? null
            : '请在亮灯接通、停止断开时重新单步，确认灯亮。',
        ['其他三组输入都不应亮灯。'],
      ),
    );
  }
  if (experimentId === 'starter-delay') {
    const correct = (c: GuideContext) => matching(c, 'ton') && coil(c)?.preset === 2000;
    steps.push(
      step(
        'delay-select',
        '选中灯的末端指令',
        '点击网络 1 末端线圈，准备改成延时接通。',
        '先保持按钮条件不变，只改变末端执行方式。',
        'coil-0',
        (c) =>
          !!coil(c) && c.editor.selection?.instructionId === coil(c)?.id
            ? null
            : '请选中末端线圈。',
        ['属性区会显示执行指令。'],
      ),
      step(
        'delay-operation',
        '改成接通延时 TON',
        '在执行指令中选择 TON。',
        'TON 要持续满足条件才接通，不是立即亮灯。',
        'operation',
        (c) => (coil(c)?.operation === 'ton' ? null : '执行指令还不是 TON。'),
        ['修改指令会清除原来的变量绑定，之后需重新选择。'],
      ),
      step(
        'delay-preset',
        '设置两秒预置时间',
        '在预置时间输入 2000（单位 ms）。',
        '1000 ms 等于一秒；每次单步推进 200 ms。',
        'preset',
        (c) =>
          coil(c)?.operation === 'ton' && coil(c)?.preset === 2000
            ? null
            : '请将 TON 的预置时间设为 2000 ms。',
        ['填 2 不是两秒。'],
      ),
      step(
        'delay-bind',
        '重新绑定延时灯',
        '在元件变量选择 SIM_OUT_00。',
        '计时达到预置值后，这个完成输出驱动灯。',
        'variable',
        (c) => (correct(c) ? null : 'TON 2000 ms 需绑定 SIM_OUT_00，前面是一个常开 SIM_IN_00。'),
        ['保持一个触点和一个末端指令。'],
      ),
      inputStep('delay-on', true),
      step(
        'delay-before',
        '观察未到两秒时灯灭',
        '点击一次单步。累计 200 ms，灯仍应灭。',
        '条件已成立，但尚未达到预置时间。',
        'step',
        (c) =>
          correct(c) &&
          c.runtime.status === 'stopped' &&
          c.runtime.scan !== c.baseline &&
          c.runtime.scan.values[input] === true &&
          (c.runtime.scan.memory?.[output]?.elapsed ?? 0) > 0 &&
          (c.runtime.scan.memory?.[output]?.elapsed ?? 0) < 2000 &&
          c.runtime.scan.values[output] === false
            ? null
            : '请从复位后的接通状态单步，观察不足两秒且灯灭。',
        ['若已超过两秒，复位、重新接通，再单步；单步不等待现实中的两秒。'],
      ),
      inputStep('delay-break', false),
      step(
        'delay-clear',
        '验证中途断开清零',
        '断开后点击单步，确认累计回到 0、灯灭。',
        'TON 不保留之前的一小段时间。',
        'step',
        (c) =>
          correct(c) &&
          c.runtime.status === 'stopped' &&
          c.runtime.scan !== c.baseline &&
          c.runtime.scan.values[input] === false &&
          c.runtime.scan.memory?.[output]?.elapsed === 0 &&
          c.runtime.scan.values[output] === false
            ? null
            : '请断开后执行新的单步，检查累计清零。',
        ['可在为什么这样运行中查看累计时间。'],
      ),
      inputStep('delay-restart', true),
      step(
        'delay-finish',
        '持续接通直到两秒',
        '保持按钮接通，再单步十次；每次 200 ms，到 2000 ms 时灯亮。',
        '计时从零重新开始，累计达到预置值才完成。',
        'step',
        (c) =>
          correct(c) &&
          c.runtime.status === 'stopped' &&
          c.runtime.scan !== c.baseline &&
          c.runtime.scan.values[input] === true &&
          c.runtime.scan.memory?.[output]?.elapsed === 2000 &&
          c.runtime.scan.values[output] === true
            ? null
            : '继续单步，保持输入 TRUE，累计达到 2000 ms 后灯才亮。',
        ['观察逻辑时间；十次接通扫描共两秒。'],
      ),
      inputStep('delay-final-off', false),
      step(
        'delay-final-scan',
        '验证亮灯后断开熄灭',
        '再单步一次，灯灭且计时清零。',
        'TON 是延时接通，不会在断开后继续保持。',
        'step',
        (c) =>
          correct(c) &&
          c.runtime.status === 'stopped' &&
          c.runtime.scan !== c.baseline &&
          c.runtime.scan.values[input] === false &&
          c.runtime.scan.values[output] === false &&
          c.runtime.scan.memory?.[output]?.elapsed === 0
            ? null
            : '断开按钮后执行新的单步，确认灯灭且累计清零。',
        ['延时关闭需要另一种指令 TOF。'],
      ),
    );
  }
  if (spec.sensor)
    steps.unshift(
      step(
        'manual-sensors',
        '切换手动传感器练习',
        '取消勾选右侧“自动位置 / 液位传感器”。',
        '基础练习手动设置低位信号；自动模式由实际水位生成，不能直接拨动开关。',
        'auto-sensors',
        (c) => (!c.runtime.autoSensors ? null : '自动传感器仍开启，请先取消勾选。'),
        ['该开关在装置下方；此处只用于隔离测试，最后会引导恢复自动。'],
      ),
    );
  if (experimentId === 'led')
    steps.push(
      step(
        'select-coil',
        '选中 A 段线圈',
        '点击网络 1 的末端线圈。',
        '接下来比较普通线圈与 SET；这里只选择，不会覆盖程序。',
        'coil-0',
        (c) =>
          c.editor.selection?.instructionId === coil(c)?.id && !!coil(c)
            ? null
            : '请点击网络 1 末端的线圈符号。',
        ['选择后下方元件属性显示执行指令。'],
      ),
      step(
        'set-operation',
        '把执行指令改为 SET',
        '在“执行指令”选择“置位 SET”。',
        'SET 只在成立时置位；指令变化会清空目标，下一步需重新绑定。',
        'operation',
        (c) => (coil(c)?.operation === 'set' ? null : '当前末端不是 SET，请在执行指令下拉框选择。'),
        ['修改程序会复位运行状态，所以旧灯光结果会清除。'],
      ),
      step(
        'set-target',
        '重新绑定 A 段',
        '在“元件变量”重新选择 SIM_OUT_00。',
        '换指令后重新绑定，避免沿用不兼容的目标类型。',
        'variable',
        (c) =>
          coil(c)?.operation === 'set' && coil(c)?.variableId === output
            ? null
            : 'SET 还未绑定 SIM_OUT_00。',
        ['不要漏掉这个步骤；未绑定时无法运行。'],
      ),
      inputStep('set-input-on', true),
      scan('set-scan-on', true, true, 'set'),
      inputStep('set-input-off', false),
      scan('set-scan-off', false, true, 'set'),
    );
  if (spec.sensor)
    steps.push(
      step(
        'restore-sensors',
        '恢复自动液位反馈',
        '重新勾选“自动位置 / 液位传感器”。',
        '完整实验需要真实模型水位反馈；下一扫描会按液位重新采样。',
        'auto-sensors',
        (c) =>
          c.runtime.autoSensors ? null : '请恢复自动传感器，避免后续完整实验一直等待手动液位。',
        ['恢复自动不会自动替换你的程序。'],
      ),
    );
  steps.push(
    step(
      'explain',
      '读取真实执行原因',
      '点击右侧“为什么这样运行？”，观察本次网络条件与写入，再关闭说明。',
      '解释来自最后实际扫描，不是预设动画。现在只完成基础操作；接下来阅读课程搭建完整实验并做独立练习。',
      'explain',
      (c) =>
        c.runtime.scan.scanCount > 0 && c.explanationScan === c.runtime.scan
          ? null
          : '先完成扫描，再打开“为什么这样运行？”查看当前结果。',
      ['在解释中可以定位网络，比较通路条件和是否实际写入。'],
    ),
  );
  return steps;
}
