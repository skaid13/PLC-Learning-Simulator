import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Workbench as App } from '../App';

describe('基础 SVG 编辑流程', () => {
  it('放置常开、常闭、线圈，绑定变量并修改类型，检查完整结构', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '常开触点' }));
    await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
    await user.selectOptions(screen.getByLabelText('元件变量'), 'input:I-00');
    const first = screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' });
    expect(first).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '常闭触点' }));
    await user.click(screen.getByRole('button', { name: '网络 1 放置触点 2' }));
    await user.selectOptions(screen.getByLabelText('元件变量'), 'internal:0');
    await user.selectOptions(screen.getByLabelText('触点类型'), 'normallyOpen');
    expect(
      screen.getByRole('button', { name: '网络 1 常开触点 SIM_M_00 位置 2' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '左移选中触点' }));
    expect(screen.getByRole('button', { name: '网络 1 常开触点 SIM_M_00 位置 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: '输出线圈' }));
    await user.click(screen.getByRole('button', { name: '网络 1 放置线圈' }));
    expect(
      within(screen.getByLabelText('元件变量')).queryByRole('option', { name: /SIM_IN/ }),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('元件变量'), 'output:O-00');
    await user.click(screen.getByRole('button', { name: '检查结构' }));
    expect(screen.getByLabelText('结构检查结果')).toHaveTextContent('基础结构检查通过');
    expect(screen.getByRole('button', { name: '运行' })).toBeEnabled();
  });

  it('切换模式和实验保留绘制内容，各实验的端子与程序相互独立', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '常开触点' }));
    await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
    await user.selectOptions(screen.getByLabelText('元件变量'), 'input:I-00');
    await user.click(screen.getByRole('button', { name: '自由模式' }));
    expect(screen.getByRole('button', { name: /网络 1 常开触点 SIM_IN_00/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.selectOptions(screen.getByLabelText('当前实验'), 'traffic');
    expect(
      screen.queryByRole('button', { name: /网络 1 常开触点 SIM_IN_00/ }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '常开触点' }));
    await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
    await user.selectOptions(screen.getByLabelText('元件变量'), 'input:I-01');
    await user.selectOptions(screen.getByLabelText('当前实验'), 'led');
    expect(screen.getByRole('button', { name: /网络 1 常开触点 SIM_IN_00/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '教学模式' }));
    expect(screen.getByRole('button', { name: /网络 1 常开触点 SIM_IN_00/ })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('当前实验'), 'traffic');
    expect(screen.getByRole('button', { name: /网络 1 常开触点 SIM_IN_01/ })).toBeInTheDocument();
  });

  it('误选放置位置只提示，不替换已有程序；删除单个元件后可重新绘制', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
    expect(screen.getByRole('status', { name: '编辑提示' })).toHaveTextContent('请先选择');
    await user.click(screen.getByRole('button', { name: '输出线圈' }));
    await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
    expect(screen.getByRole('status', { name: '编辑提示' })).toHaveTextContent('线圈请放在');
    expect(screen.getByText('1 个网络 · 0 个元件')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '常开触点' }));
    await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
    await user.click(screen.getByRole('button', { name: '删除选中元件' }));
    expect(screen.getByText('1 个网络 · 0 个元件')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '网络 1 放置触点 1' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '网络 1 放置触点 2' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('网络可命名排序，删除需确认，取消会保留元件', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('button', { name: '删除网络 1' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '网络 01' }));
    await user.type(screen.getByLabelText('网络名称'), '保留网络');
    await user.click(screen.getByRole('button', { name: '＋ 添加网络' }));
    await user.type(screen.getByLabelText('网络名称'), '测试网络');
    await user.click(screen.getByRole('button', { name: '常开触点' }));
    await user.click(screen.getByRole('button', { name: '网络 2 放置触点 1' }));
    await user.click(screen.getByRole('button', { name: '上移网络 2' }));
    expect(screen.getByLabelText('网络 1', { selector: 'section' })).toHaveTextContent('测试网络');
    await user.click(screen.getByRole('button', { name: '删除网络 1' }));
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.getByText('2 个网络 · 1 个元件')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '删除网络 1' }));
    await user.click(screen.getByRole('button', { name: '确认删除网络' }));
    expect(screen.getByText('1 个网络 · 0 个元件')).toBeInTheDocument();
    expect(screen.getByText('保留网络')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '删除网络 1' })).toBeDisabled();
  });

  it('结构错误可定位，修改绑定后检查结果即时更新', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '常开触点' }));
    await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
    await user.click(screen.getByRole('button', { name: '检查结构' }));
    await user.click(screen.getByRole('button', { name: /常开触点未选择变量/ }));
    expect(screen.getByRole('button', { name: /网络 1 常开触点 未绑定变量/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.selectOptions(screen.getByLabelText('元件变量'), 'input:I-00');
    expect(screen.getByLabelText('结构检查结果')).not.toHaveTextContent('常开触点未选择变量');
    expect(screen.getByLabelText('结构检查结果')).toHaveTextContent('尚未放置末端线圈');
  });
});
