import { it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { FIRST_LESSON_KEY, phaseProgram } from './teaching/firstLesson';
import { STORAGE_KEY } from './storage/projects';

it('六阶段：前五只读理解和真实扫描，第六编辑变式；错误不通过且原草稿保留', async () => {
  const u = userEvent.setup();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, programs: [] }));
  const original = localStorage.getItem(STORAGE_KEY);
  render(<App />);
  await u.click(screen.getByRole('button', { name: '开始第一课：按钮亮灯 →' }));
  const next = async () => u.click(screen.getByRole('button', { name: /进入下一阶段/ }));
  const assertReadOnly = () => {
    expect(screen.queryByRole('region', { name: '梯形图编程区' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '检查结构' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('元件变量')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '撤销本次编辑' })).not.toBeInTheDocument();
  };
  const scan = async (input: boolean, lit: boolean) => {
    const control = screen.getByRole('switch', { name: '亮灯按钮' });
    if (control.getAttribute('aria-checked') !== String(input)) await u.click(control);
    await u.click(screen.getByRole('button', { name: lit ? '我预测：灯会亮' : '我预测：灯会灭' }));
    await u.click(screen.getByRole('button', { name: '预测后单步扫描' }));
  };
  assertReadOnly();
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  for (const name of ['常开触点', '输出线圈', '指示灯'])
    await u.click(
      within(screen.getByLabelText('认识四个对象')).getByRole('button', { name: new RegExp(name) }),
    );
  await u.click(screen.getByRole('radio', { name: '直接给输入变量写TRUE' }));
  expect(screen.getByText(/触点只读不写/)).toBeInTheDocument();
  await u.click(screen.getByRole('radio', { name: '读取按钮，判断它是否接通' }));
  await next();
  assertReadOnly();
  await scan(false, true);
  expect(screen.getByText(/预测需要修正/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  await scan(false, false);
  await scan(true, true);
  await next();
  assertReadOnly();
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  await u.click(screen.getByRole('radio', { name: '按钮不经过扫描就直接给灯供电' }));
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  await u.click(screen.getByRole('radio', { name: '触点读取按钮并判断，线圈把判断结果写给灯' }));
  await next();
  assertReadOnly();
  await scan(false, true);
  await scan(true, false);
  await next();
  assertReadOnly();
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  await u.click(screen.getByRole('radio', { name: '把输入变量改名，灯就会自动反着亮' }));
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  await u.click(screen.getByRole('radio', { name: '把常开改为常闭，保留按钮输入和灯输出的绑定' }));
  await next();
  expect(screen.getByRole('heading', { name: '把常开改为常闭' })).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' }));
  await u.selectOptions(screen.getByLabelText('图上触点类型'), 'normallyClosed');
  await u.click(screen.getByRole('button', { name: '检查结构' }));
  await scan(false, true);
  await scan(true, false);
  const complete = screen.getByRole('button', { name: '完成第一课，进入停止条件 →' });
  expect(complete).toBeEnabled();
  await u.click(screen.getByRole('button', { name: '返回编辑程序（保留草稿）' }));
  // 真实修改会取消旧证据，恢复结构后仍需重新扫描，不能继承旧验证。
  await u.selectOptions(screen.getByLabelText('触点类型'), 'normallyOpen');
  expect(complete).toBeDisabled();
  await u.selectOptions(screen.getByLabelText('触点类型'), 'normallyClosed');
  await u.click(screen.getByRole('button', { name: '检查结构' }));
  await scan(false, true);
  await scan(true, false);
  expect(complete).toBeEnabled();
  expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
  const saved = JSON.parse(localStorage.getItem(FIRST_LESSON_KEY)!);
  expect(Object.keys(saved.programs)).toEqual(['5']);
  expect(saved.programs[5].networks[0].contacts[0].contactType).toBe('normallyClosed');
  await u.click(complete);
  expect(JSON.parse(localStorage.getItem(FIRST_LESSON_KEY)!).finished).toBe(true);
  await u.click(screen.getByRole('button', { name: '← 返回第一课学习主线（保留草稿）' }));
  await u.click(screen.getByRole('button', { name: '学习首页' }));
  expect(
    screen.getByRole('heading', { name: '第一课操作已完成：可以回顾或进入下一项目' }),
  ).toBeInTheDocument();
  expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
}, 25000);

it('恢复第六阶段草稿但不恢复扫描证据；重置取消和撤销重做保留程序', async () => {
  const u = userEvent.setup();
  const p = phaseProgram(5);
  p.name = '我的独立练习';
  p.networks[0].contacts = [];
  p.networks[0].coil = null;
  localStorage.setItem(
    FIRST_LESSON_KEY,
    JSON.stringify({ version: 1, phase: 5, unlocked: 5, programs: { 5: p } }),
  );
  render(<App />);
  await u.click(screen.getByRole('button', { name: '继续第一课：变化任务 →' }));
  expect(screen.getByText('我的独立练习')).toBeInTheDocument();
  expect(screen.getByText('③ 最后实际扫描 #0')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /完成第一课/ })).toBeDisabled();
  await u.click(screen.getByRole('button', { name: '重新开始本阶段（先备份）' }));
  await u.click(screen.getByRole('button', { name: '取消，保留当前练习' }));
  expect(screen.getByText('我的独立练习')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '常闭触点' }));
  await u.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  await u.click(screen.getByRole('button', { name: '撤销本次编辑' }));
  expect(screen.getByRole('button', { name: '网络 1 放置触点 1' })).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '重做本次编辑' }));
  expect(
    screen.getByRole('button', { name: '网络 1 常闭触点 未绑定变量 位置 1' }),
  ).toBeInTheDocument();
});

it('损坏教学记录不被自动覆盖', async () => {
  const u = userEvent.setup();
  localStorage.setItem(FIRST_LESSON_KEY, 'broken');
  render(<App />);
  await u.click(screen.getByRole('button', { name: /开始第一课/ }));
  expect(localStorage.getItem(FIRST_LESSON_KEY)).toBe('broken');
  expect(screen.getByRole('button', { name: '下载原始教学记录' })).toBeInTheDocument();
});

it('新旧入口来回切换保留原工作台程序和撤销重做历史', async () => {
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole('button', { name: '完整工作台' }));
  await u.click(screen.getByRole('button', { name: '常开触点' }));
  await u.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  await u.selectOptions(screen.getByLabelText('元件变量'), 'input:I-00');
  await u.click(screen.getByRole('button', { name: '← 返回第一课学习主线（保留草稿）' }));
  await u.click(screen.getByRole('button', { name: '完整工作台' }));
  expect(
    screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' }),
  ).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '撤销' }));
  expect(
    screen.getByRole('button', { name: '网络 1 常开触点 未绑定变量 位置 1' }),
  ).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '重做' }));
  expect(
    screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' }),
  ).toBeInTheDocument();
});

it('存储失败有明确反馈，仍能认识对象和进入示例', async () => {
  const u = userEvent.setup();
  const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('quota');
  });
  try {
    render(<App />);
    await u.click(screen.getByRole('button', { name: /开始第一课/ }));
    expect(screen.getByText(/无法保存教学记录/)).toBeInTheDocument();
    for (const name of ['亮灯按钮', '常开触点', '输出线圈', '指示灯'])
      await u.click(
        within(screen.getByLabelText('认识四个对象')).getByRole('button', {
          name: new RegExp(name),
        }),
      );
    await u.click(screen.getByRole('radio', { name: '读取按钮，判断它是否接通' }));
    await u.click(screen.getByRole('button', { name: '进入下一阶段：观察示例 →' }));
    expect(screen.getByRole('switch', { name: '亮灯按钮' })).toBeInTheDocument();
  } finally {
    fail.mockRestore();
  }
});
