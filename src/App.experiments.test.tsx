import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
it('参考程序主动展开，确认替换后可撤销回到空草稿', async () => {
  const u = userEvent.setup();
  render(<App />);
  expect(screen.getByText('1 个网络 · 0 个元件')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '查看参考程序' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('每个图案 1 秒');
  await u.click(screen.getByRole('button', { name: '载入参考程序' }));
  expect(screen.getByRole('button', { name: '撤销' })).toBeEnabled();
  await u.click(screen.getByRole('button', { name: '单步扫描' }));
  await u.click(screen.getByRole('button', { name: '为什么这样运行？' }));
  expect(screen.getByRole('dialog')).toHaveTextContent('依据扫描 #1');
  const button = within(screen.getByRole('dialog')).getAllByRole('button', {
    name: '在梯形图中定位',
  })[0];
  await u.click(button);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('已定位输出的实际写入网络。')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '撤销' }));
  expect(screen.getByText('1 个网络 · 0 个元件')).toBeInTheDocument();
}, 15000);
it('每个实验的理解检查给出专属反馈，切换实验清除旧答案', async () => {
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole('button', { name: /学习当前实验/ }));
  await u.click(screen.getByRole('button', { name: /06.*实验理解检查/ }));
  expect(screen.getByText('SET 条件从 TRUE 变为 FALSE 后，目标值会怎样？')).toBeInTheDocument();
  await u.click(screen.getByRole('radio', { name: '自动变为 FALSE' }));
  await u.click(screen.getByRole('button', { name: '提交实验答案' }));
  expect(within(screen.getByLabelText('实验步骤内容')).getByRole('status')).toHaveTextContent(
    '再想一想',
  );
  await u.selectOptions(screen.getByLabelText('当前实验'), 'traffic');
  await u.click(screen.getByRole('button', { name: /06.*实验理解检查/ }));
  expect(screen.getByText('南北黄灯闪烁期间，东西应显示什么？')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '提交实验答案' })).toBeDisabled();
});
