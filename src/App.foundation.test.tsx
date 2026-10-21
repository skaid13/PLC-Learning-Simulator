import { expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Workbench as App } from './App';
import { FOUNDATION_KEY } from './components/FoundationCourse';
import { STORAGE_KEY } from './storage/projects';

it('完整基础课堂可导航、展开自查，关闭重开恢复位置，阅读不自动判为掌握', async () => {
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole('button', { name: '基础课堂：从零打基础' }));
  const dialog = () => within(screen.getByRole('dialog'));
  expect(
    dialog().getByRole('heading', { name: 'PLC 是什么，程序在控制什么？' }),
  ).toBeInTheDocument();
  expect(within(dialog().getByLabelText('基础课堂目录')).getAllByRole('button')).toHaveLength(10);
  await u.click(dialog().getByRole('button', { name: '下一课' }));
  expect(
    dialog().getByRole('heading', { name: '输入、输出、变量与 TRUE/FALSE' }),
  ).toBeInTheDocument();
  const question = dialog().getByText('1. 如果想保存当前交通灯阶段 1、2、3、4，应选哪类变量？');
  await u.click(question);
  expect(question.closest('details')).toHaveAttribute('open');
  expect(dialog().getByText('已读 0 / 10 课')).toBeInTheDocument();
  await u.click(dialog().getByRole('button', { name: '标记本课已读' }));
  await u.click(dialog().getByRole('button', { name: '关闭弹窗' }));
  await u.click(screen.getByRole('button', { name: '文字基础课堂' }));
  expect(
    dialog().getByRole('heading', { name: '输入、输出、变量与 TRUE/FALSE' }),
  ).toBeInTheDocument();
  expect(dialog().getByText('已读 1 / 10 课')).toBeInTheDocument();
  expect(dialog().getByRole('status')).toHaveTextContent('已读不代表掌握');
});

it('阅读和跳转练习保留已有正式实验草稿，重新打开继续阅读原课', async () => {
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole('button', { name: '常开触点' }));
  await u.click(screen.getByRole('button', { name: '网络 1 放置触点 1' }));
  const before = localStorage.getItem(STORAGE_KEY);
  await u.click(screen.getByRole('button', { name: '文字基础课堂' }));
  const dialog = within(screen.getByRole('dialog'));
  await u.click(dialog.getByRole('button', { name: /10.*从要求到程序/ }));
  expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  await u.click(dialog.getByRole('button', { name: '去练习：独立延时变式' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByLabelText('当前实验')).toHaveValue('starter-delay');
  expect(screen.getByText('1 个网络 · 0 个元件')).toBeInTheDocument();
  await u.selectOptions(screen.getByLabelText('当前实验'), 'led');
  expect(screen.getByText('1 个网络 · 1 个元件')).toBeInTheDocument();
  await u.click(screen.getByRole('button', { name: '文字基础课堂' }));
  expect(
    within(screen.getByRole('dialog')).getByRole('heading', {
      name: '从要求到程序：设计、调试与独立验收',
    }),
  ).toBeInTheDocument();
});

it('损坏的阅读进度回到第一课，不清除程序草稿或自动标记已读', async () => {
  localStorage.setItem(FOUNDATION_KEY, JSON.stringify({ chapter: 'missing', read: ['scan'] }));
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole('button', { name: '文字基础课堂' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByRole('heading', { name: 'PLC 是什么，程序在控制什么？' })).toBeInTheDocument();
  expect(dialog.getByText('已读 0 / 10 课')).toBeInTheDocument();
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
});

it('阅读保存失败仍能继续换课，显示失败说明', async () => {
  const u = userEvent.setup();
  render(<App />);
  await u.click(screen.getByRole('button', { name: '文字基础课堂' }));
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('quota');
  });
  try {
    const dialog = within(screen.getByRole('dialog'));
    await u.click(dialog.getByRole('button', { name: '下一课' }));
    expect(
      dialog.getByRole('heading', { name: '输入、输出、变量与 TRUE/FALSE' }),
    ).toBeInTheDocument();
    expect(dialog.getByRole('status')).toHaveTextContent('阅读进度暂时无法保存');
  } finally {
    spy.mockRestore();
  }
});
