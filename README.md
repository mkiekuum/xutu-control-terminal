# 序图终端 2.1.0

用你常用的AI生成指令，再在当前登录的序图账号中执行。无需API Key。

1. 打开序图，登录并选择计划。
2. 在插件里描述需求，点击“复制 AI 提示词”，粘贴给AI。
3. 将AI返回的JSON粘回插件，点击“一键执行”。

提示词默认包含当前选中计划的完整内容。复制操作只写剪贴板，由你粘贴到选定AI；插件不后台请求AI服务。CLI用于能执行本地命令的外部AI。

[两分钟入门](docs/AI_QUICK_START.md) · [Windows安装](docs/WINDOWS_INSTALL.md) · [详细手册](docs/TERMINAL_MANUAL.md) · [命令参考](docs/COMMAND_REFERENCE.md) · [45份示例](docs/COPY_PASTE_RECIPES.md) · [网站与评分守则](docs/WEBSITE_GUIDE.md) · [测试报告](docs/TEST_REPORT.md) · [功能边界](docs/CURRENT_STATUS.md)

本版按用户要求彻底移除外观模块、完整标签页入口、MCP配置/服务、模型服务地址和API Key接入。功能范围由最新要求替代旧版双页面规划。保留JSON/CLI/JavaScript、计划编辑、合并拆分、编号检查、执行结果及本地CLI。

开发：Node.js22+；pnpm install --frozen-lockfile；node --test tests/*.test.js；node tools/build.mjs。Windows整包：node tools/package-windows.mjs。完整源码：node tools/package-source.mjs。

公开仓库不含公司源码、真实业务记录、账号凭据。网站权限/接口限制仍存在，不承诺未实现的管理员功能或永久删除。
