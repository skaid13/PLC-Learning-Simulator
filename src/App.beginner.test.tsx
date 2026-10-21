import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Workbench as App } from './App';
import { STORAGE_KEY } from './storage/projects';

it('按钮小项目无需下一步，错误变量不推进，新扫描验证通断并保留独立草稿', async () => {
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole('button', { name: /按钮亮灯.*打开独立练习/ }));
  const guide = () => within(screen.getByLabelText('手把手操作引导'));
  await u.click(guide().getByRole('button', { name: '开始手把手引导' }));
  expect(guide().queryByRole('button', { name: '验证并继续' })).not.toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '常开触点' }));
  expect(guide().getByRole('heading', { name: '放置第一个触点' })).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  await u.selectOptions(screen.getByLabelText('元件变量'), 'output:O-00');
  expect(guide().getByRole('heading', { name: '给触点绑定输入' })).toBeInTheDocument();
  await u.selectOptions(screen.getByLabelText('元件变量'), 'input:I-00');
  await u.click(screen.getByRole('button', { name: '输出线圈' }));
  await u.click(screen.getByRole('button', { name: '网络 1 放置线圈' }));
  await u.selectOptions(screen.getByLabelText('元件变量'), 'output:O-00');
  await u.click(screen.getByRole('button', { name: '检查结构' }));
  await u.click(screen.getByRole('switch', { name: /SIM_IN_00/ }));
  expect(guide().getByRole('heading', { name: '单步验证接通结果' })).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '单步扫描' }));
  expect(guide().getByRole('heading', { name: '断开输入' })).toBeInTheDocument();
  await u.click(screen.getByRole('switch', { name: /SIM_IN_00/ }));
  expect(guide().getByRole('heading', { name: '单步验证断开结果' })).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '单步扫描' }));
  await u.click(screen.getByRole('button', { name: '为什么这样运行？' }));
  await u.click(screen.getByRole('button', { name: '我知道了' }));
  expect(guide().getByRole('heading', { name: '基础引导已走完' })).toBeInTheDocument();
  await u.selectOptions(screen.getByLabelText('当前实验'), 'led');
  expect(screen.getByText('1 个网络 · 0 个元件')).toBeInTheDocument();
  await u.selectOptions(screen.getByLabelText('当前实验'), 'starter-lamp');
  expect(screen.getByText('1 个网络 · 2 个元件')).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(
    saved.programs.find((p: { experimentId: string }) => p.experimentId === 'starter-lamp'),
  ).toBeDefined();
}, 20000);

it('刷新已正确的草稿不会自动跳步，回顾切换到手动模式', async () => {
  const u = userEvent.setup();
  const first = render(<App />);
  await u.click(screen.getByRole('button', { name: /按钮亮灯.*打开独立练习/ }));
  await u.click(screen.getByRole('button', { name: '开始手把手引导' }));
  await u.click(screen.getByRole('button', { name: '常开触点' }));
  await u.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  first.unmount();
  render(<App />);
  await u.click(screen.getByRole('button', { name: /按钮亮灯.*打开独立练习/ }));
  const guide = within(screen.getByLabelText('手把手操作引导'));
  expect(guide.getByRole('heading', { name: '给触点绑定输入' })).toBeInTheDocument();
  expect(guide.getByText(/操作 3 \/ 12/)).toBeInTheDocument();
  await u.click(guide.getByRole('button', { name: '引导上一步' }));
  expect(guide.getByRole('checkbox', { name: '完成操作后自动前进' })).not.toBeChecked();
  expect(guide.getByRole('heading', { name: '放置第一个触点' })).toBeInTheDocument();
}, 15000);

it('恢复已放置触点的步骤不会把编辑器挂载通知当成新操作', async () => {
  const u = userEvent.setup();
  const first = render(<App />);
  await u.click(screen.getByRole('button', { name: /按钮亮灯.*打开独立练习/ }));
  await u.click(screen.getByRole('button', { name: '开始手把手引导' }));
  await u.click(screen.getByRole('button', { name: '常开触点' }));
  await u.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  first.unmount();
  const key = 'plc-learning:guide:v1:starter-lamp';
  const saved = JSON.parse(localStorage.getItem(key)!);
  saved.index = 1;
  localStorage.setItem(key, JSON.stringify(saved));
  render(<App />);
  await u.click(screen.getByRole('button', { name: /按钮亮灯.*打开独立练习/ }));
  const guide = within(screen.getByLabelText('手把手操作引导'));
  expect(guide.getByRole('heading', { name: '放置第一个触点' })).toBeInTheDocument();
  expect(screen.getByText('1 个网络 · 1 个元件')).toBeInTheDocument();
}, 15000);

it('选中元件可展开解析，切换指令显示对应说明和易错点', async () => {
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole('button', { name: '输出线圈' }));
  await u.click(screen.getByRole('button', { name: '网络 1 放置线圈' }));
  const inspector = within(screen.getByLabelText('元件属性'));
  await u.selectOptions(screen.getByLabelText('执行指令'), 'ton');
  await u.click(inspector.getByText('元件解析：TON · 持续满足后延时接通'));
  expect(
    inspector.getByText('元件解析：TON · 持续满足后延时接通').closest('details'),
  ).toHaveAttribute('open');
  expect(inspector.getByText(/停止期间时间冻结/)).toBeInTheDocument();
  await u.selectOptions(screen.getByLabelText('执行指令'), 'set');
  expect(inspector.getByText('元件解析：SET · 记住接通状态')).toBeInTheDocument();
});
