# Windows 安装与使用

## 普通用户：只装插件

无需 Node.js、CLI 或 API Key。下载发布页的 `*-chrome.zip`，右键“全部解压”到固定目录。在 Chrome 地址栏输入 `chrome://extensions`（Edge 为 `edge://extensions`），开启“开发者模式”，选择“加载已解压的扩展程序”，选中直接含 `manifest.json` 的文件夹。Windows 整包应选里面的 `extension` 子目录。

固定插件到工具栏，在同一浏览器登录序图。打开插件：写需求 → 复制 AI 提示词 → 发给 AI → 复制其完整 JSON 代码块 → 粘贴到“AI 指令” → 点击“执行”。信息不足时先回答 AI 的问题。

Chrome 最低版本 135。Windows 优先，macOS 暂缓；其他浏览器版本组合未全部实测。

## 可选：本地 AI 使用 CLI

1. 安装 Node.js 22+。从发布页下载 `*-windows.zip` 并解压到固定目录。
2. 加载里面的 `extension` 文件夹，或使用已安装的同版本插件。不要同时启用两份插件。
3. 从扩展详情或插件“更多 → 本地 CLI”复制实际 32 位扩展 ID。Chrome 和 Edge 的 ID 可能不同。
4. 双击 `native-host/INSTALL-WINDOWS.cmd`，粘贴 ID 并按回车。源码安装也可在源码根目录 PowerShell 运行：

~~~powershell
node native-host/install-windows.mjs 你的32位扩展ID
~~~

安装器使用 Windows 自带 .NET Framework C# 编译器生成真正的 EXE 宿主，仅写入当前用户 HKCU 注册项。缺少编译器会明确报错。不要把 CMD/BAT 当作 Native Messaging 宿主。

5. 在插件展开“更多”，点击“连接 CLI”，再点击“复制 CLI 用法”交给能执行本机命令的 AI。
6. 在 PowerShell 只读检查：

~~~powershell
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" doctor
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" status
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" tabs
~~~

需要执行指令时，先让 AI 根据当前 context 生成 JSON 并核对目标，再使用 CLI run；不要把示例当成已经授权修改某个计划。JavaScript 模式需要浏览器相应“允许用户脚本”开关，JSON 模式无需这个开关。

## 更新与换电脑

插件：备份原目录后，用新版插件 ZIP 内容覆盖原来加载的文件夹；在扩展管理页点击“重新加载”，刷新序图网站。保留原目录和扩展，无需先卸载。

CLI：更新整包后重新运行安装器，并在插件“更多”里重连。源码/Node 路径移动、浏览器或扩展 ID 改变时同样需要重装。换电脑按 CROSS_DEVICE.md 重新安装，不复制旧机器认证配置。

宿主使用随机命名管道与认证值，不开放 TCP 端口。安装目录限制为当前 Windows 用户；不要分享 bridge-config.json。重装前关闭旧连接；重装会更新认证配置。

卸载宿主：在原目录运行 `node native-host/install-windows.mjs uninstall`。仅删除本工具注册及已知安装文件，保留源码、扩展存储和业务数据。

## 排查

没有 `manifest.json` 通常是目录选错；找到该文件，选择它的父文件夹。暂未连接时先登录同一浏览器中的序图并刷新，关闭再打开插件。复制“更多 → 兼容性与排查”的状态可交给维护者。

历史已验证 Windows 编译、EXE stdio 帧往返、命名管道及真实浏览器→EXE→Node→CLI→网站核心链路。当前版本界面检查与测试范围见 TEST_REPORT.md；全新设备首次安装及所有浏览器型号尚未全部验收。
