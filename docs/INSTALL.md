> 最新状态：Windows优先，macOS暂缓；核心参数Schema、JSON Lines、计划快照和图依赖检查已加入。参见 [当前状态](CURRENT_STATUS.md) 与 [Windows安装](WINDOWS_INSTALL.md)。

# 安装

1. 使用 Chrome 135 或更新版本，将 chrome.zip 解压到固定目录。
2. 打开 chrome://extensions，启用开发者模式，选择“加载已解压的扩展程序”，选中含 manifest.json 的目录。关闭旧 1.2.0 扩展并刷新网站，避免旧时间代理仍运行。
3. 打开序图并通过网站正常登录。点击浏览器工具栏扩展图标，打开终端。
4. Chrome 138+ 在扩展详情开启“允许用户脚本”；135–137 使用开发者模式。仅 JSON 模式不执行用户脚本。
5. macOS 安装 Node.js 22+，保留完整源码目录，在其根目录运行 `node native-host/install.mjs 扩展ID`。ID 从 Chrome 扩展详情复制，不含 URL。安装注册当前用户的 Google Chrome。
6. 运行 `~/.xutu/xutu doctor`，在终端点击“连接本地 CLI”，然后 `~/.xutu/xutu status`。
7. 卸载宿主：`node native-host/install.mjs uninstall`。Chrome 中移除扩展；刷新网站清除已注入的样式。

当前没有完成 macOS 和实际 Chrome 安装验收。Windows 不运行 macOS 安装器。扩展路径变化可能改变 ID，此时重新注册宿主。
