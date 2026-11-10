# 故障排除

NOT_LOGGED_IN：回网站登录，再使用新作业ID。PERMISSION_DENIED：当前角色不允许，不能更换身份伪造权限。TARGET_AMBIGUOUS：指定稳定 ID 或 tabId。NETWORK_ERROR：写入可能已经发生，先回读，不直接换 ID 重试。USER_SCRIPTS_DISABLED：检查 Chrome 版本及用户脚本开关，重新加载扩展。NATIVE_DISCONNECTED/ENOENT：先启动 Chrome 并展开“更多 → 本地 CLI”并点击“测试本地 CLI”，再 doctor；macOS 路径须与注册一致。EADDRINUSE：多个宿主争用同一 socket，保留一个连接；确认全部宿主退出后才能删除 ~/.xutu/bridge.sock。

CLI 超时不取消执行；用原 requestId 查询。不要用删除幂等日志作为自动重试手段。

插件内两段 CLI 测试与脱敏诊断详见 [CLI_DIAGNOSTICS.md](CLI_DIAGNOSTICS.md)。插件仅输入 JSON，本机 xutu 命令应在本机终端执行。
