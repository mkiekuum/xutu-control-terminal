# 本机 MCP 服务

这是序图终端的可选连接组件，不是旧版业务 CLI 或 Native Messaging。无需公网域名和公网部署。普通 JSON 和网页侧栏优化不需要启动此服务。

## 首次使用

1. 安装 Node.js 22 或更高版本。普通插件使用者仅用 JSON 时不需要 Node。
2. 下载完整源码 ZIP 并解压，在根目录运行 `node mcp/start-local.mjs`。Windows 也可双击 `mcp/Start-MCP.cmd`。服务只监听 `127.0.0.1:62924`，保持启动窗口；关闭后 MCP 断开。
3. 启动器首次生成用户主目录 `.xutu-mcp/connection.json`。这是私有凭据文件，不要上传 Git 或随源码分享，浏览器桥密钥不交给 AI。每位用户独立生成自己的密钥。
4. 插件“更多 → MCP 连接 → 导入本机连接”，选择刚生成的 connection.json，允许浏览器访问本机地址。文件只在本机读取，不上传；只绑定当前选中的已登录序图网页，无需手填地址和密钥。
5. AI 客户端使用 `/mcp` 地址与 `clientToken`。AI 与浏览器密钥不同。按用户要求，“MCP AI”复制的提示词包含地址及 clientToken，不包含 bridgeToken；只发给可信 AI。普通 AI 提示词不包含连接密钥。获得提示词不等于客户端已配置 MCP；有本机工具的 Agent 可按提示词和本手册配置，不支持 MCP 的聊天窗口仍需用 JSON。

服务启动报 EADDRINUSE 时先确认是否已经启动，不能杀掉所有 Node 进程。更改端口可在私有 connection.json 的 url 中调整，并同步客户端与插件配置。重启服务后旧队列不恢复；原执行结果未知时先查网站/插件原 requestId，不能重新发送旧写入。

## 支持标准 Streamable HTTP 的客户端

地址：`http://127.0.0.1:62924/mcp`。Authorization 为 `Bearer <clientToken>`。客户端设置中通常称 HTTP/Streamable HTTP MCP，字段名可能不同，以该客户端官方说明为准。

Codex 可使用：

```powershell
# 从本机私有配置读取，不在命令历史粘贴密钥正文
$connection = Get-Content "$env:USERPROFILE\.xutu-mcp\connection.json" -Raw | ConvertFrom-Json
[Environment]::SetEnvironmentVariable('XUTU_MCP_TOKEN', $connection.clientToken, 'User')
$env:XUTU_MCP_TOKEN = $connection.clientToken
codex mcp add xutu-terminal --url http://127.0.0.1:62924/mcp --bearer-token-env-var XUTU_MCP_TOKEN
```

已打开的客户端可能需要退出并重新启动才能继承环境变量。不要覆盖已存在且指向其他服务的同名配置。

## 只支持 stdio 的客户端

使用 `node` 运行本机绝对路径 `mcp/stdio.mjs`，在客户端环境设置 `XUTU_MCP_TOKEN` 为 clientToken。可选 `XUTU_MCP_URL` 默认为本机地址。适配器转发标准 JSON-RPC，不在 stdout 输出日志或凭据。

```json
{
  "mcpServers": {
    "xutu-terminal": {
      "command": "node",
      "args": ["填写解压目录的绝对路径/mcp/stdio.mjs"],
      "env": {"XUTU_MCP_TOKEN": "仅在本机设置自己的 clientToken"}
    }
  }
}
```

这是一种常见配置形状，不代表每个 AI 客户端都使用同一配置文件。不支持 MCP 的 AI 使用“普通 AI”提示词和 JSON；浏览器内的云端聊天产品通常不能直接访问本机地址，本版不保证其支持。

## 换电脑与私有跨电脑访问

默认推荐在新电脑独立启动服务、安装插件并登录自己的网站账号。新电脑不要重放旧电脑结果未知的指令。

若 AI 在电脑 B、登录网站的浏览器在电脑 A，可使用已经获授权且可达的私有 SSH 连接：在 B 执行 `ssh -N -L 62924:127.0.0.1:62924 用户@电脑A的私有地址`，B 的 AI 仍连本机 `/mcp`，使用 A 的 clientToken；A 的插件连 A 本机服务。不要将服务绑定 0.0.0.0 或在路由器开放端口。未配置 SSH/私有网络时不能宣称跨电脑连接已完成。本版不自动安装 SSH、开放防火墙或部署公网服务。

每个实例只绑定一个活动浏览器桥，另一浏览器会被拒绝，旧桥停止约90秒后才可接管。多位用户用独立实例/密钥，不共用同一个队列。服务不替用户持有网站 Cookie，网站操作由选定浏览器的真实会话完成。

## 协议与执行边界

- `xutu_read`：只读 JSON 查询，返回 jobId 后用 `xutu_result` 获取结果。
- `xutu_preview`：一次操作或一个 plan.batch 的预览，保存短期执行依据。
- `xutu_execute`：绑定成功 previewJobId 与使用者本次明确同意原文 approval。预览有效期5分钟，不能更换命令；账号/网页变化、版本冲突会停止。恢复通过既有 history.preview 的 reviewToken 核对。
- `xutu_result`：查询原任务；dispatched 表示尚未确认完成，不是成功，也不能自动重发。

AI 必须先展示预览摘要并等用户同意。approval 由客户端引用，服务无法独立证明这是人类输入，不能将此说成独立人工认证；不要编造同意。脚本执行和完整网页导出不通过 MCP 开放，仍保留在本机插件的显式操作中。其他现有业务/审核操作遵循正式参数契约及服务器权限，不代表每项均通过真实网站测试。

约30秒轮询一次，浏览器休眠或关闭会延迟/停止。预览在扩展本机短期保存，浏览器工作线程重启可继续核对；服务重启不重放任务。断开不会撤销已经提交的操作。日志/任务仅在本机，服务内存最多保留1000条任务，满时维护者先核对未知结果再重启。

实现依据：[MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)、[Codex MCP](https://learn.chatgpt.com/docs/extend/mcp)。协议握手版本 2025-06-18，提供 JSON 响应；GET SSE 未实现，返回405。不是对所有 AI 产品的兼容保证。
