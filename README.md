# 序图终端 2.2.0

把需求发给你常用的AI，信息清楚后复制聊天中的JSON代码块，在当前序图账号中一键执行。无需API Key。

1. 登录序图，选择要修改的计划；新建时在需求中写明“新建”。
2. 在插件写下需求，复制AI提示词。资料不清楚时先回答AI的问题。
3. 复制AI直接给出的JSON代码块，粘贴并执行。

新界面保留两步主操作，CLI、兼容性与帮助默认折叠。打开插件自动做基础只读兼容检查；展开“兼容性与排查”可复制不含业务内容的报告。提示词会包含完整计划，复制后由你选择发送给哪个AI。

[两分钟入门](docs/AI_QUICK_START.md) · [提示词规则](docs/AI_PROMPT_GUIDE.md) · [Windows安装](docs/WINDOWS_INSTALL.md) · [换电脑与分享](docs/CROSS_DEVICE.md) · [自主维护/升级](docs/GITHUB_MAINTENANCE.md) · [终端手册](docs/TERMINAL_MANUAL.md) · [45份示例](docs/COPY_PASTE_RECIPES.md) · [验收和边界](docs/CURRENT_STATUS.md)

CLI context同时提供完整网站说明和AI规则；compatibility命令提供脱敏检查结果。插件使用当前网站真实身份，没有固定个人账号、计划编号或原作者机器路径。

维护与升级由用户授权的本机AI按手册执行，可维护UI和功能，不发业务问卷。本版不新增自动升级器或云同步；保留既有GitHub测试、发布和公开资源监测配置。

开发：Node.js22+，pnpm install --frozen-lockfile，node --test tests/*.test.js。构建：node tools/build.mjs；Windows整包：node tools/package-windows.mjs；源码包：node tools/package-source.mjs。

公开仓库不含公司源码、真实计划和凭据；永久删除、完整历史和未验证权限功能不冒充支持。详情见测试报告。
