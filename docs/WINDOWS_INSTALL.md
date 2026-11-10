# Windows 安装与使用

本轮 Windows 优先，macOS 暂缓。支持当前用户的 Chrome / Edge 注册；浏览器用户脚本能力需要相应开关。

1. 解压扩展ZIP到固定目录。在 chrome://extensions 或 edge://extensions 启用开发者模式，加载含 manifest.json 的目录。关闭旧版插件并刷新序图。
2. 从扩展详情复制32位扩展ID。Chrome和Edge的ID可能不同，使用实际要操作浏览器的ID。
3. 安装 Node.js 22+。解压完整源码包并保留目录，在该目录PowerShell运行：

~~~powershell
node native-host/install-windows.mjs 你的32位扩展ID
~~~

安装器用Windows自带.NET Framework C#编译器生成真正的EXE宿主，注册仅写入HKCU。未安装编译器时明确报错。不会用CMD/BAT冒充Native Messaging宿主。

4. 在浏览器登录序图，点击插件图标，再点击“连接本地 CLI”。
5. PowerShell运行：

~~~powershell
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" doctor
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" status
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" run --file examples/01.json
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" run --file batch.jsonl --jsonl
~~~

通过随机管道名和认证值保护本机命名管道，不开放TCP端口。安装器限制配置目录到当前Windows用户。不要分享bridge-config.json。重装前关闭旧连接；重装会更新认证配置。

源码或Node路径移动、浏览器或扩展ID改变后需要重装。发行EXE必须由安装器配好当前机器路径才能使用。

卸载：node native-host/install-windows.mjs uninstall，只删除本工具注册及已知安装文件，保留源码、扩展存储和业务数据。

已验证：Windows编译、实际EXE子进程stdio帧往返、命名管道客户端。真实浏览器扩展→EXE→Node→CLI/MCP→网站核心操作链路已通过。全新配置首次安装及所有浏览器型号尚未验收。

Windows整合ZIP解压后可双击native-host/INSTALL-WINDOWS.cmd，粘贴终端显示的32位扩展ID；需要先安装Node.js22+。该目录要保留，移动后重装宿主。安装完成后终端的“复制MCP配置”可给支持本地MCP的AI客户端使用。Chrome允许用户脚本开关由用户手动开启，扩展不能代开。
