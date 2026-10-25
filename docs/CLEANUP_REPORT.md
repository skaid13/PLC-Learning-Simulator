# 残留清理记录

## 2.0.2正式优化版清理（2026-10-25）

核对生产导入图、全局符号与路径搜索后，将无运行/测试引用的`src/data/lesson.ts`（1264字节，SHA256 682d7e33034c139f1749c32906edfaf5e9cd0e7471a2c7f3d4febd41be2d4a44）移至`~/.Trash/PLC-2.0.2-unused-source-20261025-223717/lesson.ts`。仅旧目录文档提及该文件，现课程由其他模块提供；源码仍可从Git历史恢复，不影响指导书或课程。

升级前数据完整备份：`~/Library/Application Support/PLC-Learning-Simulator-backups/before-release-2.0.2-20261025-224558/data`；旧试用.app：`~/.Trash/PLC-2.0.2-optimized-upgrade-20261025-224558/PLC学习实验室.app`。原安装位置替换正式优化版，桌面链接不变，原App Support未清理。新原生导出的5项records与2.0.1备份完全一致，全部个人备份保留本地。

旧2.0.1 ZIP及校验、过往本机临时清单、本轮desktop-staging/mac-arm64/builder-debug及解包验证目录共12项528文件751448317字节，校验后移至`~/.Trash/PLC-2.0.2-release-residue-20261025-225024`。批次内RESTORE-MANIFEST.json包含原位置与摘要；当前gitignored release保留正式2.0.2 ZIP/校验及核验清单。没有删除Git历史、原指导书、依赖、配置、用户草稿/备份或清空垃圾桶。只停止本轮5184/PID52244，临时页面关闭。恢复前退出当前应用、另存当前草稿，再按批次清单移回，勿覆盖新学习数据。

## 2.0.2本机布局更新（2026-10-25）

升级前正常退出旧应用，完整数据备份保留于`~/Library/Application Support/PLC-Learning-Simulator-backups/before-2.0.2-20261025-222147/data`；旧2.0.1应用移至`~/.Trash/PLC-2.0.2-upgrade-20261025-222147/PLC学习实验室.app`，安装2.0.2，桌面链接有效，原数据目录未清理。

`desktop-staging`、`release/mac-arm64`、`builder-debug.yml`共3项311023368字节移至`~/.Trash/PLC-2.0.2-build-residue-20261025-222354`，移动前后树摘要一致，内有RESTORE-MANIFEST.json，项目gitignored release亦有本机清单。保留2.0.1正式下载ZIP、源码/配置/依赖/Git/用户备份，不永久删除或清空垃圾桶。只停止本轮5184/PID51055，4173/5173/5184无监听；2.0.2菜单退出无应用进程，随后重开供用户使用。恢复旧应用或数据前先退出当前应用并另存当前学习数据，按清单移回，勿直接覆盖新草稿。

## 2.0.1更新与过往产物清理（2026-10-25）

旧2.0应用正常菜单退出后，完整数据目录备份保存于`~/Library/Application Support/PLC-Learning-Simulator-backups/before-2.0.1-20261025-215751/data`，仅本地保留、不上传；原数据目录未移动。旧.app移至`~/.Trash/PLC-2.0.1-upgrade-20261025-215751/PLC学习实验室.app`，原位置安装2.0.1，桌面链接继续使用。安装和正式ZIP的app.asar均为`09703794e365198de8a372f399e4289aaf3acaf88df6952b37fd4358e9893c1f`。升级后4/6及独立搭建原草稿保留；新原生导出`~/Downloads/PLC-after-2.0.1-20261025.json`保留作用户备份，未作为残留或上传。

本轮临时/旧产物批次`~/.Trash/PLC-2.0.1-residue-20261025-220102`：9项、523文件、751430282字节，移动前后树摘要一致。包含`desktop-staging`、`release/mac-arm64`、本轮系统解包验证目录、builder-debug.yml、旧2.0 ZIP及其SHA256SUMS.txt、旧本机安装/发布临时清单，以及核对内部测试变量ID后的QA专用`PLC-led.json`。批次内`RESTORE-MANIFEST.json`有完整原路径、目标和摘要；项目gitignored `release/cleanup-2.0.1.json`亦保留。当前仅保留正式2.0.1 ZIP/校验文件和本机核验清单，源代码和构建配置不清除。

只对命令和项目路径明确匹配的Vite PID48175/5184发送TERM，未停止其他Node或其他项目；4173/5173/5184无监听，临时浏览器页关闭，视口覆盖已恢复。原生菜单退出后应用主/辅助进程全部退出，随后重新打开新版首页供用户使用。没有永久删除、清空垃圾桶、卸载依赖或清理学生数据。

恢复旧应用：先退出新版，另存当前学习备份，再从上述垃圾桶批次取回旧.app；不要覆盖当前数据目录。只有确需完整回退数据时才从升级前backup复制，先保留当前目录。其余产物按恢复清单移回原路径，旧2.0发布仍可从GitHub恢复，Git标签和历史保持。

## 2.0发布构建清理（2026-10-21）

已退出的1.4.1应用移入 `/Users/skaid13/.Trash/PLC-2.0升级前应用-20261021-124136/PLC学习实验室.app`，原安装位置替换为实际核验的2.0.0，桌面链接继续使用。应用学习数据目录保持原位置，未清理。2.0导出备份留在Downloads，与此前五项记录一致，不提交公共仓库。

验证完成的 `desktop-staging`、`release/mac-arm64`、`release/verify-unpacked` 与 `release/builder-debug.yml` 移至 `/Users/skaid13/.Trash/PLC-2.0发布验证暂存-20261021-124442` 内对应名称；该批次均可恢复。正式2.0 Mac ZIP、SHA256SUMS与本机核验清单保留在gitignored release目录用于上传及离线核验。没有永久删除、清空垃圾桶或重启旧网页服务。恢复旧.app前退出新应用并另存当前学习备份，不覆盖应用数据目录。

## 最新：移除网页版入口与重复构建（2026-10-21）

按用户“把残留文件清除，包括网页版那个”的要求，在 `76945c9` 交付后清理。共14次移动、229个文件、212,504,030字节（约203MiB，移动到垃圾桶并未释放磁盘空间）。所有文件移动前后SHA256相同，未永久删除或清空垃圾桶。

批次：`/Users/skaid13/.Trash/PLC-网页版与开发残留-20261021-113859`。完整原位置/目标/数量见 [清单](CLEANUP_20261021.json)；垃圾桶批次内的 `恢复清单.json` 另含逐文件校验值。

| 原位置或用途                             | 垃圾桶批次内名称                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 项目根目录旧网页构建                     | `dist`                                                                                                                                            |
| 重复桌面构建资源                         | `desktop-staging`                                                                                                                                 |
| 打包调试残留                             | `release`                                                                                                                                         |
| 原网页启动与静态服务源码                 | `scripts`（仅launch.mjs、serve.mjs）                                                                                                              |
| Mac/Windows旧网页双击入口                | `启动PLC学习工作台.command`、`启动PLC学习工作台.bat`                                                                                              |
| 本轮专用Swift图标编译缓存                | `plc-swift-modules`                                                                                                                               |
| 本轮临时清理清单、旧UI截图及技能下载文本 | `plc-1.4-cleanup.json`、`plc-141-blue-cleanup.json`、`plc-ui-141-cleanup.json`、`plc-ui-141-before.png`、`plc-ui-skill-0.md`、`plc-ui-skill-1.md` |
| 清理后构建验证新生成的资源               | `desktop-staging-清理后构建验证`                                                                                                                  |

保留：已安装 `/Users/skaid13/Applications/PLC学习实验室.app` 与桌面链接、App Support学习数据、原浏览器学习记录、学习资料与Downloads中的导出备份、原始ZIP/DOCX、React共用源码、图标源文件、依赖、锁文件和Git。没有卸载共享工具，没有修改其它项目或重新清理旧垃圾桶批次。

原网页双击启动和服务器不再作为当前交付，npm启动/构建改为桌面流程。`npm run dev` 仅作为开发调试能力保留，不自动运行。Mac/Windows桌面打包命令保留，普通用户直接打开已安装应用。

验证：27文件160项功能测试、2项桌面路径测试、类型/桌面构建通过；清理后生成的暂存资源也已移走。从桌面链接实际重新启动应用，确认 `plc-app://learning/index.html` 首页及第一课正常显示；Command+Q退出后无应用进程，4173/5173无监听。已安装app.asar清理前SHA256为 `62570ecc4ec4dd33021233ffbde59b73b40d10340f586cd188acd032388a65ea`，未修改安装包。Windows/Intel实机未测。本轮不上传GitHub。

恢复：在Finder垃圾桶中找到上述批次，根据清单把需要的条目移回原位置，勿覆盖新的文件。若需恢复整套旧网页脚本、npm配置及用法，可从Git检查点 `76945c9` 在独立分支查看/恢复；清理暂存构建无需恢复，开发/打包命令会重新生成。学习数据原位置一直保留，无需从垃圾桶恢复。以下均为历史记录，所述“当前dist/旧网页脚本保留”仅描述当时状态。

## 1.4.1独立桌面应用（2026-10-21）

新安装`/Users/skaid13/Applications/PLC学习实验室.app`，桌面`/Users/skaid13/Desktop/PLC学习实验室.app`链接到该应用。已精确停止原网页服务22462；4173/5173无监听。关闭应用后进程全部退出；交付时再次打开应用供试学。

| 原位置/内容                                                     | 垃圾桶位置                                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 首次打包验证release/mac-arm64                                   | /Users/skaid13/.Trash/PLC-桌面应用首次验证-20261021                                 |
| 加入迁移入口前的dist                                            | /Users/skaid13/.Trash/PLC-1.4.1-网页迁移入口更新前-20261021                         |
| 保存标题修订前的打包目录                                        | /Users/skaid13/.Trash/PLC-桌面打包验证残留-20261021/packaged-before-save-title      |
| 保存标题修订前的已安装应用                                      | /Users/skaid13/.Trash/PLC-桌面打包验证残留-20261021/installed-before-save-title.app |
| 旧桌面PLC实验教学与仿真系统 1.4.1.command                       | /Users/skaid13/.Trash/PLC-桌面打包验证残留-20261021/old-terminal-shortcut.command   |
| 与正式安装相同的重复打包产物                                    | /Users/skaid13/.Trash/PLC-桌面打包验证残留-20261021/final-packaged-output           |
| 本轮/tmp/plc-icon.iconset、plc-icon-images、plc-make-icon.swift | 同一垃圾桶批次内对应名称                                                            |

没有永久删除、清空垃圾桶、卸载Node或清理依赖。源码、原指导书、锁文件、Git历史、原浏览器学习记录和用户导出JSON保留。迁移前源备份在学习资料目录，应用备份与重启校验文件在Downloads，均未提交Git。恢复旧入口可从垃圾桶取回对应.command；应用数据在App Support目录，重装时保留，导入前先备份。

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

## 1.4.1替换与验证残留（2026-10-21）

核实命令和工作目录后，仅停止旧正式PID20498和本轮Vite PID21628。新正式服务PID22462在4173，5173无监听。新版桌面链接为 `/Users/skaid13/Desktop/PLC实验教学与仿真系统 1.4.1.command`，指向项目原入口，带--no-open复用成功。

以下逐项移动至系统垃圾桶，没有永久删除或清空垃圾桶：

| 原位置                                                            | 垃圾桶位置                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/Users/skaid13/Documents/Codex/PLC-Learing-Simulator/dist`       | `/Users/skaid13/.Trash/PLC-1.4.1-替换记录-20261021/1.4.0-preview.1-dist`         |
| `/Users/skaid13/Desktop/PLC实验教学与仿真系统 1.4 试学版.command` | `/Users/skaid13/.Trash/PLC-1.4.1-替换记录-20261021/1.4试学版-旧快捷方式.command` |
| `/tmp/plc-ui-141-stage1-dist`                                     | `/Users/skaid13/.Trash/PLC-1.4.1-替换记录-20261021/plc-ui-141-stage1-dist`       |
| `/tmp/plc-ui-141-stage2-dist`                                     | `/Users/skaid13/.Trash/PLC-1.4.1-替换记录-20261021/plc-ui-141-stage2-dist`       |
| `/tmp/plc-ui-141-stage2-final-dist`                               | `/Users/skaid13/.Trash/PLC-1.4.1-替换记录-20261021/plc-ui-141-stage2-final-dist` |
| `/tmp/plc-ui-141-regression-dist`                                 | `/Users/skaid13/.Trash/PLC-1.4.1-替换记录-20261021/plc-ui-141-regression-dist`   |
| `/tmp/plc-ui-141-taste`                                           | `/Users/skaid13/.Trash/PLC-1.4.1-替换记录-20261021/plc-ui-141-taste`             |

恢复：Finder垃圾桶内取回对应链接或目录。恢复旧构建前停止当前服务、保留新版dist，再将1.4.0-preview.1-dist放回项目dist；旧源码基线8b39178及开发分支仍在Git中。保留指导书、锁文件、依赖、原ZIP、Git历史和全部浏览器学习数据。本轮没有再次尝试清理原始用户ZIP。

## 1.4.1配色修订残留（2026-10-21）

旧灰绿色dist整体移入 `/Users/skaid13/.Trash/PLC-1.4.1-灰绿配色-459c68ed`；本轮蓝色初次验证dist整体移入 `/Users/skaid13/.Trash/PLC-1.4.1-蓝色初次验证构建-20261021`。当前项目dist为蓝白最终配色，4173服务与桌面1.4.1链接继续复用。未永久删除文件，源码与草稿保留；需要恢复时先停止服务并保存当前dist，再从垃圾桶取回对应目录放回项目dist。
