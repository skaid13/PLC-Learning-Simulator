import { it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { knowledgeDetails, knowledgeGroups } from './data/knowledge';
import { instructionHelp } from './components/InstructionHelp';

it('新手只有一条第一课主线，知识与正式课程按需打开', async () => {
  const u = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('heading', { name: '让一盏灯，按你的规则亮起来。' })).toBeInTheDocument();
  expect(screen.queryByLabelText('当前实验')).not.toBeInTheDocument();
  expect(within(screen.getByLabelText('第一课学习顺序')).getAllByRole('listitem')).toHaveLength(6);
  await u.click(screen.getByRole('button', { name: '知识工具箱' }));
  const d = within(screen.getByRole('dialog'));
  await u.click(d.getByRole('button', { name: '常闭触点' }));
  expect(d.getByText(/不能推断硬件接线/)).toBeInTheDocument();
  expect(d.getByText(/输入FALSE时灯亮/)).toBeInTheDocument();
  await u.click(d.getByRole('button', { name: '关闭弹窗' }));
  await u.click(screen.getByRole('button', { name: '课程与实验' }));
  expect(
    within(screen.getByRole('dialog')).getByRole('button', { name: '实验01 · LED 数码显示' }),
  ).toBeInTheDocument();
});

it('元件和知识目录都有选择理由、区别及可操作验证', () => {
  for (const topic of new Set([
    ...Object.keys(instructionHelp),
    ...knowledgeGroups.flatMap((g) => g.topics),
  ])) {
    expect(knowledgeDetails[topic]?.purpose.length).toBeGreaterThan(10);
    expect(knowledgeDetails[topic]?.difference.length).toBeGreaterThan(10);
    expect(knowledgeDetails[topic]?.practice.length).toBeGreaterThan(10);
  }
});
