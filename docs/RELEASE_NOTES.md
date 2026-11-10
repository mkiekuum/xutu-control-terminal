# 序图终端 2.4.0

本版让局部修改更可控，并保留原有需求输入、JSON指令、复制提示词和本机CLI。

- 批量改名与明确重编号：同步连线、引用、布局，保留未要求修改的工期、日期、人员和状态。
- 中性默认与可选偏好：只有点“记住”才保存，按当前账号及新建/管理场景隔离，可查看、修改、重置。
- 网站硬规则、评分建议、个人偏好分开；只问本次所缺信息，不强迫填完整计划问卷。
- 粘贴后展示改动摘要；版本冲突独立回读，不覆盖新修改，不盲重试；多步用真实回读版本衔接。
- 请求编号原值保留，重复提交不会重复写入；明确区分格式通过、回读确认、部分成功、未执行与结果未知。
- 打开自动检查最新版、AI更新指令、本地CLI及JSON脚本能力继续保留；未增加浏览器权限。

## 第一次安装：先下载这个

**只想让 AI 帮你改计划：下载 [xutu-control-terminal-v2.4.0-chrome.zip](https://github.com/mkiekuum/xutu-control-terminal/releases/download/v2.4.0/xutu-control-terminal-v2.4.0-chrome.zip)。** Chrome / Edge 都使用这份插件包；普通复制粘贴用法不需要 Node.js、CLI 或 API Key。当前优先支持 Windows，Chrome 最低版本 135；其他浏览器组合未全部实测。

| 文件 | 用途 |
| --- | --- |
| `xutu-control-terminal-v2.4.0-chrome.zip` | 日常使用：浏览器插件，推荐新手 |
| `xutu-control-terminal-v2.4.0-windows.zip` | 可选：插件、Windows CLI、宿主安装器与手册 |
| `xutu-control-terminal-v2.4.0-source.zip` | 开发维护：完整源码、测试和发布配置 |
| `SHA256SUMS` | 下载文件的校验值 |

GitHub 自动生成的 `Source code (zip)` / `Source code (tar.gz)` 是仓库源码，不是给新手直接安装的插件包。

## 安装插件（约两分钟）

1. 下载上面的 **chrome.zip**，右键“全部解压”，保存到一个以后不会删除或移动的文件夹，例如“文档 → 序图终端”。不要直接在压缩包里操作。
2. 打开浏览器，在地址栏输入 `chrome://extensions`；Edge 输入 `edge://extensions`，按回车。
3. 开启页面上的“开发者模式”，点击“加载已解压的扩展程序”或“加载解压缩的扩展”。
4. 选择**直接包含 `manifest.json` 的文件夹**。插件 ZIP 解压后的根目录就有它；Windows 整包则选择里面的 `extension` 文件夹。
5. 点击浏览器右上角的拼图图标，找到“序图终端”，固定到工具栏。打开[序图网站](https://plan.fpgabbs.cn/)，使用你自己的账号登录。
6. 点击“序图终端”图标。出现“新建 / 管理”、需求输入框和 JSON 指令框，且显示“已连接”，就可以开始使用。

浏览器加载与重新加载操作可对照 [Chrome 官方说明](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked) / [Edge 官方说明](https://learn.microsoft.com/en-us/microsoft-edge/extensions/getting-started/extension-sideloading)。

## 第一次使用

1. 默认选择“新建”，写下新计划的目标；要处理已有计划，先选“管理”，并在网站选中目标计划。
2. 在需求框填写具体要求，点击“复制 AI 提示词”，将需求与资料一起粘贴到你常用的 AI 聊天中。提示词包含当前计划详情；请自行选择要发给哪个 AI。
3. 如果 AI 提问，先回答；然后复制它在聊天里给出的**完整 JSON 代码块**。
4. 回到插件，粘贴到“JSON 指令”，点击“执行”。查看返回结果，失败原因可复制给 AI 继续修正。

业务操作始终使用当前网站账号的实际权限。兼容性会自动做基础只读检查；需要排查时展开“更多 → 兼容性与排查 → 复制兼容状态”。

## 软件版本与 AI Agent 更新

打开插件即自动检查官方 GitHub 的最新正式版，显示当前版本和检查时间；打开会自动触发检查，无需额外按钮；短时重复打开复用带时间的缓存。有新版时底部显示“更多 · 有新版本”。访问受限、超时或无有效发布页会显示无法确认，不会冒称已是最新版。

展开“更多 → 软件更新”，点击“复制 AI 更新指令”，交给能操作本机的 AI Agent。指令带当前版本、检查结果、扩展 ID、官方仓库、自动定位/下载/校验/备份/安装/回读/失败回滚步骤；要求不发维护问卷、不操作真实鼠标、不修改网站计划，换电脑要重新发现实际路径和 ID。复制本身不会更新软件，也不会向 AI 自动发送内容。

本版为公共版本检查增加 GitHub 官网读取权限，不申请 API 或附件 CDN 主机权限；请求不携带网站账号、计划内容或 Cookie。浏览器若要求确认新增权限，请按浏览器提示操作。真实登录、强制人工授权等步骤不能由提示词绕过。详细说明见 [自动版本检测与 Agent 更新](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.4.0/docs/AUTO_UPDATE.md)。

## 已装过旧版：怎么更新

1. 下载新版插件 ZIP，把原来的插件目录备份后，将新包内容解压覆盖到**原来加载的目录**；确认该目录里的 `manifest.json` 版本是 `2.4.0`。若原来加载的是 Windows 整包下的 `extension`，只覆盖那个子目录。
2. 在扩展管理页找到“序图终端”，点击一次“重新加载”（圆形箭头），再刷新序图网站。
3. 重新打开插件即可。使用 CLI 的用户选中目标网页后，在“更多 → 本地 CLI”点击“测试本地 CLI”。

保留原加载目录和扩展，不需要先卸载。GitHub 发布不会自动替换你电脑上开发者模式加载的文件；网站账号和计划保存在原网站，本次 UI 更新不修改计划。

## 可选：让本机 AI 通过 CLI 操作

只在你的 AI 能执行本机命令时需要，普通 AI 聊天可跳过。

1. 安装 [Node.js](https://nodejs.org/) 22 或更高版本。
2. 下载 **windows.zip**，解压到固定目录；在扩展管理页加载其中的 `extension` 文件夹（已有插件也可使用现有扩展 ID，不要同时启用两份）。
3. 在扩展管理页的“详细信息”复制该扩展的 32 位 ID。
4. 双击整包内的 `native-host/INSTALL-WINDOWS.cmd`，粘贴 ID，按回车。安装只注册当前 Windows 用户的宿主；保留解压目录，移动后需重装。
5. 在主界面选中序图网页，展开“更多 → 本地 CLI”点击“测试本地 CLI”，分别查看宿主与网页两段结果。本机命令示例继续保留在安装手册中。
6. 如果你的 JSON 显式使用 script.execute，再在扩展详情开启“允许用户脚本”（浏览器提供该开关时）；其他普通业务 JSON 无需这一步。

详见 [Windows 手册](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.4.0/docs/WINDOWS_INSTALL.md)、[换电脑与分享](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.4.0/docs/CROSS_DEVICE.md)、[维护升级](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.4.0/docs/GITHUB_MAINTENANCE.md)。

## 遇到问题

- **找不到 manifest.json**：选错了层级；进入解压目录，找到文件后再选择它所在的文件夹。
- **提示先登录 / 暂未连接**：在同一个浏览器登录序图，刷新网站，关闭再打开插件。
- **界面还是旧的**：检查覆盖目录是否正确，并在扩展管理页重新加载。
- **CLI 未连接**：普通复制粘贴不受影响；需要 CLI 时检查 Node.js、扩展 ID 和整包路径。
- **仍然失败**：复制“更多 → 兼容性与排查”里的状态；有扩展报错时，把错误文字一并交给维护者。

## 验证范围

106项本地测试通过，0失败、0跳过。包含单元、JSDOM、本地HTTP契约及真实Windows宿主/CLI连接模拟网页，不等同于公司后端写入验收。新增功能未在真实计划上执行；没有操作真实鼠标或创建测试计划。

本轮网站公开源码重新下载遇到TLS EOF，沿用此前已核实的import/change契约。实际Chrome扩展加载后验证、真实网站新增命令写入和同事新设备安装仍未验证。版本冲突采用保守拒写，不自动合并；多步骤不保证事务，完整回读不匹配报告结果未确认。复杂文字引用不能自动理解，只改明确标记和用户列明的精确原文。

[局部修改与可靠性契约](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.4.0/docs/LOCAL_EDITING.md) · [完整测试报告](https://github.com/mkiekuum/xutu-control-terminal/blob/v2.4.0/docs/TEST_REPORT.md)
