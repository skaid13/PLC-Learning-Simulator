import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const inputName = '虚拟输入 SIM_IN_00 启动';
const userForTimer = () => userEvent.setup();
async function draw(user: ReturnType<typeof userForTimer>) {
  await user.click(screen.getByRole('button', { name: '常开触点' }));
  await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  await user.selectOptions(screen.getByLabelText('元件变量'), 'input:I-00');
  await user.click(screen.getByRole('button', { name: '输出线圈' }));
  await user.click(screen.getByRole('button', { name: '网络 1 放置线圈' }));
  await user.selectOptions(screen.getByLabelText('元件变量'), 'output:O-00');
}
const outputRow = () => screen.getByRole('row', { name: /SIM_OUT_00/ });
const scans = () => screen.getByLabelText('扫描状态');

describe('引擎与工作台连接', () => {
  it('不完整程序阻止运行并显示原因；修正后可以单步', async () => {
    const user = userForTimer();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '运行' }));
    expect(screen.getByRole('alert')).toHaveTextContent('尚未放置末端线圈');
    expect(scans()).toHaveTextContent('扫描 0 次');
    expect(vi.getTimerCount()).toBe(0);
    await draw(user);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '单步扫描' }));
    expect(scans()).toHaveTextContent('扫描 1 次');
  });
  it('单步采样输入、写输出并高亮；停止后的输入变化等待下次扫描；复位保留程序', async () => {
    const user = userForTimer();
    render(<App />);
    await draw(user);
    await user.click(screen.getByRole('button', { name: '单步扫描' }));
    expect(within(outputRow()).getByText('FALSE')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: inputName }));
    expect(within(outputRow()).getByText('FALSE')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '单步扫描' }));
    expect(within(outputRow()).getByText('TRUE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' })).toHaveClass(
      'path-true',
    );
    expect(screen.getByRole('button', { name: '网络 1 输出线圈 SIM_OUT_00' })).toHaveClass(
      'path-true',
    );
    await user.click(screen.getByRole('button', { name: '复位' }));
    expect(scans()).toHaveTextContent('扫描 0 次');
    expect(screen.getByRole('switch', { name: inputName })).not.toBeChecked();
    expect(within(outputRow()).getByText('FALSE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /网络 1 常开触点 SIM_IN_00/ })).not.toHaveClass(
      'path-true',
    );
    expect(screen.getByText('1 个网络 · 2 个元件')).toBeInTheDocument();
  });
  it('连续运行按间隔扫描、锁定编辑、响应新输入；停止及卸载清理计时器', async () => {
    const user = userForTimer();
    const view = render(<App />);
    await draw(user);
    await user.click(screen.getByRole('button', { name: '运行' }));
    expect(scans()).toHaveTextContent('扫描 1 次');
    expect(screen.getByRole('button', { name: '常开触点' })).toBeDisabled();
    expect(screen.getByLabelText('元件变量')).toBeDisabled();
    expect(screen.getByRole('button', { name: '网络 1 放置触点 2' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('switch', { name: inputName }));
    act(() => vi.advanceTimersByTime(600));
    expect(scans()).toHaveTextContent('扫描 4 次');
    expect(within(outputRow()).getByText('TRUE')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '停止' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(scans()).toHaveTextContent('扫描 4 次');
    expect(vi.getTimerCount()).toBe(0);
    await user.click(screen.getByRole('button', { name: '运行' }));
    expect(scans()).toHaveTextContent('扫描 5 次');
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('模式切换保留正在运行的程序和输入；复位立即停止连续扫描', async () => {
    const user = userForTimer();
    render(<App />);
    await draw(user);
    await user.click(screen.getByRole('switch', { name: inputName }));
    await user.click(screen.getByRole('button', { name: '运行' }));
    for (const name of ['自由模式', '教学模式']) {
      await user.click(screen.getByRole('button', { name }));
      expect(screen.getByRole('switch', { name: inputName })).toBeChecked();
      expect(screen.getByRole('button', { name: '停止' })).toBeEnabled();
      expect(within(outputRow()).getByText('TRUE')).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: '复位' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(scans()).toHaveTextContent('扫描 0 次');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('切换实验停止并复位运行状态，各程序保留，返回时不会恢复旧计时器', async () => {
    const user = userForTimer();
    render(<App />);
    await draw(user);
    await user.click(screen.getByRole('switch', { name: inputName }));
    await user.click(screen.getByRole('button', { name: '运行' }));
    await user.selectOptions(screen.getByLabelText('当前实验'), 'traffic');
    act(() => vi.advanceTimersByTime(1000));
    expect(scans()).toHaveTextContent('扫描 0 次');
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByText('1 个网络 · 0 个元件')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('当前实验'), 'led');
    expect(screen.getByText('1 个网络 · 2 个元件')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: inputName })).not.toBeChecked();
    expect(within(outputRow()).getByText('FALSE')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '单步扫描' }));
    expect(scans()).toHaveTextContent('扫描 1 次');
  });
  it('停止后修改触点类型自动清除旧结果，常闭在 FALSE 输入时成立', async () => {
    const user = userForTimer();
    render(<App />);
    await draw(user);
    await user.click(screen.getByRole('switch', { name: inputName }));
    await user.click(screen.getByRole('button', { name: '单步扫描' }));
    await user.click(screen.getByRole('button', { name: /网络 1 常开触点 SIM_IN_00/ }));
    await user.selectOptions(screen.getByLabelText('触点类型'), 'normallyClosed');
    expect(scans()).toHaveTextContent('扫描 0 次');
    expect(screen.getByRole('switch', { name: inputName })).not.toBeChecked();
    expect(within(outputRow()).getByText('FALSE')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '单步扫描' }));
    expect(within(outputRow()).getByText('TRUE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /网络 1 常闭触点 SIM_IN_00/ })).toHaveClass(
      'path-true',
    );
  });
});
