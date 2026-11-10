> 最新状态：Windows优先，macOS暂缓；核心参数Schema、JSON Lines、计划快照和图依赖检查已加入。参见 [当前状态](CURRENT_STATUS.md) 与 [Windows安装](WINDOWS_INSTALL.md)。

# 命令参考

所有命令共享 xutu.command/v1，target.id 首选；number 必须唯一。示例参数见 COPY_PASTE_RECIPES.md。参数拼写以示例与源码为准；此候选版尚未做到逐命令完整参数 Schema。

|操作|通道|角色|验收|
|---|---|---|---|
|plan.list|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|project.list|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|group.list|api|admin|unit/mock only; authenticated E2E pending|
|task.list|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|site.session|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|user.list|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.create|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.update|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.replace|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.copy|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.archive|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.delete|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.restore|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|node.create|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|node.update|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|node.remove|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|node.reorder|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|edge.create|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|edge.update|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|edge.remove|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|schedule.updateInputs|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|progress.update|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|progress.complete|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|review.submit|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|review.approve|api|admin|unit/mock only; authenticated E2E pending|
|review.reject|api|admin|unit/mock only; authenticated E2E pending|
|history.restore|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|project.create|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|project.assignPlan|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|group.create|api|admin|unit/mock only; authenticated E2E pending|
|group.update|api|admin|unit/mock only; authenticated E2E pending|
|group.remove|api|admin|unit/mock only; authenticated E2E pending|
|group.assign|api|admin|unit/mock only; authenticated E2E pending|
|system.version|local|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|system.capabilities|local|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|site.inspect|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.get|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|convert.legacyToNative|local|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|node.list|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|edge.list|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|progress.read|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.export|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|review.status|api|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|theme.apply|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|theme.export|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|theme.reset|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|layout.hide|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|layout.show|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|layout.component.add|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|layout.component.remove|dom|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|script.execute|userScripts|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|system.logs|local|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|plan.delete(permanent)|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|history.list|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|history.diff|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|schedule.read|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|schedule.recalculate|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|task.get|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|task.updateStatus|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|user.get|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|user.create|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|user.update|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|user.disable|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|role.list|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|role.grant|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|role.revoke|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|role.assign|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|project.update|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|project.remove|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|site.click|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|site.field.set|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|
|site.navigation|unavailable|current-session/server-authoritative|unit/mock only; authenticated E2E pending|

幂等：requestId 对应整个信封摘要，重复同一信封返回旧结果；不同信封复用 ID 拒绝。中断的写入记录不会自动重放，先 GET 核实。只读网络重试最多5次；POST 不自动重试。覆盖冲突仅 plan.update，明确指定 title/startDate/deadlineDate；refresh-retry 尚未实现。

错误：INVALID_SCHEMA 参数不合规；NOT_LOGGED_IN 会话过期；PERMISSION_DENIED 服务端或角色拒绝；TARGET_AMBIGUOUS 编号/标签页不唯一；VERSION_CONFLICT 版本冲突；UNSUPPORTED_BY_SITE 未核实接口；DOM_DRIFT 页面通信异常；THEME_ANCHOR_MISSING 外观锚点缺失；NETWORK_ERROR 网络结果未知；SERVER_NOT_CONFIRMED 回读未确认；NON_IDEMPOTENT_RETRY_BLOCKED 中断防重放；SCRIPT_RUNTIME_ERROR 脚本/浏览器报错。
