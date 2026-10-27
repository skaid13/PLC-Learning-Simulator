import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { FIRST_LESSON_KEY, phaseProgram } from './teaching/firstLesson';

it('默认展示的按钮计为已读；读完其余三项才出现理解题，错误答案仍不能继续', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /开始第一课/ }));
  const cards = within(screen.getByLabelText('认识四个对象'));
  expect(cards.getByRole('button', { name: /亮灯按钮\s*已查看/ })).toBeInTheDocument();
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  for (const name of ['常开触点', '输出线圈']) {
    await user.click(cards.getByRole('button', { name: new RegExp(name) }));
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  }
  await user.click(cards.getByRole('button', { name: /指示灯/ }));
  expect(screen.getAllByRole('radio')).toHaveLength(3);
  await user.click(screen.getByRole('radio', { name: '直接给输入变量写TRUE' }));
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  await user.click(screen.getByRole('radio', { name: '读取按钮，判断它是否接通' }));
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeEnabled();
});

it.each([1, 3, 4, 5])(
  '第%d阶段先引导默认FALSE的真实扫描，之后只提示剩余TRUE；错误预测不计通过',
  async (phase) => {
    const user = userEvent.setup();
    const program = phaseProgram(1);
    if (phase === 5) program.networks[0].contacts[0].contactType = 'normallyClosed';
    localStorage.setItem(
      FIRST_LESSON_KEY,
      JSON.stringify({ version: 1, phase, unlocked: phase, programs: { [phase]: program } }),
    );
    render(<App />);
    await user.click(screen.getByRole('button', { name: /继续第一课/ }));
    if (phase !== 1) await user.click(screen.getByRole('button', { name: '检查结构' }));
    if (phase >= 4) await user.click(screen.getByRole('button', { name: /需要一点帮助/ }));
    expect(screen.getByRole('heading', { name: '保持断开，先做一次扫描' })).toBeInTheDocument();
    const input = screen.getByRole('switch', { name: '亮灯按钮' });
    expect(input).toHaveAttribute('aria-checked', 'false');
    await user.click(
      screen.getByRole('button', { name: phase === 5 ? '我预测：灯会灭' : '我预测：灯会亮' }),
    );
    await user.click(screen.getByRole('button', { name: '预测后单步扫描' }));
    expect(screen.getByText(/预测需要修正/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /进入下一阶段|完成第一课/ })).toBeDisabled();
    await user.click(
      screen.getByRole('button', { name: phase === 5 ? '我预测：灯会亮' : '我预测：灯会灭' }),
    );
    await user.click(screen.getByRole('button', { name: '预测后单步扫描' }));
    expect(screen.getByRole('heading', { name: '接下来验证接通输入' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /进入下一阶段|完成第一课/ })).toBeDisabled();
    await user.click(input);
    await user.click(
      screen.getByRole('button', { name: phase === 5 ? '我预测：灯会灭' : '我预测：灯会亮' }),
    );
    await user.click(screen.getByRole('button', { name: '预测后单步扫描' }));
    expect(screen.getByRole('button', { name: /进入下一阶段|完成第一课/ })).toBeEnabled();
  },
);

it('跟随搭建阶段结构完整并检查后即可继续，不重复观察扫描', async () => {
  const user = userEvent.setup();
  const program = phaseProgram(1);
  localStorage.setItem(
    FIRST_LESSON_KEY,
    JSON.stringify({ version: 1, phase: 2, unlocked: 2, programs: { 2: program } }),
  );
  render(<App />);
  await user.click(screen.getByRole('button', { name: /继续第一课/ }));
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '检查结构' }));
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeEnabled();
  expect(screen.queryByRole('switch', { name: '亮灯按钮' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' }));
  await user.selectOptions(screen.getByLabelText('元件变量'), 'output:O-00');
  expect(screen.getByRole('button', { name: /进入下一阶段/ })).toBeDisabled();
});

it('重复选择同一变量不复位真实扫描证据、不占撤销；实际改绑定仍取消完成', async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    FIRST_LESSON_KEY,
    JSON.stringify({
      version: 1,
      phase: 4,
      unlocked: 4,
      programs: { 4: phaseProgram(1) },
    }),
  );
  render(<App />);
  await user.click(screen.getByRole('button', { name: /继续第一课/ }));
  await user.click(screen.getByRole('button', { name: '检查结构' }));
  await user.click(screen.getByRole('button', { name: '我预测：灯会灭' }));
  await user.click(screen.getByRole('button', { name: '预测后单步扫描' }));
  await user.click(screen.getByRole('switch', { name: '亮灯按钮' }));
  await user.click(screen.getByRole('button', { name: '我预测：灯会亮' }));
  await user.click(screen.getByRole('button', { name: '预测后单步扫描' }));
  const next = screen.getByRole('button', { name: /进入下一阶段/ });
  expect(next).toBeEnabled();
  await user.click(screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' }));
  const saved = localStorage.getItem(FIRST_LESSON_KEY);
  await user.selectOptions(screen.getByLabelText('图上元件变量'), 'input:I-00');
  expect(next).toBeEnabled();
  expect(screen.getByText('③ 最后实际扫描 #2')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '撤销本次编辑' })).toBeDisabled();
  expect(localStorage.getItem(FIRST_LESSON_KEY)).toBe(saved);
  await user.selectOptions(screen.getByLabelText('图上元件变量'), 'internal:0');
  expect(next).toBeDisabled();
  expect(screen.getByRole('button', { name: '撤销本次编辑' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: '撤销本次编辑' }));
  expect(
    screen.getByRole('button', { name: '网络 1 常开触点 SIM_IN_00 位置 1' }),
  ).toBeInTheDocument();
});

it('第六阶段恢复常开旧草稿时直接指出修改位置，语义未通过不显示扫描，图上可改常闭', async () => {
  const user = userEvent.setup();
  const draft = phaseProgram(5);
  draft.variables.find((v) => v.id === 'input:I-00')!.name = '开关';
  const previous = phaseProgram(1);
  localStorage.setItem(
    FIRST_LESSON_KEY,
    JSON.stringify({ version: 1, phase: 5, unlocked: 5, programs: { 4: previous, 5: draft } }),
  );
  render(<App />);
  await user.click(screen.getByRole('button', { name: /继续第一课/ }));
  expect(screen.getByRole('heading', { name: '把常开改为常闭' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '检查结构' }));
  expect(screen.getByText(/变化任务要求常闭触点/)).toBeInTheDocument();
  expect(screen.queryByRole('switch', { name: '亮灯按钮' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '网络 1 常开触点 开关 位置 1' }));
  await user.selectOptions(screen.getByLabelText('图上触点类型'), 'normallyClosed');
  expect(screen.getByLabelText('触点类型')).toHaveValue('normallyClosed');
  expect(screen.getByLabelText('图上元件变量')).toHaveValue('input:I-00');
  await user.click(screen.getByRole('button', { name: '检查结构' }));
  expect(screen.getByRole('switch', { name: '亮灯按钮' })).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem(FIRST_LESSON_KEY)!);
  expect(saved.programs[4]).toEqual(previous);
  expect(saved.programs[5].variables.find((v: { id: string }) => v.id === 'input:I-00').name).toBe(
    '开关',
  );
});
