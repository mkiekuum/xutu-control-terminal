# 本机 MCP 服务

这是序图终端的可选连接组件，不是旧版业务 CLI 或 Native Messaging。无需公网域名和公网部署。普通 JSON 和网页侧栏优化不需要启动此服务。

## 首次使用

1. 登录序图，输入需求，点击“复制给 MCP AI”。首次由浏览器询问允许连接本机，须使用者自己授权。
2. 插件自动生成/保留当前浏览器私有连接配置并绑定当前选中网页，无文件导入或手填表单。提示词含 clientToken 和 bridgeToken，供可信本机 AI 自动配置；普通 AI 提示词不包含它们。
3. 把提示词交给有本机工具的 AI，按其中步骤检查 Node22+、获取/核验同版源码、将精确配置写入用户目录 .xutu-mcp/connection.json、运行 mcp/start-local.mjs、配置客户端并核验。不能把该配置当成网站 JSON 执行。AI 无本机工具时无法自动安装，应回到普通 JSON。
4. 服务仅监听127.0.0.1:62924，不部署公网。保持服务进程；关闭后连接断开。Windows 手动备用入口为 mcp/Start-MCP.cmd，普通 JSON 使用不需要 Node。
5. 每位用户独立生成凭据，不随源码分享。旧配置更新前核对归属和在途请求；只停止确认为该本机服务的进程。浏览器重启后再次点击复制会绑定当前网页；密钥沿用，断开则删除本机扩展配置。

服务启动报 EADDRINUSE 时先确认是否已经启动，不能杀掉所有 Node 进程。更改端口可在私有 connection.json 的 url 中调整，本版自动配对使用默认端口，特殊端口由维护者统一配置，不在首页提供设置表单。重启服务后旧队列不恢复；原执行结果未知时先查网站/插件原 requestId，不能重新发送旧写入。

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
