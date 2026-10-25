import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

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
