# 序图终端 v3.0.1

- 清理“问卷门禁”旧文案，统一普通执行与删除/恢复确认说明。
- 精简重复提示词，批量参数共享同一约束；完整计划数据保留。
- 普通微调仅附当前关联项目组，涉及分组时才附完整可见清单；旧上下文指令默认行为保持兼容。
- 明确连续链合并与分支调整的区别，保留一次提交、版本保护、防重复和十批历史恢复。

## 下载与新手安装

| 文件 | 用途 |
| --- | --- |
| [chrome.zip](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.0.1/xutu-control-terminal-v3.0.1-chrome.zip) | 普通用户插件安装包 |
| [source.zip](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.0.1/xutu-control-terminal-v3.0.1-source.zip) | 完整源码、Schema、示例、手册、测试和调整报告 |
| [SHA256SUMS](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.0.1/SHA256SUMS) | 两个 ZIP 的下载完整性校验 |

1. 下载 chrome.zip，解压到固定目录，确认里面直接有 manifest.json。
2. Chrome 打开 chrome://extensions，开启开发者模式，点击“加载已解压的扩展程序”，选择该目录。Edge 对应 edge://extensions，本轮未验证 Edge 安装。
3. 登录序图网站，固定插件。输入需求 → 复制给 AI → 粘贴 JSON 并执行。帮助在首页，不需要 Node、GitHub 登录或本地 CLI。
4. 已安装用户：确认没有在途写入，备份旧目录，核验新版包后覆盖原目录，在扩展管理页重新加载。保留浏览器存储。不能把自动检查版本当作自动安装。

加载失败先检查是否选择含 manifest.json 的目录，必要时还原备份再重新加载。出现未知执行结果，先检查原请求，不要重复提交。

## 测试与边界

147 项本地测试和隔离 Chrome 合成页面回归通过。未操作真实业务计划或物理鼠标。生产写入、用户扩展重载、系统剪贴板及任意外部 AI 的实际效果未验证。没有恢复 CLI、Native Messaging、本地问卷/偏好、外观编辑、AI Key 或 MCP。详见源码包 docs/V3.0.1_PROMPT_REPORT.md。
