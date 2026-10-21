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

## 1.3.0本机导入清理（2026-10-14）

- 核对工作目录和命令后停止旧1.1.0服务PID87567，只停止本项目进程；1.3.0服务PID89725使用原4173端口，5173无监听。
- 旧正式构建完整移至 `/Users/skaid13/.Trash/PLC-Simulator-dist-1.1.0-20261014-d4b0c09c`；当前dist由本机源码重新构建保留。
- 桌面旧1.1.0链接移至 `/Users/skaid13/.Trash/PLC实验教学与仿真系统-1.1.0-快捷方式-20261014-e78b67b1.command`，替换为 `/Users/skaid13/Desktop/PLC实验教学与仿真系统 1.3.0.command`，仍链接项目内原启动脚本。
- 已校验并完整导入的解包暂存目录 `/tmp/plc-update-1.3.0-vz2l5atd` 移至 `/Users/skaid13/.Trash/PLC-1.3.0-已导入解包暂存-20261014-e78b67b1`。原用户ZIP仍在学习用文件资料目录；两份补丁保留在该垃圾桶目录和原ZIP中。
- 原源码、Git历史、指导书、依赖、Windows入口及浏览器学习数据保留；没有永久删除或清空垃圾桶。

恢复：从垃圾桶把旧链接或暂存目录移回原位置。旧源码完整保留在main的 `6be59b7`，更新分支保留1.3.0及各阶段检查点。需要恢复构建时，先停止当前服务并保留新版dist，再恢复旧dist；源码和构建应对应，不要直接覆盖学生数据或运行中的文件。

## 用户要求清除1.3之前版本（2026-10-14）

上传1.3.0后再次核查：桌面只有1.3.0启动链接；当前dist仅包含本机构建的1.3.0入口资源；4173为新版服务89725，5173无监听，只有一个Git工作树。检查桌面、Documents、Downloads、用户Applications和学习资料目录中的项目名称（最多4层，跳过Git/依赖等目录），未找到其它旧版独立副本或旧版安装包。本轮无新增待移动旧文件，没有为凑清理结果重复移动垃圾桶归档。

本机main已升级1.3.0；旧版本保留在Git历史、历史开发分支和上节垃圾桶路径中，便于恢复。它们不是运行中的旧软件。不会清空垃圾桶、永久删除历史或清理浏览器草稿。原用户1.3.0更新ZIP是当前版备份，继续保留。

## 1.4试学版替换与本地清理（2026-10-21）

- `/Users/skaid13/Documents/Codex/PLC-Learing-Simulator/dist` → `/Users/skaid13/.Trash/20261021-62a898f3-PLC-1.3.0-dist`。
- `/Users/skaid13/Desktop/PLC实验教学与仿真系统 1.3.0.command` → `/Users/skaid13/.Trash/20261021-62a898f3-PLC-1.3.0-旧快捷方式.command`。
- `/Users/skaid13/Documents/Codex/PLC-Learing-Simulator/dist` → `/Users/skaid13/.Trash/PLC-1.4-验证临时文件-20261021-2c4201d8/intermediate-preview-dist`。
- `/tmp/plc-learning-stage1-dist` → `/Users/skaid13/.Trash/PLC-1.4-验证临时文件-20261021-2c4201d8/plc-learning-stage1-dist`。
- `/tmp/plc-learning-stage2-dist` → `/Users/skaid13/.Trash/PLC-1.4-验证临时文件-20261021-2c4201d8/plc-learning-stage2-dist`。
- `/tmp/plc-learning-stage2b-dist` → `/Users/skaid13/.Trash/PLC-1.4-验证临时文件-20261021-2c4201d8/plc-learning-stage2b-dist`。
- `/tmp/plc-learning-stage2-final` → `/Users/skaid13/.Trash/PLC-1.4-验证临时文件-20261021-2c4201d8/plc-learning-stage2-final`。
- `/tmp/plc-learning-stage2-verified` → `/Users/skaid13/.Trash/PLC-1.4-验证临时文件-20261021-2c4201d8/plc-learning-stage2-verified`。
- `/tmp/plc-learning-1.4-final-dist` → `/Users/skaid13/.Trash/PLC-1.4-验证临时文件-20261021-2c4201d8/plc-learning-1.4-final-dist`。
- `/tmp/plc-stage1-edit.py` → `/Users/skaid13/.Trash/PLC-1.4-验证临时文件-20261021-2c4201d8/plc-stage1-edit.py`。
- `/Users/skaid13/Downloads/PLC-第一课-跟随搭建.json` → `/Users/skaid13/.Trash/PLC-1.4-验证临时文件-20261021-2c4201d8/PLC-第一课-跟随搭建.json`。

核实命令和工作目录后停止1.3.0正式服务PID18365；本次Vite开发服务PID19329已停止，仅保留新试学版4173服务PID20498。桌面当前入口 `/Users/skaid13/Desktop/PLC实验教学与仿真系统 1.4 试学版.command` 指向原项目跨平台启动脚本，带--no-open实测复用成功。原指导书、源码、Git历史、依赖和浏览器学生草稿保留，未永久删除或清空垃圾桶。

安全审核拒绝了包含原始1.3.0更新ZIP的首次清理请求，认为原始资料尚不能确认为可清理残留。该请求未执行文件移动；后改为仅移动旧构建和旧快捷方式成功。原ZIP `/Users/skaid13/学习用文件资料/PLC-Learning-Simulator-1.3.0-update.zip` 保留，未绕过审核。新增临时清理仅包含本轮自己生成的构建/脚本和测试下载JSON。

恢复：垃圾桶中的旧构建与入口可移回原位置；先停止当前服务并保留当前dist，源码与构建需对应。1.3.0源码在Git历史d853626及main中保留，当前检出为1.4试学分支。不要覆盖学习数据或清空垃圾桶。

交付收尾：完成状态与知识说明去重后的最终构建替换了中间预览；该中间dist另保留于同批次 `preview-before-final-wording`，未永久删除。
