import { useEffect, useState } from 'react';
type Rect = { left: number; top: number; width: number; height: number; tipTop: number };
export interface GuideTarget {
  selector: string;
  text: string;
  request: number;
}
export function GuideHighlight({
  target,
  showCallout = true,
  missingText,
}: {
  target: GuideTarget | null;
  showCallout?: boolean;
  missingText?: string;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const find = () => document.querySelector(target.selector);
    const initial = find();
    const scrollTarget =
      typeof initial?.scrollIntoView === 'function' ? initial : initial?.closest('svg');
    const bounds = initial?.getBoundingClientRect();
    if (
      bounds &&
      (bounds.top < 8 ||
        bounds.bottom > window.innerHeight - 8 ||
        bounds.left < 8 ||
        bounds.right > window.innerWidth - 8)
    )
      scrollTarget?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    const update = () => {
      const element = find();
      if (!element) {
        setRect(null);
        return;
      }
      const r = element.getBoundingClientRect();
      if (
        !r.width ||
        !r.height ||
        r.bottom < 0 ||
        r.top > window.innerHeight ||
        r.right < 0 ||
        r.left > window.innerWidth
      ) {
        setRect(null);
        return;
      }
      const next = {
        left: Math.max(4, r.left - 4),
        top: Math.max(4, r.top - 4),
        width: Math.min(r.width + 8, window.innerWidth - 8),
        height: r.height + 8,
        tipTop: r.bottom + 62 < window.innerHeight ? r.bottom + 10 : Math.max(4, r.top - 54),
      };
      setRect((p) =>
        p && Object.keys(next).every((k) => p[k as keyof Rect] === next[k as keyof Rect])
          ? p
          : next,
      );
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const observer = new MutationObserver(update);
    observer.observe(document.getElementById('root') ?? document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [target]);
  if (!target) return null;
  if (!rect)
    return (
      <div className="guide-missing" role="status">
        {missingText ?? (
          <>
            当前定位目标未显示或已移出视野：{target.text}
            。先选中对应元件展开属性，再点“定位当前操作”；也可重试、跳过或退出引导。
          </>
        )}
      </div>
    );
  return (
    <div className="guide-highlight-layer" aria-hidden="true">
      <div
        className="guide-ring"
        style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
      />
      {showCallout && (
        <div
          className="guide-callout"
          style={{
            left: Math.min(rect.left, Math.max(8, window.innerWidth - 288)),
            top: rect.tipTop,
          }}
        >
          {target.text}
        </div>
      )}
    </div>
  );
}
