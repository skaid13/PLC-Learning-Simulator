# 2.0.0 GitHub发布记录

用户明确授权上传当前完成版本并作为2.0，发布完成于2026-10-21 12:48（北京时间）。原仓库保持Public，不修改可见性、不强制推送、不上传个人学习记录。

- 仓库：[skaid13/PLC-Learning-Simulator](https://github.com/skaid13/PLC-Learning-Simulator)
- 正式发布：[v2.0.0](https://github.com/skaid13/PLC-Learning-Simulator/releases/tag/v2.0.0)，Release ID419168664，Latest、非草稿、非预发布。
- 功能标签/源码提交：`750f013cc7abe17d29393a3b0428e9c9cd755c1f`。原1.3.0 `d853626` 与全部中间阶段历史保留。
- 版本准备检查点 `4c8e5be`，原生/附件验证检查点 `750f013`，上传后文档另作归档提交，不改标签。

## 上传完整性

GitHub API的main提交与本地一致；递归源码树未截断，129个版本文件的完整路径及blob SHA逐个相同。包含源码、全部课程/实验、桌面入口/图标、Mac/Windows打包配置、锁文件、测试、原始指导书、开发日志、进度、更新说明和截图。个人JSON、App Support/浏览器数据、node_modules、构建暂存、Token/密钥不作为发布内容。

应用作为Release附件，不以ZIP替代完整源码目录。上传完成后核对服务器state=uploaded、size和SHA256，与本地完全一致；发布说明正文与 [完整改动说明](RELEASE_2.0.0.md) 一致。全部附件核验后才将草稿公开，API确认发布时间 `2026-10-21T04:48:25Z`。

| 附件                                                                                                                                   | 大小                        | SHA256                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| [Mac arm64应用](https://github.com/skaid13/PLC-Learning-Simulator/releases/download/v2.0.0/PLC-Learning-Simulator-2.0.0-mac-arm64.zip) | 129,976,798字节（约124MiB） | `8703ffa01dea34e61bf86cd1774bbf1209493b4f4981018e253b2bff7da7f4c7` |
| [SHA256SUMS.txt](https://github.com/skaid13/PLC-Learning-Simulator/releases/download/v2.0.0/SHA256SUMS.txt)                            | 109字节                     | `96557f748b6212cb1ee1a5ba28f75d6aafe5678325b53e1faaba504c05de3136` |

## 验证与平台范围

2.0的160项功能测试、2项桌面路径测试、类型/构建/格式通过；Mac实际显示版本2.0.0、原生导出五项记录与此前备份一致，退出无主/辅助进程及旧网页端口残留。ZIP CRC、macOS系统解包、解包版本和app.asar一致性通过。已安装本机应用与发布包内容相同，桌面图标继续有效。

Mac包未签名/公证，仅提供Apple Silicon构建。Windows/Intel Mac源码与命令保留，二进制未生成、实机未测；完整原生编辑、单程序JSON原生导入、系统大字体和真实零基础试学仍待验证。六阶段新主线仅覆盖第一课，其余实验保留原课程与引导。

本机旧1.4.1应用与重复构建移入垃圾桶，正式下载ZIP/校验文件保留在gitignored release目录；App Support和浏览器记录、原备份、原ZIP/DOCX及Git历史保留。恢复路径见 [清理记录](CLEANUP_REPORT.md)。
