# 安装与更新

Windows请按[Windows安装说明](WINDOWS_INSTALL.md)操作。解压Chrome插件ZIP到固定目录，在扩展管理页开启开发者模式并加载含manifest.json的目录。更新同一路径的源码后，点扩展“重新加载”。

打开序图并登录，点击插件图标，即可按两个输入框使用。普通复制粘贴无需本地宿主；需要CLI时再安装。仅 JSON 中显式 script.execute 需要在扩展详情开启允许用户脚本，插件没有独立 JavaScript 输入。

2.1.0 为历史已加载验证；2.3.0 的当前测试范围见 TEST_REPORT.md。macOS源码保留但按用户要求暂缓验收。
