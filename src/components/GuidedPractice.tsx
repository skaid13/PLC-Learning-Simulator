import { useEffect, useRef, useState } from 'react';
import { createGuide, miniSpecs, type GuideContext } from '../teaching/guide';
import type { GuideTarget } from './GuideHighlight';
import type { ScanState } from '../engine/scan';

type Saved = { index: number; active: boolean; skipped: string[]; completed: string[] };
export function GuidedPractice({
  context,
  enabled,
  onTarget,
  onBlank,
}: {
  context: Omit<GuideContext, 'baseline'>;
  enabled: boolean;
  onTarget: (target: GuideTarget | null) => void;
  onBlank: () => void;
}) {
  const id = context.program.experimentId;
  const steps = createGuide(id),
    key = `plc-learning:guide:v1:${id}`;
  const empty: Saved = { index: 0, active: false, skipped: [], completed: [] };
  const [saved, setSaved] = useState<Saved>(() => {
    try {
      const p = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (
        p &&
        Number.isInteger(p.index) &&
        p.index >= 0 &&
        p.index <= steps.length &&
        typeof p.active === 'boolean' &&
        Array.isArray(p.skipped) &&
        Array.isArray(p.completed) &&
        [...p.skipped, ...p.completed].every((v) => typeof v === 'string')
      )
        return p;
    } catch {
      /* 不影响程序草稿。 */
    }
    return empty;
  });
  const [feedback, setFeedback] = useState(''),
    [hints, setHints] = useState(0),
    [baseline, setBaseline] = useState<ScanState | null>(context.runtime.scan),
    [request, setRequest] = useState(0),
    [storageError, setStorageError] = useState('');
  const current = steps[saved.index];
  const [automatic, setAutomaticState] = useState(() => {
    try {
      return localStorage.getItem('plc-learning:guide:auto') !== 'false';
    } catch {
      return true;
    }
  });
  const setAutomatic = (value: boolean) => {
    setAutomaticState(value);
    try {
      localStorage.setItem('plc-learning:guide:auto', String(value));
    } catch {
      /* The preference must never block practice. */
    }
  };
  const entry = useRef<{ index: number; values: unknown[] } | null>(null);
  const update = (p: Saved) => {
    setSaved(p);
    try {
      localStorage.setItem(key, JSON.stringify(p));
    } catch {
      setStorageError('引导进度保存失败；本次可以继续学习。');
    }
  };
  useEffect(() => {
    if (enabled && saved.active && current)
      onTarget({ selector: current.target, text: current.title, request });
    else onTarget(null);
    return () => onTarget(null);
  }, [enabled, saved.active, saved.index, id, request, onTarget]);
  const move = (index: number, skip = false) => {
    if (!skip && index > saved.index) {
      const error = current.verify({ ...context, baseline });
      if (error) {
        setFeedback(error);
        return;
      }
    }
    update({
      ...saved,
      index,
      completed:
        !skip && index > saved.index
          ? [...new Set([...saved.completed, current.id])]
          : saved.completed,
      skipped:
        !skip && index > saved.index
          ? saved.skipped.filter((id) => id !== current.id)
          : skip && index > saved.index
            ? [...new Set([...saved.skipped, current.id])]
            : saved.skipped,
    });
    setBaseline(context.runtime.scan);
    setFeedback('');
    setHints(0);
  };
  // Only a new learner action may advance a step. Existing correct state on
  // restore/review must not cascade through steps or reuse an earlier scan.
  useEffect(() => {
    const values = [
      context.program,
      context.runtime,
      context.editor.tool,
      context.editor.selection?.networkId,
      context.editor.selection?.instructionId,
      context.editor.actionCount ?? 0,
      context.checkedProgram,
      context.explanationScan,
    ];
    if (!enabled || !saved.active || !current || !automatic) {
      entry.current = null;
      return;
    }
    if (!entry.current || entry.current.index !== saved.index) {
      entry.current = { index: saved.index, values };
      return;
    }
    if (values.every((v, i) => v === entry.current!.values[i])) return;
    if (current.verify({ ...context, baseline }) === null) move(saved.index + 1);
  }, [
    enabled,
    saved.active,
    saved.index,
    automatic,
    context.program,
    context.runtime,
    context.editor,
    context.checkedProgram,
    context.explanationScan,
    baseline,
  ]);
  if (!steps.length || !enabled) return null;
  return (
    <section className="guided-practice" aria-label="手把手操作引导">
      {saved.active && current && (
        <aside className="guide-dock" aria-label="当前操作浮动提示">
          <strong>
            {saved.index + 1}/{steps.length} · {current.title}
          </strong>
          <p>{current.instruction}</p>
          <div className="guide-actions">
            <button onClick={() => setRequest((n) => n + 1)}>定位当前操作</button>
            {!automatic && <button onClick={() => move(saved.index + 1)}>继续当前操作</button>}
            <button onClick={() => update({ ...saved, active: false })}>收起引导</button>
          </div>
          {feedback && <p role="status">{feedback}</p>}
        </aside>
      )}
      <span className="eyebrow">教学模式 · 真实操作检查</span>
      <h3>从一个网络开始</h3>
      <p>{miniSpecs[id].description}这是基础练习，完整控制任务见实验课程。</p>
      <label className="guide-auto">
        <input
          type="checkbox"
          checked={automatic}
          onChange={(e) => setAutomatic(e.target.checked)}
        />
        完成操作后自动前进
      </label>
      <p className="guide-small">
        {automatic
          ? '跟随高亮操作即可，无需再点下一步。未达到条件时会停在当前步骤。'
          : '手动模式：可慢慢阅读，完成后点击验证并继续。'}
      </p>
      {!saved.active ? (
        <>
          {context.program.networks.some(
            (n) => n.contacts.length || n.coil || n.branches?.length,
          ) && (
            <p className="guide-small">
              当前已有程序，引导不会自动覆盖。若程序与最小练习不同，请先导出备份，再建立空白练习；也可直接保留程序阅读完整课程。
            </p>
          )}
          <button
            className="button primary full"
            onClick={() => update({ ...saved, active: true })}
          >
            {saved.index ? '继续手把手引导' : '开始手把手引导'}
          </button>
          <button
            className="text-button"
            disabled={context.runtime.status === 'running'}
            onClick={onBlank}
          >
            建立空白练习（先备份）
          </button>
        </>
      ) : current ? (
        <>
          <p className="guide-count">
            操作 {saved.index + 1} / {steps.length} · 已验证 {saved.completed.length} 步
          </p>
          <h4>{current.title}</h4>
          <p>{current.instruction}</p>
          <details className="guide-why">
            <summary>为什么要这样做？</summary>
            <p>{current.why}</p>
          </details>
          <div className="guide-actions">
            <button onClick={() => setRequest((n) => n + 1)}>定位要点击的位置</button>
            <button
              onClick={() => {
                const error = current.verify({ ...context, baseline });
                if (error) setFeedback(error);
                else if (automatic) move(saved.index + 1);
                else setFeedback('本步操作已验证，可以继续。');
              }}
            >
              检查本步
            </button>
          </div>
          {feedback && (
            <p role="status" className="guide-feedback">
              {feedback}
            </p>
          )}
          <button
            className="text-button"
            disabled={hints >= current.hints.length}
            onClick={() => setHints((n) => n + 1)}
          >
            再给一点提示
          </button>
          {current.hints.slice(0, hints).map((h) => (
            <p className="guide-hint" key={h}>
              {h}
            </p>
          ))}
          <div className="guide-actions">
            <button
              disabled={!saved.index}
              onClick={() => {
                setAutomatic(false);
                move(saved.index - 1, true);
              }}
            >
              引导上一步
            </button>
            {!automatic && (
              <button className="button primary" onClick={() => move(saved.index + 1)}>
                验证并继续
              </button>
            )}
          </div>
          <div className="guide-actions">
            <button
              onClick={() => {
                setBaseline(context.runtime.scan);
                setFeedback('本步已重试；程序保留。扫描步骤请重新执行一次。');
                setRequest((n) => n + 1);
              }}
            >
              重试本步
            </button>
            <button onClick={() => move(saved.index + 1, true)}>跳过本步</button>
          </div>
          <p className="guide-small">
            找不到高亮时，先选中对应元件展开属性，再点定位；可跳过或退出，编辑不会被锁住。
          </p>
        </>
      ) : (
        <>
          <h4>基础引导已走完</h4>
          <p>
            验证 {saved.completed.length} 步，跳过 {saved.skipped.length}{' '}
            步。跳过不代表掌握。请回到课程完成独立练习和完整实验。
          </p>
        </>
      )}
      {saved.active && (
        <button className="text-button" onClick={() => update({ ...saved, active: false })}>
          退出引导，保留程序
        </button>
      )}
      <button
        className="text-button"
        onClick={() => {
          update({ ...empty, active: true });
          setBaseline(context.runtime.scan);
          setFeedback('引导进度已重启；程序和运行值保留。');
          setHints(0);
        }}
      >
        重新开始引导（不清程序）
      </button>
      {storageError && <p role="status">{storageError}</p>}
    </section>
  );
}
