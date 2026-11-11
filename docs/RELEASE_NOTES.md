# 序图终端 v2.5.0

本版新增真实需求问卷和执行门禁、完整网页 DOM/离线只读 HTML、最近10批撤销/重做/差异/历史点。表达偏好放在问卷；使用帮助在主界面。按最新需求全面删除本地 CLI 与 Native Messaging，无需安装宿主。

## 下载

|文件|用途|
|---|---|
|[Chrome/Edge插件 ZIP](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v2.5.0/xutu-control-terminal-v2.5.0-chrome.zip)|普通用户下载这个|
|[完整源码 ZIP](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v2.5.0/xutu-control-terminal-v2.5.0-source.zip)|含测试、Schema、61份示例与手册|
|[SHA256SUMS](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v2.5.0/SHA256SUMS)|下载校验和|

## 第一次安装（无需编程）

1. 下载上面的插件 ZIP，解压到固定文件夹，确保里面有 manifest.json。
2. Chrome 地址栏输入 chrome://extensions（Edge 为 edge://extensions），开启开发者模式，点击“加载已解压的扩展程序”，选择该文件夹。
3. 在工具栏固定“序图终端”，打开并登录 https://plan.fpgabbs.cn/。插件直接使用你的当前网站账号，不需要 API Key、Node.js 或 GitHub 登录。
4. 打开插件，默认新建；已有计划增删调整选管理。写需求，复制提示词，先完成必要问卷，再让 AI 在聊天中提供完整 JSON 代码块。
5. 粘贴 JSON，查看将修改什么，核实人员与工期后执行。使用说明就在主界面；结果未知不要重复新建。

更新：确认无在途写入，备份旧代码，校验新包并覆盖原目录，清理已移除的受管理模块，在扩展管理页重新加载。保留浏览器存储和原加载路径。文件更新不能代替浏览器重载；v2.5 不再调用或注册旧 CLI 宿主。

## 验证与边界

110项本地回归通过；包含后台模拟、JSDOM、IndexedDB与合成HTTP接口。实际隔离Chrome离线页面显示SVG/表格/开放影子树等，原始DOM1,300,902字节完整校验，表单禁用，网络POST为零。这不是公司网站真实写入验收。

本轮未操作生产计划；网站公开资源检查超时，公司后端/隔离测试站点未提供。当前浏览器扩展安装重载、真实分组/撤销、实际网站导出与系统剪贴板、新设备安装未验证。审核/分组/任意脚本等不能完整恢复；跨计划恢复可能部分成功。任何真实权限与工期计算仍由网站决定。

[20项验收报告](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.5.0/docs/V2.5_TEST_REPORT.md) · [问卷](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.5.0/docs/V2.5_INTAKE_MANUAL.md) · [十步历史](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.5.0/docs/V2.5_UNDO_HISTORY.md) · [新设备](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.5.0/docs/CROSS_DEVICE.md)

问卷未完成：保存答复，再核实具体提案。版本冲突：查看最新差异，保留他人修改。复制失败：使用主界面底部完整手动复制区。看见旧CLI：浏览器还未重载。版本检测失败仅表示无法确认，不表示已经最新。网页与历史含私密数据，不公开上传。
