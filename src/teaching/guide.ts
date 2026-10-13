import type { ProgramWorkspace } from '../types';
import type { RuntimeState } from '../engine/runtime';
import type { EditorSelection, EditorTool } from '../editor/model';
import { validateProgram } from '../editor/validation';
import type { ScanState } from '../engine/scan';

export interface EditorSnapshot {
  tool: EditorTool;
  selection: EditorSelection | null;
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
        !matching(c, op)
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
        '在“执行指令”选择“SET 置位”。',
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
