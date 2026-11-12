# 序图终端 v3.0.2

- 修复外部流程图转换提示词：不默认加辅助点，保留分类节点、完成含义、直接依赖和确认原文；允许估时不等于允许改结构。
- 增加 flowCheck 提交前对照：节点、文字、箭头、前置和逐项估时分别核对；失败不提交，不伪称任意图纸可无损转换。
- 结果区明确区分图形一致、工作映射与网站回读。原有旧指令仍兼容，没有原图证据时明确未核实。
- 修复 JSON 仅预览被界面转为执行的问题，保留现有批量、版本与历史保护。

## 下载与新手安装

| 文件 | 用途 |
| --- | --- |
| [chrome.zip](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.0.2/xutu-control-terminal-v3.0.2-chrome.zip) | 普通用户插件安装包 |
| [source.zip](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.0.2/xutu-control-terminal-v3.0.2-source.zip) | 完整源码、Schema、示例、手册、测试和调整报告 |
| [SHA256SUMS](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.0.2/SHA256SUMS) | 两个 ZIP 的下载完整性校验 |

1. 下载 chrome.zip，解压到固定目录，确认里面直接有 manifest.json。
2. Chrome 打开 chrome://extensions，开启开发者模式，点击“加载已解压的扩展程序”，选择该目录。Edge 对应 edge://extensions，本轮未验证 Edge 安装。
3. 登录序图网站，固定插件。输入需求 → 复制给 AI → 粘贴 JSON 并执行。帮助在首页，不需要 Node、GitHub 登录或本地 CLI。
4. 已安装用户：确认没有在途写入，备份旧目录，核验新版包后覆盖原目录，在扩展管理页重新加载。保留浏览器存储。不能把自动检查版本当作自动安装。

加载失败先检查是否选择含 manifest.json 的目录，必要时还原备份再重新加载。出现未知执行结果，先检查原请求，不要重复提交。

## 测试与边界

162 项本地测试和隔离 Chrome 合成页面回归通过（含原预览不写入、图纸差异拒绝、12 项恢复/错误界面检查）。未操作真实业务计划或物理鼠标。生产写入、用户扩展重载、系统剪贴板及任意外部 AI 的实际效果未验证。没有恢复 CLI、Native Messaging、本地问卷/偏好、外观编辑、AI Key 或 MCP。详见源码包 docs/V3.0.2_FLOW_REPORT.md。

图纸检查仅核对指令所附确认清单，不是图片识别或业务认证。没有完整工作映射时不宣称工期准确；带检查的写入会停止，预览可展示限制。没有新增 draw.io 导入器或折叠视图。
