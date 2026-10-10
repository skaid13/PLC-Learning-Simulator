import { describe, it, expect } from 'vitest';
import { experiments } from './experiments';

describe('指导书实验目录', () => {
  it('保留指导书的 11 个实验顺序与关键端子映射', () => {
    expect(experiments.map((item) => item.number)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
    ]);
    expect(experiments[0].name).toBe('LED数码显示控制');
    expect(experiments[10].name).toBe('自动配料/四节传送带的模拟实验');
    expect(experiments[1].outputs.map((item) => item.terminal)).toEqual(['O-00', 'O-03', 'O-06']);
    expect(experiments[2].inputs.map((item) => item.terminal)).toEqual([
      'I-01',
      'I-02',
      'I-06',
      'I-05',
      'I-04',
      'I-03',
    ]);
    expect(experiments[10].outputs[0].terminal).toBe('O-01');
    expect(new Set(experiments.map((item) => item.id)).size).toBe(11);
    for (const experiment of experiments) {
      expect(experiment.objective.length).toBeGreaterThan(0);
      expect(experiment.requirements.length).toBeGreaterThan(0);
      expect(new Set(experiment.inputs.map((item) => item.terminal)).size).toBe(
        experiment.inputs.length,
      );
      expect(new Set(experiment.outputs.map((item) => item.terminal)).size).toBe(
        experiment.outputs.length,
      );
    }
  });
});
