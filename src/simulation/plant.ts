import type { BoolValues, RuntimeValues } from '../engine/scan';
export interface PlantState {
  x: number;
  y: number;
  pieceX: number;
  pieceY: number;
  held: boolean;
  floor: number;
  pool: number;
  tower: number;
  level: number;
  angle: number;
  pulses: number;
  delivered: number;
  position: number;
  flow: number;
  previous: RuntimeValues;
  alerts: string[];
}
export const sensorTerminals: Record<string, number[]> = {
  arm: [3, 4, 5, 6],
  elevator: [7, 8, 9],
  water: [0, 1, 2, 3],
  mix: [1, 2, 3],
};
export function createPlant(): PlantState {
  return {
    x: 0,
    y: 0,
    pieceX: 0,
    pieceY: 1,
    held: false,
    floor: 1,
    pool: 0.18,
    tower: 0.2,
    level: 0,
    angle: 0,
    pulses: 0,
    delivered: 0,
    position: 0,
    flow: 0,
    previous: {},
    alerts: [],
  };
}
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
export function plantSensors(id: string, p: PlantState): BoolValues {
  const inputs: Record<number, boolean> =
    id === 'arm'
      ? { 6: p.x <= 0.001, 5: p.x >= 0.999, 4: p.y <= 0.001, 3: p.y >= 0.999 }
      : id === 'elevator'
        ? {
            7: Math.abs(p.floor - 1) < 0.04,
            8: Math.abs(p.floor - 2) < 0.04,
            9: Math.abs(p.floor - 3) < 0.04,
          }
        : id === 'water'
          ? { 0: p.tower >= 0.85, 1: p.tower <= 0.25, 2: p.pool >= 0.85, 3: p.pool <= 0.25 }
          : id === 'mix'
            ? { 1: p.level >= 0.9, 2: p.level >= 0.55, 3: p.level >= 0.15 }
            : {};
  return Object.fromEntries(
    Object.entries(inputs).map(([n, v]) => [`input:I-${n.padStart(2, '0')}`, v]),
  );
}
export function advancePlant(
  id: string,
  previous: PlantState,
  values: RuntimeValues,
  inputs: BoolValues,
  stalled = false,
  deltaMs = 200,
): PlantState {
  const p = { ...previous, previous: { ...values }, alerts: [] as string[] };
  const on = (n: number) => values[`output:O-${String(n).padStart(2, '0')}`] === true;
  const was = (n: number) => previous.previous[`output:O-${String(n).padStart(2, '0')}`] === true;
  const dt = deltaMs / 1000;
  if (stalled) {
    p.alerts.push('已注入执行器卡滞；输出仍由梯形图决定。');
    return p;
  }
  if (id === 'stepper' && on(0) && !was(0) && on(6)) {
    p.pulses++;
    p.angle += ((on(3) ? -1 : 1) * 360) / 1600;
  }
  if (id === 'arm') {
    if (on(2) && on(3)) p.alerts.push('左右输出同时接通，水平运动被阻止。');
    else p.x = clamp(p.x + (((on(3) ? 1 : 0) - (on(2) ? 1 : 0)) * dt) / 3);
    if (on(4) && on(5)) p.alerts.push('上下输出同时接通，垂直运动被阻止。');
    else p.y = clamp(p.y + (((on(5) ? 1 : 0) - (on(4) ? 1 : 0)) * dt) / 3);
    if (on(1) && Math.abs(p.x - p.pieceX) < 0.12 && Math.abs(p.y - p.pieceY) < 0.12) p.held = true;
    if (p.held) {
      p.pieceX = p.x;
      p.pieceY = p.y;
      if (!on(1)) p.held = false;
    }
  }
  if (id === 'elevator') {
    if (inputs['input:I-10']) p.floor = 1;
    else if (on(3) && on(4)) p.alerts.push('升降输出冲突，轿厢停住。');
    else p.floor = clamp(p.floor + (((on(4) ? 1 : 0) - (on(3) ? 1 : 0)) * dt) / 4, 1, 3);
  }
  if (id === 'water') {
    p.pool = clamp(p.pool + ((on(1) ? 0.25 : 0) - (on(0) ? 0.16 : 0)) * dt);
    p.tower = clamp(p.tower + ((on(0) ? 0.15 : 0) - 0.012) * dt);
    if (on(0) && p.pool <= 0) p.alerts.push('水池已空，检查泵的缺水互锁。');
  }
  if (id === 'mix') {
    p.level = clamp(p.level + ((on(0) ? 0.16 : 0) + (on(1) ? 0.16 : 0) - (on(2) ? 0.2 : 0)) * dt);
    if (on(0) && on(1)) p.alerts.push('A、B 进液阀同时接通，检查步骤条件。');
  }
  if (id === 'assembly') {
    const active = Array.from({ length: 8 }, (_, i) => i).filter(on);
    if (active.length > 1) p.alerts.push('多个工位同时激活，请检查互锁。');
    if (active.length === 1) p.position = active[0];
  }
  if (id === 'vending' && on(9) && !was(9)) p.delivered++;
  if (id === 'conveyor') {
    const section = Math.floor(p.position) % 4;
    if (on(section + 1)) p.position += dt / 3;
    if (p.position >= 4) p.position = 0;
    p.flow += Array.from({ length: 4 }, (_, i) => (on(i + 1) ? dt : 0)).reduce((a, b) => a + b, 0);
  }
  if (id === 'traffic' && (on(2) || on(3))) p.flow += dt;
  if (id === 'traffic' && on(2) && on(3))
    p.alerts.push('冲突：东西与南北绿灯同时亮，请检查相位互锁。');
  return p;
}
