import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

it('LED 分层课程覆盖原理、双向 I/O、独立练习，已读和章节在切换模式后恢复', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /学习当前实验/ }));
  expect(screen.getByText(/电梯楼层牌/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /02.*控制原理/ }));
  expect(screen.getByText('SET 与 RESET')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '标记本节已读' }));
  await user.click(screen.getByRole('button', { name: '自由模式' }));
  await user.click(screen.getByRole('button', { name: '教学模式' }));
  expect(screen.getByText('SET 与 RESET')).toBeInTheDocument();
  expect(screen.getByLabelText('实验阅读进度')).toHaveAttribute('value', '1');
  await user.click(screen.getByRole('button', { name: /03.*输入与输出/ }));
  const table = screen.getByRole('table', { name: '输入与输出的意义及有效状态' });
  expect(within(table).getByText('输入 I-00')).toBeInTheDocument();
  expect(within(table).getByText('输出 O-07')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /06.*实验理解检查/ }));
  expect(screen.getByRole('heading', { name: '独立练习' })).toBeInTheDocument();
  expect(screen.getByText(/不载入参考：把单段练习改成/)).toBeInTheDocument();
});
