import type { Experiment, ContactInstruction, CoilInstruction, ProgramWorkspace } from '../types';
import { createWorkspace } from '../editor/model';
type Condition = Omit<ContactInstruction, 'id' | 'kind'>;
const I = (n: number) => `input:I-${String(n).padStart(2, '0')}`;
const O = (n: number) => `output:O-${String(n).padStart(2, '0')}`;
const yes = (id: string, edge = false): Condition => ({
  variableId: id,
  contactType: 'normallyOpen',
  ...(edge ? { edge: 'rising' as const } : {}),
});
const no = (id: string): Condition => ({ variableId: id, contactType: 'normallyClosed' });
const cmp = (
  id: string,
  operator: 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge',
  value: number,
): Condition => ({ ...yes(id), comparison: { operator, value } });
export const digitSegments = [
  'ABCDEF',
  'BC',
  'ABDEG',
  'ABCDG',
  'BCFG',
  'ACDFG',
  'ACDEFG',
  'ABC',
  'ABCDEFG',
  'ABCDFG',
  'ABCEFG',
  'CDEFG',
  'ADEF',
  'BCDEG',
  'ADEFG',
  'AEFG',
];
export const towerGroups = [
  [1],
  [1, 2],
  [1, 3],
  [1, 4],
  [1, 2, 3, 4],
  [5, 7],
  [6, 8],
  [1, 3, 5, 7],
  [2, 4, 6, 8],
  [5, 6, 7, 8],
  [1, 2, 3, 4, 5, 6, 7, 8],
];
class Builder {
  p: ProgramWorkspace;
  serial = 0;
  constructor(e: Experiment) {
    this.p = createWorkspace(e);
    this.p.networks = [];
  }
  variable(name: string, number = false, initial = 0) {
    const id = `ref:${name}`;
    this.p.variables.push({
      id,
      name: `SIM_${name}`,
      kind: 'internal',
      description: name,
      dataType: number ? 'number' : 'boolean',
      ...(number ? { initialValue: initial } : {}),
    });
    return id;
  }
  rung(
    name: string,
    conditions: Condition[][],
    target: string,
    operation: CoilInstruction['operation'] = 'coil',
    preset?: number,
    extra: Partial<CoilInstruction> = {},
  ) {
    if (conditions.some((b) => b.length > 4) || conditions.length > 8)
      throw Error(`Reference topology: ${name}`);
    const id = `ref-net-${++this.serial}`;
    const branches = conditions.map((b) =>
      b.map((c) => ({ ...c, id: `${id}-c-${++this.serial}`, kind: 'contact' as const })),
    );
    this.p.networks.push({
      id,
      name,
      topology: 'series',
      contacts: branches[0] ?? [],
      branches: branches.slice(1),
      coil: { id: `${id}-out`, kind: 'coil', variableId: target, operation, preset, ...extra },
    });
  }
  and(
    name: string,
    conditions: Condition[],
    target: string,
    op: CoilInstruction['operation'] = 'coil',
    preset?: number,
    extra: Partial<CoilInstruction> = {},
  ) {
    this.rung(name, [conditions], target, op, preset, extra);
  }
  outputs(target: string, conditions: Condition[][]) {
    this.and('清除本扫描输出', [], target, 'reset');
    for (let i = 0; i < conditions.length; i += 8)
      this.rung('满足任一显示条件', conditions.slice(i, i + 8), target, 'set');
  }
  pulse(enabled: Condition[] = [], period = 1000) {
    const v = this.variable(`闪烁脉冲_${this.serial}`);
    this.and('教学周期脉冲', enabled, v, 'pulse', period);
    return v;
  }
  snapshot(state: string) {
    const snap = this.variable('扫描开始步骤', true);
    this.and('保存扫描开始步骤，避免同一扫描跳步', [], snap, 'move', 0, {
      sourceVariableId: state,
    });
    return snap;
  }
}
interface Stage {
  outputs: number[];
  duration?: number;
  until?: Condition[];
  next?: number;
}
function sequence(b: Builder, start: Condition[], stages: Stage[], reset: Condition[][] = []) {
  const state = b.variable('步骤', true),
    snap = b.snapshot(state);
  b.and('启动一个工作周期', [cmp(snap, 'eq', 0), ...start], state, 'move', 1);
  stages.forEach((s, index) => {
    const step = index + 1;
    let conditions = [cmp(snap, 'eq', step), ...(s.until ?? [])];
    if (s.duration) {
      const t = b.variable(`步骤${step}定时完成`);
      b.and(`步骤 ${step} 定时 ${s.duration} ms`, conditions, t, 'ton', s.duration);
      conditions = [cmp(snap, 'eq', step), yes(t)];
    }
    if (s.duration || s.until)
      b.and(
        `步骤 ${step} 转移`,
        conditions,
        state,
        'move',
        s.next ?? (step === stages.length ? 0 : step + 1),
      );
  });
  reset.forEach((c) => b.and('复位/停止优先', c, state, 'move', 0));
  const outIndices = [...new Set(stages.flatMap((s) => s.outputs))];
  outIndices.forEach((o) =>
    b.rung(
      '根据当前步骤驱动装置',
      stages.flatMap((s, i) => (s.outputs.includes(o) ? [[cmp(state, 'eq', i + 1)]] : [])),
      O(o),
    ),
  );
  return state;
}
export function createReferenceProgram(e: Experiment): ProgramWorkspace {
  const b = new Builder(e);
  b.p.name = `${e.shortName} · 教学参考`;
  switch (e.id) {
    case 'led': {
      const active = b.variable('显示启动'),
        phase = b.variable('显示序号', true);
      b.and('按钮置位启动', [yes(I(0))], active, 'set');
      const pulse = b.pulse([yes(active)]);
      b.and('每秒进入下一图案', [yes(pulse)], phase, 'add', 1);
      b.and('24 个图案循环', [cmp(phase, 'ge', 24)], phase, 'move', 0);
      for (let segment = 0; segment < 8; segment++) {
        const c: Condition[][] = [[yes(active), cmp(phase, 'eq', segment)]];
        digitSegments.forEach((pattern, index) => {
          if (pattern.includes('ABCDEFGH'[segment]))
            c.push([yes(active), cmp(phase, 'eq', index + 8)]);
        });
        b.outputs(O(segment), c);
      }
      break;
    }
    case 'tower': {
      const active = b.variable('灯塔启动'),
        phase = b.variable('灯组序号', true);
      b.and('启动并保持', [yes(I(0))], active, 'set');
      const pulse = b.pulse([yes(active)]);
      b.and('每秒切换灯组', [yes(pulse)], phase, 'add', 1);
      b.and('灯组循环', [cmp(phase, 'ge', towerGroups.length)], phase, 'move', 0);
      for (let i = 0; i < 8; i++)
        b.outputs(
          O(i),
          towerGroups.flatMap((g, n) =>
            g.includes(i + 1) ? [[yes(active), cmp(phase, 'eq', n)]] : [],
          ),
        );
      break;
    }
    case 'stepper': {
      const done = b.variable('目标脉冲完成'),
        count = b.variable('累计脉冲', true),
        run = b.variable('运动启动');
      b.and('新启动清除计数', [yes(I(0), true)], done, 'resetCounter', 0, {
        countVariableId: count,
      });
      b.and('保持启动', [yes(I(0))], run, 'set');
      b.and('到达 400 脉冲停止', [yes(done)], run, 'reset');
      const pulse = b.pulse([yes(run), yes(I(2)), no(done)], 400);
      b.and('教学脉冲输出', [yes(pulse)], O(0));
      b.and('方向由 SB2 控制', [yes(I(1))], O(3));
      b.and('使能由 SB3 控制', [yes(I(2))], O(6));
      b.and('400 脉冲对应 90°', [yes(O(0))], done, 'ctu', 400, { countVariableId: count });
      break;
    }
    case 'traffic': {
      const state = b.variable('相位', true),
        snap = b.snapshot(state);
      const blink = b.pulse([yes(I(1))]);
      b.and('接通开关进入南北绿', [yes(I(1)), cmp(snap, 'eq', 0)], state, 'move', 1);
      [5000, 3000, 5000, 3000].forEach((time, i) => {
        const t = b.variable(`相位${i + 1}定时`);
        b.and('相位计时', [cmp(snap, 'eq', i + 1), yes(I(1))], t, 'ton', time);
        b.and('相位转移', [cmp(snap, 'eq', i + 1), yes(t)], state, 'move', i === 3 ? 1 : i + 2);
      });
      b.and('断开开关全部复位', [no(I(1))], state, 'move', 0);
      b.rung('东西红灯', [[cmp(state, 'eq', 1)], [cmp(state, 'eq', 2)]], O(0));
      b.and('东西黄灯闪烁', [cmp(state, 'eq', 4), yes(blink)], O(1));
      b.and('东西绿灯', [cmp(state, 'eq', 3)], O(2));
      b.and('南北绿灯', [cmp(state, 'eq', 1)], O(3));
      b.and('南北黄灯闪烁', [cmp(state, 'eq', 2), yes(blink)], O(4));
      b.rung('南北红灯', [[cmp(state, 'eq', 3)], [cmp(state, 'eq', 4)]], O(5));
      break;
    }
    case 'arm': {
      sequence(
        b,
        [yes(I(1), true)],
        [
          { outputs: [5], until: [yes(I(3))] },
          { outputs: [1], duration: 5000 },
          { outputs: [1, 4], until: [yes(I(4))] },
          { outputs: [1, 3], until: [yes(I(5))] },
          { outputs: [1, 5], until: [yes(I(3))] },
          { outputs: [], duration: 5000 },
          { outputs: [4], until: [yes(I(4))] },
          { outputs: [2], until: [yes(I(6))] },
        ],
        [[yes(I(2))]],
      );
      b.and('原位灯', [yes(I(6)), yes(I(4))], O(0));
      break;
    }
    case 'mix':
      sequence(
        b,
        [yes(I(0), true)],
        [
          { outputs: [0], until: [yes(I(2))] },
          { outputs: [1], until: [yes(I(1))] },
          { outputs: [3], duration: 3000 },
          { outputs: [2], until: [no(I(3))] },
          { outputs: [2], duration: 2000 },
        ],
      );
      break;
    case 'assembly':
      sequence(
        b,
        [yes(I(0), true)],
        [
          { outputs: [0], duration: 3000 },
          { outputs: [1], until: [yes(I(2), true)] },
          { outputs: [2], duration: 3000 },
          { outputs: [3], until: [yes(I(2), true)] },
          { outputs: [4], duration: 3000 },
          { outputs: [5], until: [yes(I(2), true)] },
          { outputs: [6], duration: 3000 },
          { outputs: [7] },
        ],
        [[yes(I(1))]],
      );
      break;
    case 'water': {
      const fill = b.variable('水池补水请求'),
        alarm = b.variable('补水超时'),
        pump = b.variable('水塔供水请求');
      b.and('水池低位补水', [yes(I(3)), no(I(2))], fill, 'set');
      b.and('水池上限关闭', [yes(I(2))], fill, 'reset');
      b.and('低位持续四秒故障', [yes(I(3)), yes(fill)], alarm, 'ton', 4000);
      const blink = b.pulse([yes(alarm)]);
      b.rung(
        '正常补水或报警闪烁',
        [
          [yes(fill), no(alarm)],
          [yes(fill), yes(alarm), yes(blink)],
        ],
        O(1),
      );
      b.and('水塔低位且水池有水', [yes(I(1)), no(I(3))], pump, 'set');
      b.rung('上限或缺水停止', [[yes(I(0))], [yes(I(3))]], pump, 'reset');
      b.and('抽水电机', [yes(pump)], O(0));
      break;
    }
    case 'elevator': {
      const target = b.variable('目标楼层', true),
        floor = b.variable('最近经过楼层', true, 1);
      const requests = [1, 2, 3].map((i) => b.variable(`楼层${i}请求`));
      [1, 2, 3].forEach((f) => {
        const calls = f === 1 ? [0, 6] : f === 2 ? [1, 4, 5] : [2, 3];
        b.rung(
          '记录其它楼层请求',
          calls.map((i) => [yes(I(i), true), no(I(f + 6))]),
          requests[f - 1],
          'set',
        );
        b.and('到站清除请求', [yes(I(f + 6))], requests[f - 1], 'reset');
        b.and('更新经过楼层', [yes(I(f + 6))], floor, 'move', f);
        b.and('楼层到位灯', [yes(I(f + 6))], O(f - 1));
        b.and('请求响应灯', [yes(requests[f - 1])], O(f + 4));
        b.and('到达目标释放调度', [yes(I(f + 6)), cmp(target, 'eq', f)], target, 'move', 0);
      });
      [1, 2, 3].forEach((f) =>
        b.and(
          '教学调度：低楼层优先',
          [cmp(target, 'eq', 0), yes(requests[f - 1])],
          target,
          'move',
          f,
        ),
      );
      b.and('复位目标', [yes(I(10))], target, 'move', 0);
      requests.forEach((r) => b.and('复位请求', [yes(I(10))], r, 'reset'));
      b.rung(
        '向上运行',
        [
          [cmp(target, 'eq', 2), cmp(floor, 'eq', 1)],
          [cmp(target, 'eq', 3), cmp(floor, 'lt', 3)],
        ],
        O(4),
      );
      b.rung(
        '向下运行',
        [
          [cmp(target, 'eq', 1), cmp(floor, 'gt', 1)],
          [cmp(target, 'eq', 2), cmp(floor, 'eq', 3)],
        ],
        O(3),
      );
      break;
    }
    case 'vending': {
      const balance = b.variable('余额', true),
        busy = b.variable('出货类型', true),
        done = b.variable('出货五秒完成');
      const blink = b.pulse();
      [1, 2, 5].forEach((coin, i) =>
        b.and(
          '投币边沿累计，超过九元拒收',
          [yes(I(i), true), cmp(busy, 'eq', 0), cmp(balance, 'le', 9 - coin)],
          balance,
          'add',
          coin,
        ),
      );
      b.and('空闲时退还余额', [yes(I(5), true), cmp(busy, 'eq', 0)], balance, 'move', 0);
      [3, 5].forEach((price, i) => {
        const buy = b.variable(`购买${i + 1}接受`);
        b.and(
          '检查价格并接受按钮边沿',
          [yes(I(i + 3), true), cmp(balance, 'ge', price), cmp(busy, 'eq', 0)],
          buy,
        );
        b.and('扣除价格', [yes(buy)], balance, 'add', -price);
        b.and('进入出货', [yes(buy)], busy, 'move', i + 1);
      });
      b.and('出货计时', [cmp(busy, 'ne', 0)], done, 'ton', 5000);
      b.and('出货结束', [yes(done)], busy, 'move', 0);
      b.and('出货灯', [cmp(busy, 'ne', 0)], O(9));
      [3, 5].forEach((price, i) =>
        b.rung(
          '可购灯/出货闪烁',
          [
            [cmp(busy, 'eq', 0), cmp(balance, 'ge', price)],
            [cmp(busy, 'eq', i + 1), yes(blink)],
          ],
          O(i + 7),
        ),
      );
      for (let i = 0; i < 7; i++)
        b.outputs(
          O(i),
          digitSegments
            .slice(0, 10)
            .flatMap((s, n) => (s.includes('ABCDEFG'[i]) ? [[cmp(balance, 'eq', n)]] : [])),
        );
      break;
    }
    case 'conveyor': {
      const state = b.variable('输送状态', true),
        reason = b.variable('停止位置', true),
        heavy = b.variable('重物模式_0故障1重物', true),
        was = [1, 2, 3, 4].map((i) => b.variable(`停机前M${i}`));
      [1, 2, 3, 4].forEach((i) => {
        b.and('保存运行中的实际电机状态', [cmp(state, 'eq', 1), yes(O(i))], was[i - 1], 'set');
        b.and('保存运行中的实际电机状态', [cmp(state, 'eq', 1), no(O(i))], was[i - 1], 'reset');
      });
      b.and(
        '启动输送',
        [yes(I(0), true), cmp(state, 'eq', 0), yes(I(8)), no(I(7))],
        state,
        'move',
        1,
      );
      // 高编号优先；一旦进入停止状态，同一扫描不再覆盖原因。
      [4, 3, 2, 1, 0].forEach((i) => {
        const signal = I(i === 0 ? 1 : i + 1),
          accept = b.variable(`停止接受${i}`);
        b.and('接受停止信号', [yes(signal), cmp(state, 'eq', 1)], accept);
        b.and('记录停止位置', [yes(accept)], reason, 'move', i);
        b.and('开始顺序停机', [yes(accept)], state, 'move', 2);
      });
      b.rung('无料或装满立即停止', [[no(I(8))], [yes(I(7))]], state, 'move', 0);
      const startTimes = [15000, 10000, 5000, 0].map((time, i) => {
        const t = b.variable(`M${i + 1}启动延时`);
        if (time) b.and('倒序启动延时', [cmp(state, 'eq', 1)], t, 'ton', time);
        else b.and('末端先启动', [cmp(state, 'eq', 1)], t);
        return t;
      });
      const stopTimes = [5000, 10000, 15000, 20000].map((time) => {
        const t = b.variable(`停止${time}ms`);
        b.and('停机送料计时', [cmp(state, 'eq', 2)], t, 'ton', time);
        return t;
      });
      [1, 2, 3, 4].forEach((j) => {
        const conditions: Condition[][] = [[cmp(state, 'eq', 1), yes(startTimes[j - 1])]];
        for (let k = 0; k <= 4; k++) {
          if (j > Math.max(1, k)) {
            conditions.push([
              cmp(state, 'eq', 2),
              cmp(reason, 'eq', k),
              yes(was[j - 1]),
              no(stopTimes[j - Math.max(1, k) - 1]),
            ]);
          }
        }
        // 重物比故障多保留本段 5 秒；单独 SET 后覆盖，避免支路超过限制。
        b.outputs(O(j), conditions);
        for (let k = 1; k <= j; k++)
          b.and(
            '重物模式保留本段及后段',
            [cmp(state, 'eq', 2), cmp(reason, 'eq', k), cmp(heavy, 'eq', 1), yes(was[j - 1])],
            O(j),
            'set',
          );
        for (let k = 1; k <= j; k++)
          b.and(
            '重物送料时间到',
            [cmp(state, 'eq', 2), cmp(reason, 'eq', k), cmp(heavy, 'eq', 1), yes(stopTimes[j - k])],
            O(j),
            'reset',
          );
      });
      b.and('顺序停机结束', [yes(stopTimes[3])], state, 'move', 0);
      b.and('缺料进料指示', [no(I(8))], O(5));
      b.and('正常落料指示', [yes(I(8))], O(6));
      b.and('落料电磁阀指示', [yes(I(8))], O(7));
      b.and('小车到位', [yes(I(6))], O(8));
      b.and('小车满料', [yes(I(7))], O(9));
      break;
    }
    default:
      throw Error('未知实验');
  }
  return b.p;
}
