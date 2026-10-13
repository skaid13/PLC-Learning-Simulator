# 残留清理记录

时间：2026-10-10T16:25:28。全部移动到 macOS 垃圾桶，没有永久删除或清空垃圾桶。

垃圾桶批次目录：`/Users/skaid13/.Trash/PLC-Learning-Simulator-cleanup-20261010-162528`。

| 原位置                                                                                          | 垃圾桶内名称                             | 核验              |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------- |
| `/Users/skaid13/Documents/Codex/PLC-Learing-Simulator/src/components/SimulationPlaceholder.tsx` | `SimulationPlaceholder.tsx`              | 文件 SHA-256 一致 |
| `/tmp/plc-image4.png`                                                                           | `plc-image4.png`                         | 文件 SHA-256 一致 |
| `/tmp/plc-image6.png`                                                                           | `plc-image6.png`                         | 文件 SHA-256 一致 |
| `/tmp/plc-image7.png`                                                                           | `plc-image7.png`                         | 文件 SHA-256 一致 |
| `/tmp/plc-image15.png`                                                                          | `plc-image15.png`                        | 文件 SHA-256 一致 |
| `/tmp/plc-manual-render`                                                                        | `plc-manual-render`                      | 目录完整移动      |
| `/tmp/plc-manual.txt`                                                                           | `plc-manual.txt`                         | 文件 SHA-256 一致 |
| `/tmp/plc-recovery-tests.log`                                                                   | `plc-recovery-tests.log`                 | 文件 SHA-256 一致 |
| `/tmp/plc-stage2-a-tests.log`                                                                   | `plc-stage2-a-tests.log`                 | 文件 SHA-256 一致 |
| `/tmp/plc-stage2-interrupted-20261010.tar.gz`                                                   | `plc-stage2-interrupted-20261010.tar.gz` | 文件 SHA-256 一致 |

保留：原 DOCX 指导书、所有仍在使用的源代码、完整 `.git` 历史、`node_modules`、当前 `dist` 构建、已有用户预览截图。旧中断归档已由 Git 恢复基线 `8603fd7` 及后续已测试提交替代。

恢复方法：在 Finder 打开垃圾桶，找到上面的批次目录，把需要的项目移回“原位置”；也可从 Git 历史恢复已跟踪的废弃组件。不要清空垃圾桶。

## 教学优化清理 2026-10-13 至 2026-10-14

- 开发前4173/5173没有旧服务，没有结束任何无关进程。
- 旧 `dist` 经 Finder 移入 `/Users/skaid13/.Trash/dist`，完整目录可恢复；新 `dist` 为1.1.0构建，继续保留。若恢复旧构建，先停止服务并保留当前构建，勿直接覆盖。
- 本轮实际导出测试新建的 `/Users/skaid13/Downloads/PLC-stepper.json`（只含本轮搭建的SB3→ENA基础练习）已移至 `/Users/skaid13/.Trash/PLC-stepper-QA-20261014.json`，没有永久删除。测试前后原学生草稿未清理。
- 经监听端口、工作目录及命令确认后，仅对本轮Vite PID 85710发送TERM，npm会话已退出，5173无监听。新版正式服务4173继续运行。
- 保留初版main、开发分支全部阶段历史、原指导书、依赖、源码、启动入口和浏览器存储。未清空垃圾桶或卸载工具。

恢复：在Finder垃圾桶找到以上目录/文件，将需要的项目移回原位置。测试JSON可通过工作台主动导入；不会自动覆盖其它实验。新版无需恢复旧构建即可运行。
