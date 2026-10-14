# GitHub 上传记录与核验

## 1.3.0 开源更新 2026-10-14

用户明确授权“上传GitHub，清除本地1.3之前版本”。远程main仍为 `6be59b7`，本地1.3.0验收检查点 `7a977a8`，工作区干净；fetch确认无新增远程提交。将 `codex/import-1.3.0` 快进合并到main并正常推送，没有强推、创建重复仓库或改变Public可见性。

- 已上传并核实提交 `7a977a80ed036e96f45fb87358efe2fdee8749cc`，远程package.json版本1.3.0。
- GitHub API返回的97个文件，其路径、模式、大小和blob SHA与本地完整Git tree一致；27个提交历史集合一致，初版和1.1.0历史保留。
- 本次新增46个历史blob经过私钥、常见Token、凭据赋值和含密码URL模式扫描，无命中；生成依赖/构建/凭据文件未跟踪，原指导书与远程1.1.0字节一致。未上传浏览器学习草稿。
- 代码与此前已验证的1.3.0完全相同：22个测试文件144项、类型及构建通过，真实浏览器课程和12步自动引导等验收见 `UPDATE_IMPORT_1.3.0.md`。本轮只合并、上传及更新记录，没有改源码或重复测试。
- 本地保留1.3.0工程、构建、桌面入口、依赖和原更新ZIP；旧服务已停止，旧构建/快捷方式此前已经移入垃圾桶。本轮在桌面、文档、下载、本地Applications及学习资料目录检查项目相关名称，限定4层且跳过依赖和Git目录，未发现额外旧版独立副本。仅一个Git工作树，没有重复检出旧版。
- 旧版本只保留可恢复的Git历史和垃圾桶归档；未清空垃圾桶、不永久删除、不触碰原实验学习数据或其它PLC课件。详细原位置/垃圾桶位置见 `CLEANUP_REPORT.md`。

本记录作为后续文档检查点再同步上传；最终main提交以GitHub远程为准。Windows实机及其它未验证项保持原验收限制。

## 1.1.0 开源更新 2026-10-14

用户确认仓库由自己主动设为Public，并授权将教学优化版上传为更新。更新前远程main为 `8e0baf8`，本地工作区干净；fetch后确认无远程新增改动。将 `codex/teaching-upgrade` 快进合并到main，正常推送，没有强制覆盖历史、改变可见性或创建重复仓库。

- 仓库：[skaid13/PLC-Learning-Simulator](https://github.com/skaid13/PLC-Learning-Simulator)，Public，默认分支main。
- 已上传功能提交：`143c2ec4fcb4379e5891ea65325fda455692de2b`，GitHub API核实远程main相同。上传结果文档随后单独提交同步，最新提交以远程main为准。
- 85个必要文件，包括全部教学源代码、原指导书、配置/锁文件、测试、跨平台入口及文档/验证截图；保持原始目录。
- 此次新增历史79个不同blob版本的凭据模式扫描无命中；依赖、构建、缓存、环境与凭据文件排除。浏览器草稿和个人学习数据未上传。
- 代码沿用已验收的1.1.0：19个测试文件130项、类型/构建/格式与页面验证通过，Windows实机待测。本次仅合并、推送和更新文档。
- 初版保留在历史提交 `8e0baf8`，全部8个开发阶段检查点保留。下方67文件清单是初版历史清单，不代表新版范围。

## 初版上传历史

以下记录为2026-10-10创建Private仓库及上传初版时的状态；当前可见性和版本以上方更新为准。

检查日期：2026-10-10。用户确认后完成仓库创建、完整推送和远程核验。

## 已创建的仓库

- 账号：`skaid13`（GitHub CLI 当前已登录账号）。
- 名称：[skaid13/PLC-Learning-Simulator](https://github.com/skaid13/PLC-Learning-Simulator)。
- 可见性：**Private**。
- 分支：现有 `main`，保留完整本地 Git 历史。
- 方式：以原始文件/目录通过 Git 推送，不压缩成 ZIP。
- 当前状态：已上传；`origin` 指向该仓库，本地 `main` 跟踪 `origin/main`。

## 必须保留的文件

| 范围             | 内容                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/`           | React 界面、梯形图模型、PLC 扫描引擎、运行状态机、11 个实验与参考程序、物理模型/传感器、课程、JSON 保存、全部测试      |
| `docs/`          | 原始 `PLC实验箱实验指导书0827.docx`、原文提取、执行规则、可恢复清理记录、本上传记录                                    |
| `scripts/`       | 正式本地服务与跨平台启动程序                                                                                           |
| 根目录配置       | `package.json`、`package-lock.json`、`tsconfig.json`、`vite.config.ts`、`.prettierrc.json`、`.gitignore`、`index.html` |
| 根目录说明和入口 | `README.md`、开发日志/进度、macOS `.command` 与 Windows `.bat`                                                         |

本项目是 PLC 教学仿真软件，不存在单独的 CCW/Studio 5000 官方工程。PLC 定义及 I/O 以现有 TypeScript/JSON 数据结构保存，全部包含在上述源代码中。未创建或修改核心 PLC 文件来替代真实工程。

浏览器 localStorage 中的学生草稿在源码目录之外，不随 Git 上传；如需备份个人程序，应由用户导出 JSON 后保存到工程目录。

## 排除但不删除

- 依赖：根目录 `node_modules/`，由锁文件安装恢复。
- 编译产物：根目录 `dist/`，由 `npm run build` 恢复。
- Vite 缓存、测试覆盖率/报告、日志、系统或编辑器临时文件。
- 环境变量文件、个人 npm/网络认证配置、SSH/云服务凭据、私钥及证书私钥容器。
- 不使用通用 `*.local`、`*.json`、`*.xml` 或 PLC 工程扩展名排除规则。

没有删除任何现有工程文件。原始指导书保持原字节内容，源代码和运行功能不因本次上传准备改变。

## 已做检查

- 仓库已初始化，分支 `main`；准备前工作区干净，无远程仓库。
- 准备前 66 个必要文件均被 Git 跟踪，无未跟踪、误忽略或大于 10 MB 的工程文件。
- 全部 Git 历史共 146 个不同文件版本扫描：没有命中所检查的私钥、GitHub/AWS/常见服务 Token、硬编码凭据赋值和 URL 内嵌密码模式；DOCX 内 XML/关系文件也已扫描。
- 凭据检查不打印秘密内容，也不读取或上传 CLI 密钥环。
- `gh` 2.101.0 已安装，`gh auth status --hostname github.com` 成功，账号 `skaid13`，HTTPS 协议。
- 忽略规则和 README 已完善；101 项测试、TypeScript 与生产构建通过；忽略规则实际检查通过，未误排除必要文件或常见 PLC 工程格式。准备内容保存为提交 `6813ecd`，随后取得用户创建和推送确认。

模式扫描是已执行的检查结果，不能保证发现所有形式的敏感信息。推送前已再次核对实际 Git 跟踪范围，环境文件和工具的登录凭据不在上传范围中。

## 已完成的远程核验

1. 创建确认名称的 Private 仓库并将其添加为 `origin`，没有覆盖已有远程仓库。
2. 推送现有 `main` 及其完整提交历史，没有重写历史或强制推送。
3. GitHub API 确认仓库为 Private、默认分支为 `main`，远程提交与本地 HEAD 一致。
4. 逐项比较完整 Git tree：67 个文件的路径、文件模式、大小和 blob SHA 全部一致；指导书、锁文件、PLC 源码、文档、测试及双击入口完整。
5. 远程全部 13 次提交与本地历史集合完全一致；依赖、缓存、构建和凭据文件未包含在远程文件树中。

首次完整核验提交：`6813ecdf89f2f791957ef584073884b777a626f2`；Git tree：`ab43f6f7b9a6a2664ec1cc0764986cde9b46e1d6`。本文及 README、开发进度/日志随后作为上传结果的文档检查点提交同步；最新版本以远程 `main` 为准。

## 已上传的完整文件清单

共 67 个文件，按原始路径保存。下面列出远程核验范围；生成的依赖/构建不在清单内。

```text
.gitignore
.prettierrc.json
DEVELOPMENT_LOG.md
DEVELOPMENT_PROGRESS.md
README.md
docs/CLEANUP_REPORT.md
docs/ENGINE_RULES.md
docs/GITHUB_UPLOAD.md
docs/MANUAL_EXTRACTION.md
docs/PLC实验箱实验指导书0827.docx
index.html
package-lock.json
package.json
scripts/launch.mjs
scripts/serve.mjs
src/App.experiments.test.tsx
src/App.runtime.test.tsx
src/App.storage.test.tsx
src/App.test.tsx
src/App.tsx
src/components/ExecutionExplanation.test.tsx
src/components/ExecutionExplanation.tsx
src/components/ExperimentDetails.tsx
src/components/ExperimentLesson.tsx
src/components/Header.tsx
src/components/Icon.tsx
src/components/InstructionInspector.tsx
src/components/LadderEditor.test.tsx
src/components/LadderEditor.tsx
src/components/LadderNetworkView.tsx
src/components/Modal.tsx
src/components/PlantDrawing.tsx
src/components/ProjectToolbar.tsx
src/components/RuntimeControls.tsx
src/components/SimulationPanel.tsx
src/components/TeachingPanel.tsx
src/components/VariableManager.tsx
src/components/VariableMonitor.tsx
src/data/curriculum.ts
src/data/experiments.test.ts
src/data/experiments.ts
src/data/lesson.ts
src/data/referencePrograms.test.ts
src/data/referencePrograms.ts
src/editor/advanced.test.ts
src/editor/model.test.ts
src/editor/model.ts
src/editor/validation.test.ts
src/editor/validation.ts
src/engine/advanced.test.ts
src/engine/runtime.test.ts
src/engine/runtime.ts
src/engine/scan.test.ts
src/engine/scan.ts
src/engine/useSimulator.ts
src/main.tsx
src/simulation/plant.test.ts
src/simulation/plant.ts
src/storage/projects.test.ts
src/storage/projects.ts
src/styles.css
src/test/setup.ts
src/types/index.ts
tsconfig.json
vite.config.ts
启动PLC学习工作台.bat
启动PLC学习工作台.command
```
