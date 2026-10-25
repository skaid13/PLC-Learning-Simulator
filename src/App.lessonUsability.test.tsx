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
