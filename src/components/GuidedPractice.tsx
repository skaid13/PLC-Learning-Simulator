import { useEffect, useState } from 'react';
import { createGuide, miniSpecs, type GuideContext } from '../teaching/guide';
import type { GuideTarget } from './GuideHighlight';

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
    [baseline, setBaseline] = useState(0),
    [request, setRequest] = useState(0),
    [storageError, setStorageError] = useState('');
  const current = steps[saved.index];
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
  if (!steps.length || !enabled) return null;
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
        skip && index > saved.index ? [...new Set([...saved.skipped, current.id])] : saved.skipped,
    });
    setBaseline(context.runtime.scan.scanCount);
    setFeedback('');
    setHints(0);
  };
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
            <button onClick={() => move(saved.index + 1)}>继续当前操作</button>
            <button onClick={() => update({ ...saved, active: false })}>收起引导</button>
          </div>
          {feedback && <p role="status">{feedback}</p>}
        </aside>
      )}
      <span className="eyebrow">教学模式 · 真实操作检查</span>
      <h3>从一个网络开始</h3>
      <p>{miniSpecs[id].description}这是基础练习，完整控制任务见实验课程。</p>
      {!saved.active ? (
        <>
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
          <p className="guide-why">为什么：{current.why}</p>
          <div className="guide-actions">
            <button onClick={() => setRequest((n) => n + 1)}>定位要点击的位置</button>
            <button
              onClick={() => {
                const error = current.verify({ ...context, baseline });
                setFeedback(error ?? '本步操作已验证，可以继续。');
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
            <button disabled={!saved.index} onClick={() => move(saved.index - 1, true)}>
              引导上一步
            </button>
            <button className="button primary" onClick={() => move(saved.index + 1)}>
              验证并继续
            </button>
          </div>
          <div className="guide-actions">
            <button
              onClick={() => {
                setBaseline(context.runtime.scan.scanCount);
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
          setBaseline(0);
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
