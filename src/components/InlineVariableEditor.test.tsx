import { expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Workbench } from '../App';
import { STORAGE_KEY, loadProjects, parseProgram } from '../storage/projects';

it('图上创建与绑定只占一步撤销，第二个元件复用同一变量，改名同步、重开和JSON保留', async () => {
  const user = userEvent.setup();
  const view = render(<Workbench />);
  await user.click(screen.getByRole('button', { name: '常开触点' }));
  await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  let dialog = within(screen.getByRole('dialog', { name: '梯形图变量编辑' }));
  await user.click(dialog.getByText('新建内部变量并绑定'));
  await user.type(dialog.getByLabelText('图上新变量名称'), '保持标志');
  await user.click(dialog.getByRole('button', { name: '创建布尔变量并绑定' }));
  const id = (dialog.getByLabelText('图上元件变量') as HTMLSelectElement).value;
  expect(id).not.toBe('');
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog', { name: '梯形图变量编辑' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '撤销' }));
  expect(
    screen.getByRole('button', { name: '网络 1 常开触点 未绑定变量 位置 1' }),
  ).toBeInTheDocument();
  expect(
    within(screen.getByLabelText('元件变量')).queryByRole('option', { name: /保持标志/ }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '重做' }));
  await user.click(screen.getByRole('button', { name: '输出线圈' }));
  await user.click(screen.getByRole('button', { name: '网络 1 放置线圈' }));
  dialog = within(screen.getByRole('dialog', { name: '梯形图变量编辑' }));
  expect(dialog.getByRole('option', { name: /保持标志/ })).toBeInTheDocument();
  expect(dialog.queryByRole('option', { name: /SIM_IN/ })).not.toBeInTheDocument();
  await user.selectOptions(dialog.getByLabelText('图上元件变量'), id);
  await user.clear(dialog.getByLabelText('图上变量名称'));
  await user.type(dialog.getByLabelText('图上变量名称'), '运行记忆');
  await user.click(dialog.getByRole('button', { name: '保存名称' }));
  expect(
    screen.getByRole('button', { name: '网络 1 常开触点 运行记忆 位置 1' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '网络 1 输出线圈 运行记忆' })).toBeInTheDocument();
  expect(screen.getByLabelText('本程序自定义变量')).toHaveTextContent('运行记忆');
  const stored = loadProjects(localStorage).programs.led;
  expect(stored.variables.filter((v) => v.id === id)).toHaveLength(1);
  const imported = parseProgram(JSON.stringify(stored));
  expect(imported.networks[0].contacts[0].variableId).toBe(id);
  expect(imported.networks[0].coil?.variableId).toBe(id);
  view.unmount();
  render(<Workbench />);
  expect(screen.getByLabelText('本程序自定义变量')).toHaveTextContent('运行记忆');
  await user.click(screen.getByRole('button', { name: '网络 1 输出线圈 运行记忆' }));
  expect(screen.getByLabelText('图上元件变量')).toHaveValue(id);
  expect(localStorage.getItem(STORAGE_KEY)).toContain('运行记忆');
});

it('输入别名在图上与下方属性同步，固定ID/端子不变；运行期间关闭并锁定编辑', async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole('button', { name: '常开触点' }));
  await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  await user.selectOptions(screen.getByLabelText('图上元件变量'), 'input:I-00');
  await user.clear(screen.getByLabelText('图上变量名称'));
  await user.type(screen.getByLabelText('图上变量名称'), '启动按钮');
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '保存名称' }));
  expect(screen.getByLabelText('选中变量名称')).toHaveValue('启动按钮');
  const variable = loadProjects(localStorage).programs.led.variables.find(
    (v) => v.id === 'input:I-00',
  );
  expect(variable).toMatchObject({
    name: '启动按钮',
    id: 'input:I-00',
    terminal: 'I-00',
    kind: 'input',
  });
  await user.click(screen.getByRole('button', { name: '输出线圈' }));
  await user.click(screen.getByRole('button', { name: '网络 1 放置线圈' }));
  await user.selectOptions(screen.getByLabelText('图上元件变量'), 'output:O-00');
  await user.click(screen.getByRole('button', { name: '运行' }));
  expect(screen.queryByRole('dialog', { name: '梯形图变量编辑' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('元件变量')).toBeDisabled();
});

it('空白或重名不创建变量；错误在元件旁显示，原程序保留', async () => {
  const user = userEvent.setup();
  render(<Workbench />);
  await user.click(screen.getByRole('button', { name: '常开触点' }));
  await user.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  const dialog = within(screen.getByRole('dialog'));
  await user.click(dialog.getByText('新建内部变量并绑定'));
  const create = dialog.getByRole('button', { name: '创建布尔变量并绑定' });
  await user.click(create);
  expect(dialog.getByRole('alert')).toHaveTextContent('不能为空');
  await user.type(dialog.getByLabelText('图上新变量名称'), 'SIM_IN_00');
  await user.click(create);
  expect(dialog.getByRole('alert')).toHaveTextContent('同名');
  expect(
    screen.getByRole('button', { name: '网络 1 常开触点 未绑定变量 位置 1' }),
  ).toBeInTheDocument();
});
