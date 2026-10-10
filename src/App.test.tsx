import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { experiments } from './data/experiments';

describe('学习工作台回归检查', () => {
  it('展示三栏、11 个实验和可用的编辑运行功能', () => {
    render(<App />);
    expect(screen.getByLabelText('教学指导区')).toBeInTheDocument();
    expect(screen.getByLabelText('梯形图编程区')).toBeInTheDocument();
    expect(screen.getByLabelText('实验仿真区')).toBeInTheDocument();
    expect(within(screen.getByLabelText('当前实验')).getAllByRole('option')).toHaveLength(11);
    expect(screen.getByRole('button', { name: '停止' })).toBeDisabled();
    for (const name of ['运行', '复位', '单步扫描'])
      expect(screen.getByRole('button', { name })).toBeEnabled();
    for (const name of ['常开触点', '常闭触点', '输出线圈']) {
      expect(screen.getByRole('button', { name })).toBeEnabled();
    }
    expect(screen.getByRole('button', { name: '上一步' })).toBeDisabled();
  });

  it('切换模式保留工作区和入门步骤，允许回顾所有步骤', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText('什么是输入？')).toBeInTheDocument();
    const program = screen.getByText('主程序');
    await user.click(screen.getByRole('button', { name: '自由模式' }));
    expect(screen.getByText('按自己的节奏探索')).toBeInTheDocument();
    expect(screen.getByText('主程序')).toBe(program);
    await user.click(screen.getByRole('button', { name: '教学模式' }));
    expect(screen.getByText('什么是输入？')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /06\s*理解检查/ }));
    expect(screen.getByRole('button', { name: '下一步' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /01\s*认识实验/ }));
    expect(screen.getByText('什么是 PLC？')).toBeInTheDocument();
  });

  it('选择每个实验都更新装置标题、要求及指导书 I/O', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const experiment of experiments) {
      await user.selectOptions(screen.getByLabelText('当前实验'), experiment.id);
      expect(
        within(screen.getByLabelText('实验仿真区')).getByRole('heading', {
          name: experiment.shortName,
        }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: '查看实验要求与 I/O' }));
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('heading', { name: experiment.name })).toBeInTheDocument();
      expect(within(dialog).getByText(experiment.objective)).toBeInTheDocument();
      expect(within(dialog).getAllByRole('table')).toHaveLength(2);
      expect(within(dialog).getByText(experiment.inputs[0].terminal)).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: '关闭弹窗' }));
    }
  });

  it('对错误答案解释原因，再答正确，并可查看参考答案', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /06\s*理解检查/ }));
    expect(screen.getByRole('button', { name: '检查答案' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /指示灯/ }));
    await user.click(screen.getByRole('button', { name: '检查答案' }));
    expect(within(screen.getByLabelText('当前步骤内容')).getByRole('status')).toHaveTextContent(
      '指示灯是输出设备',
    );
    await user.click(screen.getByRole('radio', { name: /按钮/ }));
    expect(
      within(screen.getByLabelText('当前步骤内容')).queryByRole('status'),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '检查答案' }));
    expect(within(screen.getByLabelText('当前步骤内容')).getByRole('status')).toHaveTextContent(
      '正确！',
    );
    await user.click(screen.getByRole('button', { name: '查看参考答案' }));
    expect(screen.getByText(/参考答案：按钮/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '自由模式' }));
    await user.click(screen.getByRole('button', { name: '教学模式' }));
    expect(screen.getByRole('radio', { name: /按钮/ })).toBeChecked();
    expect(within(screen.getByLabelText('当前步骤内容')).getByRole('status')).toHaveTextContent(
      '正确！',
    );
  });

  it('两种模式的解释入口均按未扫描状态提供明确说明', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const mode of ['教学模式', '自由模式']) {
      await user.click(screen.getByRole('button', { name: mode }));
      await user.click(screen.getByRole('button', { name: '为什么这样运行？' }));
      expect(screen.getByRole('dialog')).toHaveTextContent('尚未扫描，无法说明输出原因。');
      await user.click(screen.getByRole('button', { name: '我知道了' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }
  });
});
