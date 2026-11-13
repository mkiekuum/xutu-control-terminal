# Windows 安装与更新

从 [官方 Releases](https://github.com/mkiekuum/xutu-control-terminal/releases/latest) 下载当前版本 chrome.zip，SHA256SUMS 可用于校验。普通用户只需插件包，不必安装 Node.js、GitHub 或任何本机宿主。

1. 把 ZIP 解压到固定文件夹，确认里面直接有 manifest.json、ui.html 等。
2. Chrome 地址栏输入 chrome://extensions（Edge 用 edge://extensions）。打开“开发者模式”，点击“加载已解压的扩展程序”，选择刚才的文件夹。
3. 在工具栏扩展菜单固定“序图终端”，登录 https://plan.fpgabbs.cn/，点击插件。首页直接输入需求和 JSON，使用说明保留在发行文档中。
4. 正常 JSON 业务操作不需要用户脚本授权。只有显式 JSON script.execute 才按浏览器要求开启允许用户脚本；不能借此绕过站点权限。

更新时先确认没有执行中的写入，备份旧代码，按 SHA256SUMS 校验新包，再覆盖原来加载的目录并移除新版本已删除的受管理模块。不要删除浏览器存储。在扩展管理页点击重新加载；文件更新不代表浏览器已经加载。没有权限自动完成这一页时须由本人操作，不接管真实鼠标。

v2.5 已移除 CLI、Native Messaging、命令行宿主和安装脚本，manifest 不再申请 nativeMessaging。旧版本系统注册的宿主不被新版调用；已有系统安装清理只处理确认属于旧版本的文件/注册项，不删除其他应用或私有数据。无需为 v2.5 重新注册宿主。

首次安装、实际扩展重载及浏览器授权必须以真实界面结果为准。合成网页预览不是安装验收；未验证的设备不能声称已适配。

可选 MCP 与侧栏优化见 [本机 MCP](../mcp/README.md)。普通 JSON 无需 Node；MCP 服务需要 Node22+，安装步骤已写入MCP提示词供本机AI执行。升级后扩展可能请求本机可选权限；只有点击复制MCP提示词时授权，无需公网。
