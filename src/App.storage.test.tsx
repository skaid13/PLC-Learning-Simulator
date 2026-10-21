import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Workbench as App } from './App';
it('新增网络可撤销重做，刷新恢复草稿而不恢复运行状态', async () => {
  const u = userEvent.setup();
  const view = render(<App />);
  await u.click(screen.getByRole('button', { name: '＋ 添加网络' }));
  expect(screen.getByText('2 个网络 · 0 个元件')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '撤销' }));
  expect(screen.getByText('1 个网络 · 0 个元件')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '重做' }));
  view.unmount();
  render(<App />);
  expect(screen.getByText('2 个网络 · 0 个元件')).toBeInTheDocument();
  expect(screen.getByLabelText('扫描状态')).toHaveTextContent('扫描 0 次');
  expect(screen.getByText('已恢复本地草稿。')).toBeInTheDocument();
});
