# 序图终端 v3.1.1

- 左侧计划栏可改为仅点击展开，支持四种收起方式和还原。
- 可选本机 MCP：HTTP/stdio、读取/预览/确认执行/结果查询，复用原版本与防重保护，无需公网部署。
- 普通 AI / MCP AI 提示词分开；MCP 提示词包含本机私密连接配置，仅发给可信 AI。AI 自动配置本机连接，无需手填配置。
- 统一需求/执行卡片布局，隐藏兼容性入口但保留后台检查，更新区只显示短状态及必要操作。
- 删除首页使用帮助与重复说明，页面摘要、完整 DOM、离线 HTML 集中在一个区域。保留错误、恢复与历史入口。

## 下载与安装

| 文件 | 用途 |
| --- | --- |
| [chrome.zip](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.1.1/xutu-control-terminal-v3.1.1-chrome.zip) | 插件安装包 |
| [source.zip](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.1.1/xutu-control-terminal-v3.1.1-source.zip) | 源码、可选本机 MCP、手册、Schema、测试和验收报告 |
| [SHA256SUMS](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.1.1/SHA256SUMS) | ZIP 校验和 |

1. 下载 chrome.zip，解压到固定目录，确认直接有 manifest.json。
2. Chrome 打开 chrome://extensions，开启开发者模式，“加载已解压的扩展程序”选择该目录。Edge 对应 edge://extensions，本轮未验证 Edge 安装。
3. 登录序图网站，输入需求 → 复制给 AI → 粘贴 JSON 并执行。普通使用无需 Node、GitHub 登录或本机宿主。
4. 更新用户：确认无在途写入，备份旧代码、核对校验和，覆盖原目录后重新加载扩展，保留浏览器存储。自动检查版本不等于自动安装。
5. 需要 MCP 时，另下载源码包，点击“复制给 MCP AI”，交给可信本机 Agent 按 mcp/README.md 安装和配置；AI 客户端仍须支持 MCP，云端 AI 不能自动访问 localhost。侧栏优化在“更多”手动开启，默认关闭。

加载失败核对选择目录；结果未知先检查原请求，不要重复提交。保留原有 JSON 后台能力，没有恢复旧业务 CLI、Native Messaging、本地问卷、外观编辑器或 AI API Key。

## 测试与限制

175 项本地测试全部通过，隔离 Chrome 合成 UI/原站侧栏事件回归通过，包含密钥复制分离、预览不写入、写入一次、防重及历史恢复。未修改真实计划、未操作物理鼠标；用户实际扩展重载、生产 MCP 写入、跨电脑隧道及多品牌 AI 实际调用未验证。approval 是 AI 引用的用户同意文本，不是独立人工认证。MCP 不开放任意脚本及完整 DOM 导出。详细范围见源码包 docs/V3.1.1_UI_MCP_REPORT.md。
