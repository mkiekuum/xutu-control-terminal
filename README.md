# 序图终端 v2.5.0

给同事使用的 JSON 计划助手：说明需求 → 核实必要问题 → 复制提示词给任意 AI → 粘贴 JSON → 查看改动并执行 → 看懂结果。

主界面保留需求框、JSON 输入、使用帮助和最近十批历史。新建及复杂调整必须完成本地问卷，人员与估时先核实；简单改名不追问整份业务资料。表达习惯在问卷中选择。v2.5 全面移除本地 CLI、Native Messaging、安装器与相关权限，不恢复外观编辑、AI API 或 MCP。

[下载正式版本](https://github.com/mkiekuum/xutu-control-terminal/releases/latest) · [新手安装](docs/WINDOWS_INSTALL.md) · [两分钟入门](docs/AI_QUICK_START.md) · [完整验收](docs/V2.5_TEST_REPORT.md)

1. 下载 chrome.zip 并解压到固定目录。在 Chrome 扩展管理页开启开发者模式，加载包含 manifest.json 的文件夹；Edge 对应扩展页。
2. 登录序图网站并打开插件，默认新建，已有计划增删调整选管理；多标签时选择目标网页。
3. 写需求、复制提示词。先完成下方问卷，再让 AI 提供一个聊天内可直接复制的 JSON 代码块。
4. 粘贴 JSON，核对改动和具体人员/工期，执行后查看写入及回读状态。

[需求问卷](docs/V2.5_INTAKE_MANUAL.md) · [字段核实](docs/V2.5_PLAN_FIELDS.md) · [DOM/离线 HTML](docs/V2.5_HTML_EXPORT.md) · [十步历史](docs/V2.5_UNDO_HISTORY.md) · [局部修改](docs/LOCAL_EDITING.md) · [命令参考](docs/COMMAND_REFERENCE.md) · [61份示例](docs/COPY_PASTE_RECIPES.md) · [换电脑](docs/CROSS_DEVICE.md) · [维护与发布](docs/GITHUB_MAINTENANCE.md)

权限和工期计算仍由网站决定。质量建议不是错误；个人习惯不是所有同事的规则。只改名称就只改名称，不重估工期、不改人员依赖。撤销严格比较最新版本，部分成功或不可恢复会明确报告。

打开插件自动检查 GitHub latest 网页，HTTP 200 与合法正式 tag 才算找到版本；失败不冒充最新。更多里可复制 AI 更新指令。网页原文与离线文件仅主动复制/保存，可能包含私密信息，不自动上传。

开发：pnpm install --frozen-lockfile；node --test tests/*.test.js；node tools/build.mjs；node tools/package-source.mjs。完整源码包不包含公司源码、实际计划或机器凭据。真实新增网站写入/安装验证范围见验收报告。
