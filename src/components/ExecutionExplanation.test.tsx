import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExecutionExplanation } from './ExecutionExplanation';
import { createRuntime, runtimeReducer } from '../engine/runtime';
import { createWorkspace } from '../editor/model';
import { experiments } from '../data/experiments';
import type { Simulator } from '../engine/useSimulator';
function fixture(on = false) {
  const p = createWorkspace(experiments[0]);
  p.networks = [
    {
      id: 'n1',
      name: '按钮点灯',
      topology: 'series',
      contacts: [
        { id: 'c1', kind: 'contact', contactType: 'normallyOpen', variableId: 'input:I-00' },
      ],
      coil: { id: 'o1', kind: 'coil', variableId: 'output:O-00', operation: 'set' },
    },
    {
      id: 'n2',
      name: '无条件复位',
      topology: 'series',
      contacts: [],
      coil: { id: 'o2', kind: 'coil', variableId: 'output:O-00', operation: 'reset' },
    },
  ];
  let s = createRuntime(p);
  s = runtimeReducer(s, { type: 'input', program: p, variableId: 'input:I-00', value: on });
  s = runtimeReducer(s, { type: 'step', program: p });
  return { state: s } as Simulator;
}
it('解释使用实际触点条件、写入顺序和最终值，定位返回对应元件', async () => {
  const locate = vi.fn();
  render(<ExecutionExplanation simulator={fixture(true)} target="output:O-00" onLocate={locate} />);
  expect(screen.getByText('A：FALSE')).toBeInTheDocument();
  expect(screen.getByText(/最后实际写入：网络 2/)).toBeInTheDocument();
  expect(screen.getByText(/读取 TRUE/)).toHaveTextContent('成立');
  await userEvent.setup().click(screen.getAllByRole('button', { name: '在梯形图中定位' })[1]);
  expect(locate).toHaveBeenCalledWith('n2', 'o2');
});
it('SET 条件不成立时说明保留而不是虚构写入', () => {
  render(<ExecutionExplanation simulator={fixture()} target="output:O-00" onLocate={vi.fn()} />);
  expect(screen.getByText(/条件不成立，本指令未写入；保留 FALSE/)).toBeInTheDocument();
});
it('未执行时不制造动态原因', () => {
  const simulator = fixture();
  simulator.state = {
    ...simulator.state,
    scan: { ...simulator.state.scan, scanCount: 0, traces: [] },
  };
  render(<ExecutionExplanation simulator={simulator} onLocate={vi.fn()} />);
  expect(screen.getByText(/尚未扫描，无法说明输出原因/)).toBeInTheDocument();
  expect(screen.queryByText(/最后实际写入/)).not.toBeInTheDocument();
});
