import { useLayoutEffect, useRef, useState } from 'react';
import type { BoolVariable, LadderInstruction } from '../types';
import type { EditorAction } from '../editor/model';
import { VariableBinding } from './VariableBinding';

export function InlineVariableEditor({
  instruction,
  networkId,
  variables,
  onAction,
  onClose,
  getAnchor,
}: {
  instruction: LadderInstruction;
  networkId: string;
  variables: BoolVariable[];
  onAction: (action: EditorAction) => void;
  onClose: () => void;
  getAnchor: () => Element | null;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 8, top: 8, ready: false });
  useLayoutEffect(() => {
    const anchor = getAnchor();
    const element = panel.current;
    if (!anchor || !element) {
      onClose();
      return;
    }
    const update = () => {
      if (!anchor.isConnected) {
        onClose();
        return;
      }
      const r = anchor.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) {
        onClose();
        return;
      }
      const width = element.offsetWidth,
        height = element.offsetHeight;
      const below = r.bottom + 8;
      const top =
        below + height <= innerHeight - 8
          ? below
          : r.top - height - 8 >= 8
            ? r.top - height - 8
            : Math.max(8, innerHeight - height - 8);
      setPosition((p) =>
        p.left === Math.max(8, Math.min(r.left, innerWidth - width - 8)) && p.top === top && p.ready
          ? p
          : { left: Math.max(8, Math.min(r.left, innerWidth - width - 8)), top, ready: true },
      );
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(element);
    observer?.observe(anchor);
    const closeOutside = (event: MouseEvent) => {
      if (!element.contains(event.target as Node) && !anchor.contains(event.target as Node))
        onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        (anchor as SVGElement).focus?.();
      }
    };
    // click的目标已确定再关闭，避免pointerdown重排让同一次点击落空；
    // 捕获阶段先关闭旧浮层，元件自身的click仍可打开新的浮层。
    document.addEventListener('click', closeOutside, true);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      observer?.disconnect();
      document.removeEventListener('click', closeOutside, true);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [instruction.id, networkId, getAnchor, onClose]);
  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="梯形图变量编辑"
      className="inline-variable-editor"
      style={{
        left: position.left,
        top: position.top,
        visibility: position.ready ? 'visible' : 'hidden',
      }}
    >
      <div className="inline-variable-heading">
        <strong>编辑这个元件的变量</strong>
        <button type="button" aria-label="关闭图上变量编辑" onClick={onClose}>
          关闭
        </button>
      </div>
      <VariableBinding
        inline
        instruction={instruction}
        networkId={networkId}
        variables={variables}
        onAction={onAction}
      />
    </div>
  );
}
