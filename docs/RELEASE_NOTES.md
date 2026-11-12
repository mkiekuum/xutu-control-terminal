# 序图终端 v3.0.0

优先修复撤销、重做与错误恢复；保留简单的“输入需求 → 复制给 AI → 粘贴 JSON 并执行”。

- 撤销只恢复原操作字段，保留无关远端日期、人员与进度；冲突展示三方差异，恢复前核对。
- 业务保存与布局回读分开显示；待核对批次关联原请求，不盲目重试。
- 首页复制页面摘要；完整 DOM、离线 HTML 和诊断按需展开。draw.io 增强提示词，无新增导入器。
- 保留 plan.batch 一次提交、版本检查、防重复、JSON 脚本权限与网站计算。已删除模块不恢复。

## 下载与安装

| 文件 | 用途 |
| --- | --- |
| [chrome.zip](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.0.0/xutu-control-terminal-v3.0.0-chrome.zip) | 普通同事安装此包 |
| [source.zip](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.0.0/xutu-control-terminal-v3.0.0-source.zip) | 完整源码、手册、Schema、示例与测试 |
| [SHA256SUMS](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v3.0.0/SHA256SUMS) | 下载完整性校验 |

1. 下载 chrome.zip，解压到固定文件夹，确认直接包含 manifest.json。
2. Chrome 地址栏打开 chrome://extensions，开启“开发者模式”，点击“加载已解压的扩展程序”，选择该文件夹。Edge 对应 edge://extensions；本轮未验证 Edge 安装。
3. 登录序图网站，在工具栏固定插件。写需求、复制给 AI、回答必要问题、粘贴完整 JSON 并执行。无需 Node、GitHub 登录或本地 CLI。
4. 删除和恢复先看差异；结果未知时点“检查原请求”，不要反复执行。使用帮助在首页。

旧版升级：确认没有执行中的写入，备份旧目录，核验包后覆盖原加载目录，再在扩展管理页重新加载。不要删除浏览器历史存储。开发者扩展不能靠网页按钮自动安装；自动检测和 AI 更新指令保留。加载失败先核对所选目录是否含 manifest.json，必要时还原旧目录并重新加载。

## 验证边界

140 项本地测试通过，隔离 Chrome 合成页面与离线 HTML 通过。未修改真实业务计划；用户已安装扩展重载、生产写入、真实系统剪贴板尚未验证。draw.io 测试验证提示词契约与合成指令，不证明任意外部 AI 的视觉理解。详细报告在源码包 docs/V3.0.0_ACCEPTANCE.md。
