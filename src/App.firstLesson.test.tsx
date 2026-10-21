import { it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { FIRST_LESSON_KEY, phaseProgram } from './teaching/firstLesson';
import { STORAGE_KEY } from './storage/projects';

it('从认识到常闭变式走通六阶段，错误预测不通过、每阶段独立且原草稿不被覆盖', async () => {
  const u = userEvent.setup();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, programs: [] }));
  const original = localStorage.getItem(STORAGE_KEY);
  render(<App />);
  await u.click(screen.getByRole('button', { name: '开始第一课：按钮亮灯 →' }));
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  for (const name of ['亮灯按钮', '常开触点', '输出线圈', '指示灯'])
    await u.click(
      within(screen.getByLabelText('认识四个对象')).getByRole('button', { name: new RegExp(name) }),
    );
  await u.click(screen.getByRole('radio', { name: '直接给输入变量写TRUE' }));
  expect(screen.getByText(/触点只读不写/)).toBeInTheDocument();
  await u.click(screen.getByRole('radio', { name: '读取按钮，判断它是否接通' }));
  const next = async () => u.click(screen.getByRole('button', { name: /进入下一阶段/ }));
  const scan = async (input: boolean, lit: boolean) => {
    const control = screen.getByRole('switch', { name: '亮灯按钮' });
    if (control.getAttribute('aria-checked') !== String(input)) await u.click(control);
    await u.click(screen.getByRole('button', { name: lit ? '我预测：灯会亮' : '我预测：灯会灭' }));
    await u.click(screen.getByRole('button', { name: '预测后单步扫描' }));
  };
  const check = async () => u.click(screen.getByRole('button', { name: '检查结构' }));
  const contact = async () => {
    await u.click(screen.getByRole('button', { name: '常开触点' }));
    await u.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
    await u.selectOptions(screen.getByLabelText('元件变量'), 'input:I-00');
  };
  const coil = async () => {
    await u.click(screen.getByRole('button', { name: '输出线圈' }));
    await u.click(screen.getByRole('button', { name: '网络 1 放置线圈' }));
    await u.selectOptions(screen.getByLabelText('元件变量'), 'output:O-00');
  };
  await next();
  await scan(true, false);
  expect(screen.getByText(/预测需要修正/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  await scan(true, true);
  await scan(false, false);
  await next();
  await contact();
  await coil();
  await check();
  await scan(true, true);
  await scan(false, false);
  await next();
  expect(
    screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '网络 1 放置线圈' })).toBeInTheDocument();
  await coil();
  await check();
  await scan(true, true);
  await scan(false, false);
  await next();
  expect(screen.getByRole('button', { name: '网络 1 放置触点 1' })).toBeInTheDocument();
  await contact();
  await coil();
  await check();
  await scan(true, true);
  await scan(false, false);
  // 修改同一程序后，之前的正确扫描不能继续作为证据。
  await u.click(screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' }));
  await u.selectOptions(screen.getByLabelText('触点类型'), 'normallyClosed');
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  await u.selectOptions(screen.getByLabelText('触点类型'), 'normallyOpen');
  await check();
  await scan(true, true);
  await scan(false, false);
  await next();
  await u.click(screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' }));
  await u.selectOptions(screen.getByLabelText('触点类型'), 'normallyClosed');
  await check();
  await scan(true, false);
  await scan(false, true);
  expect(screen.getByRole('heading', { name: '你已经让同一盏灯遵守两种规则' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '完成第一课，进入停止条件 →' })).toBeEnabled();
  expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
  const saved = JSON.parse(localStorage.getItem(FIRST_LESSON_KEY)!);
  expect(saved.phase).toBe(5);
  expect(saved.programs[2].networks[0].contacts[0].contactType).toBe('normallyOpen');
  expect(saved.programs[5].networks[0].contacts[0].contactType).toBe('normallyClosed');
}, 25000);

it('恢复教学草稿和位置，但运行与本次扫描证据不自动恢复；重置取消保留程序', async () => {
  const u = userEvent.setup();
  const p = phaseProgram(4);
  p.name = '我的独立练习';
  localStorage.setItem(
    FIRST_LESSON_KEY,
    JSON.stringify({ version: 1, phase: 4, unlocked: 4, programs: { 4: p } }),
  );
  render(<App />);
  await u.click(screen.getByRole('button', { name: '继续第一课：独立搭建 →' }));
  expect(screen.getByText('我的独立练习')).toBeInTheDocument();
  expect(screen.getByText('③ 最后实际扫描 #0')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  await u.click(screen.getByRole('button', { name: '重新开始本阶段（先备份）' }));
  await u.click(screen.getByRole('button', { name: '取消，保留当前练习' }));
  expect(screen.getByText('我的独立练习')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '常开触点' }));
  await u.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  await u.click(screen.getByRole('button', { name: '撤销本次编辑' }));
  expect(screen.getByRole('button', { name: '网络 1 放置触点 1' })).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '重做本次编辑' }));
  expect(
    screen.getByRole('button', { name: '网络 1 常开触点 未绑定变量 位置 1' }),
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
