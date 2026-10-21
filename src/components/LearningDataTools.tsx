import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { downloadText } from '../storage/projects';
import {
  createLearningBackup,
  parseLearningBackup,
  restoreLearningBackup,
  MAX_BACKUP_BYTES,
  type LearningBackup,
} from '../storage/learningBackup';
export function LearningDataTools() {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState<LearningBackup | null>(null),
    [message, setMessage] = useState(''),
    [backedUp, setBackedUp] = useState(false),
    [accepted, setAccepted] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('plc-open-backup', show);
    return () => window.removeEventListener('plc-open-backup', show);
  }, []);
  const close = () => {
    setOpen(false);
    setPending(null);
    setBackedUp(false);
    setAccepted(false);
    setMessage('');
  };
  if (!open) return null;
  return (
    <div className="learning-shell learning-data-tools">
      <Modal title="备份、恢复或迁移学习数据" onClose={close}>
        <p>
          浏览器版与桌面版各自保存。先在原页面导出全部学习数据，再到应用中导入。原浏览器数据保留，不会自动同步。
        </p>
        <p>包含实验草稿、第一课程序、章节阅读和引导进度；文件仅保存在你选择的位置。</p>
        <div className="lesson-edit-actions">
          <button
            className="button primary"
            onClick={() => {
              try {
                downloadText(
                  JSON.stringify(createLearningBackup(localStorage), null, 2),
                  'PLC-全部学习数据备份.json',
                );
                setBackedUp(true);
                setMessage('已请求保存备份。请确认文件保存成功后再导入或关闭原页面。');
              } catch {
                setMessage('读取或导出失败，原数据保留。');
              }
            }}
          >
            导出全部学习数据
          </button>
          <label className="backup-file">
            选择备份文件
            <input
              aria-label="选择学习数据备份"
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                setPending(null);
                setAccepted(false);
                setBackedUp(false);
                if (!file) return;
                try {
                  if (file.size > MAX_BACKUP_BYTES) throw Error('文件超过16MB限制。');
                  setPending(parseLearningBackup(await file.text()));
                  setMessage('已读取备份，尚未写入。');
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : '文件读取失败。');
                } finally {
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
        {pending && (
          <section className="knowledge-practice">
            <h3>将导入{Object.keys(pending.records).length}项学习记录</h3>
            <p>
              替换备份内的同名数据项，其余现有数据保留。导入后将返回首页，当前未完成的扫描会停止。
            </p>
            <label>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              我已确认当前备份保存成功，并同意替换这些记录
            </label>
            <div className="lesson-edit-actions">
              <button
                className="button primary"
                disabled={!backedUp || !accepted}
                onClick={() => {
                  try {
                    restoreLearningBackup(localStorage, pending);
                    window.location.reload();
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : '导入失败。');
                  }
                }}
              >
                确认导入并重新打开首页
              </button>
              <button className="button secondary" onClick={() => setPending(null)}>
                取消导入
              </button>
            </div>
            <p>确认前，请先用上方“导出全部学习数据”保留当前记录。</p>
          </section>
        )}
        <p role="status">{message}</p>
      </Modal>
    </div>
  );
}
