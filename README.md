# 序图终端 v3.1.0

输入需求 → 复制给 AI → 粘贴 JSON 并执行。也可通过可选本机 MCP 读取上下文、预览并执行，使用网站现有账号权限。

首页保留业务输入、结果、撤销重做、历史与页面复制，移除使用帮助及重复说明。更多中可开启“侧栏仅点击展开”，再次点击、外部点击、Esc 或收起按钮均可关闭，随时还原。

[安装](docs/WINDOWS_INSTALL.md) · [使用说明](docs/AI_QUICK_START.md) · [本机 MCP](mcp/README.md) · [本版验收与限制](docs/V3.1.0_UI_MCP_REPORT.md) · [正式下载](https://github.com/mkiekuum/xutu-control-terminal/releases/latest)

MCP 不用公网部署：可选源码组件仅监听本机，导入一次连接文件。“MCP AI”提示词按用户要求包含 AI 访问密钥，仅发给可信 AI；普通提示词不带密钥。客户端仍须支持并配置 MCP。HTTP 与 stdio 协议通过本地测试，不承诺任意 AI 都能连接 localhost。

保留单次提交、版本保护、请求去重、服务器回读和十批历史。没有恢复旧业务 CLI、Native Messaging、插件内问卷、长期偏好、外观编辑器或 AI API Key。

174 项本地测试及隔离 Chrome 合成页面回归通过；未改真实业务计划。实际浏览器扩展重载、生产写入和多品牌 AI 实际调用未验证。[外部图纸兼容限制](docs/FLOW_COMPATIBILITY.md)继续适用；网站评分不授权改变用户业务图。
