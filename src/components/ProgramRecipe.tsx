import { useEffect, useMemo, useState } from 'react';
import type { Experiment, ProgramWorkspace } from '../types';
import { createReferenceProgram } from '../data/referencePrograms';
import { operationNames } from '../editor/validation';
import { recipeMatches } from '../teaching/recipe';
import type { GuideTarget } from './GuideHighlight';

export function ProgramRecipe({
  experiment,
  program,
  onTarget,
}: {
  experiment: Experiment;
  program: ProgramWorkspace;
  onTarget: (target: GuideTarget | null) => void;
}) {
  const recipe = useMemo(() => createReferenceProgram(experiment), [experiment]);
  useEffect(() => () => onTarget(null), [onTarget]);
  const key = `plc-learning:recipe:v1:${experiment.id}`;
  const [index, setIndex] = useState(() => {
    try {
      const n = Number(localStorage.getItem(key));
      return Number.isInteger(n) && n >= 0 && n < recipe.networks.length ? n : 0;
    } catch {
      return 0;
    }
  });
  const [message, setMessage] = useState(''),
    [hints, setHints] = useState(false);
  const matches = recipeMatches(program, recipe),
    network = recipe.networks[index];
  const name = (id?: string | null) => recipe.variables.find((v) => v.id === id)?.name ?? '未绑定';
  const move = (n: number) => {
    setIndex(n);
    setHints(false);
    setMessage('');
    onTarget(null);
    try {
      localStorage.setItem(key, String(n));
    } catch {
      setMessage('搭建位置未能保存；本次仍可继续。');
    }
  };
  return (
    <details className="program-recipe">
      <summary>完整任务：逐网络搭建（不自动填入答案）</summary>
      <p>
        这是依据现有教学参考程序分解的搭建路线。先自己思考，再展开单个网络提示；不用载入整份答案也能逐项完成。其它正确实现可以不同，结构对照不代替运行验收。
      </p>
      <details className="knowledge-card">
        <summary>准备内部变量：类型、名称、初值</summary>
        <p>
          点击编辑区“＋ 布尔变量”或“＋ 数值变量”，再展开“管理内部变量”设置以下名称和数值初值。物理
          I/O 已存在。这里只读对照，不自动更改程序。
        </p>
        <ul>
          {recipe.variables
            .filter((v) => v.id.startsWith('ref:'))
            .map((v) => (
              <li key={v.id}>
                <code>{v.name}</code> ·{' '}
                {v.dataType === 'number' ? `数值，初值 ${v.initialValue ?? 0}` : '布尔，初值 FALSE'}
              </li>
            ))}
        </ul>
        <button
          className="button secondary"
          onClick={() =>
            onTarget({
              selector: '[data-guide="variables"]',
              text: '添加并命名内部变量，再回到搭建清单',
              request: Date.now(),
            })
          }
        >
          定位内部变量工具
        </button>
      </details>
      <p>
        示例结构一致 {matches.filter(Boolean).length} / {matches.length} 个网络；当前程序共{' '}
        {program.networks.length} 个网络。
      </p>
      <h4>
        网络 {index + 1} / {recipe.networks.length} · {network.name}
      </h4>
      <p>
        先分析该网络的条件与作用，再在编辑器对应位置手动搭建。每个网络末端只有一个执行指令；需要多个写入时另建网络，保持顺序。
      </p>
      <button className="text-button" onClick={() => setHints(!hints)}>
        {hints ? '收起本网络提示' : '需要帮助：展开本网络搭建提示'}
      </button>
      {hints && (
        <div className="recipe-hints">
          <ol>
            {[network.contacts, ...(network.branches ?? [])].map((branch, i) => (
              <li key={i}>
                {i ? `并联支路 ${i + 1}` : '主支路'}：
                {branch.length
                  ? branch
                      .map(
                        (c) =>
                          `${c.contactType === 'normallyClosed' ? '常闭' : '常开'} ${name(c.variableId)}${c.comparison ? ` 比较 ${{ eq: '=', ne: '≠', gt: '>', ge: '≥', lt: '<', le: '≤' }[c.comparison.operator]} ${c.comparison.value}` : ''}${c.edge ? '，上升沿' : ''}`,
                      )
                      .join(' → 串联 → ')
                  : '无触点，无条件成立；用于每扫描写入或清除。'}
              </li>
            ))}
          </ol>
          <p>
            末端：{operationNames[network.coil?.operation ?? 'coil']} →{' '}
            {name(network.coil?.variableId)}
            {network.coil?.preset !== undefined && (
              <span>
                ；预置/常数 {network.coil.preset}
                {['ton', 'tof', 'pulse'].includes(network.coil.operation ?? '') ? ' ms' : ''}
              </span>
            )}
            {network.coil?.sourceVariableId && `；读取 ${name(network.coil.sourceVariableId)}`}
            {network.coil?.countVariableId && `；计数显示 ${name(network.coil.countVariableId)}`}
          </p>
          <p>
            常开/常闭在绘图工具选择；数值比较、比较常数、上升沿、执行指令和预置值在选中元件后设置。并联按钮位于每个网络下方。
          </p>
        </div>
      )}
      <div className="guide-actions">
        <button
          onClick={() =>
            onTarget({
              selector: program.networks[index]
                ? `[data-guide="network-${index}"]`
                : '[data-guide="add-network"]',
              text: program.networks[index]
                ? `搭建网络 ${index + 1}，点击元件设置属性`
                : '先添加缺少的网络',
              request: Date.now(),
            })
          }
        >
          定位本网络或添加入口
        </button>
        <button
          onClick={() =>
            setMessage(
              matches[index]
                ? '本网络与示例结构一致；仍需运行观察控制要求。'
                : '本网络尚未与示例一致：检查变量名称/类型/初值、主支路和并联支路、指令参数及网络顺序。等价的其它写法可按课程运行验收。',
            )
          }
        >
          对照本网络结构
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      <div className="guide-actions">
        <button disabled={index === 0} onClick={() => move(index - 1)}>
          前一个搭建网络
        </button>
        <button disabled={index === recipe.networks.length - 1} onClick={() => move(index + 1)}>
          后一个搭建网络
        </button>
      </div>
      <button
        className="text-button"
        onClick={() => {
          const next = matches.findIndex((v) => !v);
          if (next >= 0) move(next);
          else setMessage('全部示例网络结构一致；请按课程逐项验证真实运行，不直接判定实验合格。');
        }}
      >
        找到第一个尚未一致的网络
      </button>
      <button className="text-button" onClick={() => onTarget(null)}>
        结束搭建定位
      </button>
    </details>
  );
}
