import { useRef } from 'react';
import type { ProgramWorkspace } from '../types';
import { downloadText, MAX_FILE_BYTES, parseProgram } from '../storage/projects';
interface Props {
  program: ProgramWorkspace;
  running: boolean;
  canUndo: boolean;
  canRedo: boolean;
  message: string;
  recovery?: string;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onImport: (p: ProgramWorkspace) => void;
  onMessage: (s: string) => void;
  onReference: () => void;
}
export function ProjectToolbar(p: Props) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <section className="project-toolbar" aria-label="程序文件">
      <div className="project-buttons">
        <button disabled={p.running || !p.canUndo} onClick={p.onUndo}>
          撤销
        </button>
        <button disabled={p.running || !p.canRedo} onClick={p.onRedo}>
          重做
        </button>
        <button onClick={p.onSave}>保存草稿</button>
        <button
          onClick={() =>
            downloadText(JSON.stringify(p.program, null, 2), `PLC-${p.program.experimentId}.json`)
          }
        >
          导出 JSON
        </button>
        <button disabled={p.running} onClick={() => file.current?.click()}>
          导入 JSON
        </button>
        <button disabled={p.running} onClick={p.onReference}>
          查看参考程序
        </button>
      </div>
      <input
        ref={file}
        type="file"
        accept=".json,application/json"
        aria-label="导入程序文件"
        className="sr-only"
        onChange={async (e) => {
          const selected = e.target.files?.[0];
          e.target.value = '';
          if (!selected) return;
          try {
            if (selected.size > MAX_FILE_BYTES) throw Error('文件超过 1 MB 限制。');
            p.onImport(parseProgram(await selected.text()));
          } catch (error) {
            p.onMessage(`导入失败：${error instanceof Error ? error.message : '读取文件失败'}`);
          }
        }}
      />
      <p role="status">{p.message}</p>
      {p.recovery && (
        <button onClick={() => downloadText(p.recovery!, 'PLC-原始草稿备份.json')}>
          下载原始草稿备份
        </button>
      )}
    </section>
  );
}
