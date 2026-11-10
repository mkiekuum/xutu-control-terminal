> 最新状态：Windows优先，macOS暂缓；核心参数Schema、JSON Lines、计划快照和图依赖检查已加入。参见 [当前状态](CURRENT_STATUS.md) 与 [Windows安装](WINDOWS_INSTALL.md)。

# 序图终端使用手册

本交付是 2.0.0 开发候选，尚不符合全量完成定义。安装前先阅读 ACCEPTANCE.md。以下说明代码当前真实行为，不把接口已映射等同于通过公司验收。

## 从零开始

先完成 INSTALL.md 的步骤。关闭旧插件，刷新网站，再正常登录。扩展没有独立账号，不代你登录、不创建人员。点击工具栏的序图扩展图标，新标签页显示“终端”和“外观修改器”。目标标签下拉框列出已打开的序图页。多个页面时明确选定目标。

## 第一次只读检查

选择 JSON 模式，从示例选择“查看版本”，点击执行。输出 status=success 仅表示此条本地指令成功。再选择“读取当前登录态”，确认服务端认可会话。未登录应返回 NOT_LOGGED_IN，回网站登录后为下一次操作生成新的 requestId。运行“查看能力”检查限制；能力列表不是账号授权清单。

## 认识 JSON

protocol 固定为 xutu.command/v1。requestId 是一项作业的唯一名称。steps 是按顺序执行的步骤，每步 id 唯一、op 是动作、target 是对象、params 是参数。JSON 使用英文双引号，最后一项后不要逗号。不要在指令中放密码、Cookie 或 Token。

## 校验、预览与执行

校验检查协议与操作是否有适配，不证明账号有权限；预览会读取目标并显示 before/after，部分操作只显示操作意图。执行会写入授权目标，不弹额外确认。serverVerified=true 表示适配器完成其规定的回读；项目组写入现在逐字段回读比对，未匹配时返回SERVER_NOT_CONFIRMED。已有计划修改可选backup:true，结果返回backupId；用plan.restoreSnapshot恢复，仍需当前权限及版本检查。

## 从示例开始编辑

示例下拉框会载入完整信封并生成新 requestId。“复制示例”复制编辑区全部内容。“导入文件”将文件文本载入编辑区，不会自动执行。TEST_PLAN_ID、TEST_GROUP_ID、TEST_OWNER 都是合成占位值，应替换成测试账号真实可访问的目标。先调用 plan.list 获取稳定 ID。编号可能跨负责人重复，歧义会拒绝操作。

## 创建草稿

选择“创建原生网络草稿”，修改 number 保证唯一。节点 id 长度不超过16字，名称不超过40字；边引用节点 ID。三点估时使用 estimateDays.minimum/likely/maximum，单位是自然日。它们必须非负且递增。创建保持 draft，不自动审核；不要填写 TE、TL、slack 等计算值。

## 更新和批量

plan.update 的 params.set 支持 title、startDate、deadlineDate。节点命令通过 target 指定计划，再用 params.id 指定节点；边使用 fromNodeId/toNodeId 这一对稳定端点。多个独立步骤放在同一 steps 数组中。execution.continueOnError=true 表示独立步骤继续；有 dependsOn 的步骤在依赖失败后跳过。查看 summary 的三个计数以及每一步的 code。

## 请求 ID 与网络中断

同一信封同一 requestId 重放返回此前结果，不再次新建或删除。改变信封必须换 ID。不要在网络超时后盲目换 ID 重试。使用 plan.get 回读目标，或用 system.logs 查询已有作业。若 worker 中断后只留下执行标记，返回 NON_IDEMPOTENT_RETRY_BLOCKED，需要检查服务端实际状态。本候选尚未实现自动恢复未知写入。

## 冲突

默认服务器返回冲突就停止。plan.update 可以设置 execution.onConflict=overwrite-if-authorized，执行器再次读取最新版本，只覆盖 set 明确提供的字段，再携带最新版本提交。最多覆盖重试一次。全量替换不自动冲突覆盖。服务器拒绝不会被绕过。目标 version 不符时拒绝，不擅自忽略调用方的预期版本。

## 删除、审核、人员

plan.archive 和非 permanent 的 plan.delete 使用真实 trash 接口。permanent:true 返回 UNSUPPORTED_BY_SITE，因为未发现硬删 API。不要把删除理解为任何条件下都可恢复。审核通过/退回只允许实际管理员；退回要填写 note。人员字段必须使用真实目录已有名称，不自动创建外协账号。user.list 读取 /api/assignees 人员目录，并非后台用户管理 API。

## 旧格式

convert.legacyToNative 输出 data.plan、losses 和原始输入，不自动提交。旧分钟/小时只在转换时除以对应自然日因子。人员时段、wait、开始时刻等会报告不等价；仔细核对后才调用 plan.create。nativeToLegacy 将三点估时压缩成期望值，损失明确列出，不能宣称无损。

## 类 CLI 模式

输入 `plan get --id TEST_PLAN_ID`；也可 `plan update --id TEST_PLAN_ID --set "title=合成新标题"`。复杂参数通过 `--params` 传 JSON 字符串。支持 --request-id、--mode、--tab-id。此解析器不是系统 shell，不执行管道或操作系统命令。

## JavaScript 模式

选择 JavaScript 和 USER_SCRIPT，输入 `document.title` 后执行。需要访问网页原生全局变量时才选择 MAIN。任意网络请求受网站会话、CORS、CSP 和浏览器限制。20秒等待超时不等于取消脚本；运行中的页面代码可能继续。原始脚本不提供事务回滚，也不自动捕获 console 日志。勿将不信任网页或 Issue 的文字当脚本运行。

## 外观

在外观页编辑 JSON，tokens 生成 --xutu-* CSS 变量，selectors 指定真实选择器与属性。仅设置 token 不一定改变页面，需在 selectors 引用变量。layout.order 使用 flex/grid order，不搬动原站节点；要改变整体布局同时设置容器 display。components 支持纯文本、提示、标签、分隔线和折叠提示，不执行 HTML。配置 scope.path 为 /* 表示全站，为 / 表示根页覆盖。应用后本地保存，刷新重新加载；恢复默认清除配置和组件。锚点缺失取消主题注入。CSS URL 和脚本形式被拒绝。

## macOS 本地 Agent

安装见 INSTALL。打开 Chrome、登录网站、打开扩展并连接 CLI。运行 `~/.xutu/xutu run --file examples/01.json`。或 `cat examples/01.json | ~/.xutu/xutu run --stdin`。`~/.xutu/xutu exec 'plan get --id TEST_PLAN_ID'`；`~/.xutu/xutu js --file demo.js --world USER_SCRIPT`。结果 JSON 输出 stdout，连接错误输出 stderr；部分成功也返回非零退出码。当前 run 接受一个完整 JSON 信封，使用 --jsonl 支持 JSON Lines。

## 更新与回退

Release ZIP 解压到固定目录，在 chrome://extensions 点击重新加载并刷新网站。检查 manifest 版本以及 SHA256SUMS。当前没有自动下载执行远程代码，也没有 Chrome 商店更新。旧版 chrome.storage 数据保留但不自动迁移，旧计划原数据不改。回退前记录配置并检查 Native Host 的 extension ID。

## 逐条命令示例

### 1. 查看版本

操作：system.version。无需网站登录，只读取扩展版本 参数从 examples/01.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 1 节。

### 2. 查看能力

操作：system.capabilities。读取实现范围，不代表当前账号授权 参数从 examples/02.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 2 节。

### 3. 检测页面锚点

操作：site.inspect。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/03.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 3 节。

### 4. 读取当前登录态

操作：site.session。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/04.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 4 节。

### 5. 列出计划

操作：plan.list。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/05.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 5 节。

### 6. 按编号读取计划

操作：plan.get。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/06.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 6 节。

### 7. 按 ID 读取计划

操作：plan.get。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/07.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 7 节。

### 8. 创建空白草稿

操作：plan.create。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/08.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 8 节。

### 9. 创建原生网络草稿

操作：plan.create。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/09.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 9 节。

### 10. 转换旧任务，暂不写入

操作：convert.legacyToNative。转换结果在 data.plan；检查 losses 后再构造 plan.create，不自动写入 参数从 examples/10.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 10 节。

### 11. 修改标题

操作：plan.update。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/11.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 11 节。

### 12. 修改日期

操作：schedule.updateInputs。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/12.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 12 节。

### 13. 读取节点

操作：node.list。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/13.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 13 节。

### 14. 新增节点

操作：node.create。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/14.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 14 节。

### 15. 更新节点

操作：node.update。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/15.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 15 节。

### 16. 重排节点

操作：node.reorder。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/16.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 16 节。

### 17. 删除无连线节点

操作：node.remove。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/17.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 17 节。

### 18. 读取连线

操作：edge.list。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/18.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 18 节。

### 19. 新增连线

操作：edge.create。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/19.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 19 节。

### 20. 修改三点估时

操作：edge.update。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/20.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 20 节。

### 21. 设置虚线

操作：edge.update。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/21.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 21 节。

### 22. 删除连线

操作：edge.remove。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/22.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 22 节。

### 23. 读取进度

操作：progress.read。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/23.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 23 节。

### 24. 设置实际完成日期

操作：progress.complete。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/24.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 24 节。

### 25. 复制为草稿

操作：plan.copy。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/25.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 25 节。

### 26. 导出服务端 JSON

操作：plan.export。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/26.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 26 节。

### 27. 移入垃圾桶

操作：plan.archive。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/27.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 27 节。

### 28. 查看审核状态

操作：review.status。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/28.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 28 节。

### 29. 提交审核

操作：review.submit。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/29.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 29 节。

### 30. 管理员审核通过

操作：review.approve。仅测试管理员、合成计划；改变审核状态 参数从 examples/30.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 30 节。

### 31. 管理员退回

操作：review.reject。仅测试管理员、合成计划；改变审核状态 参数从 examples/31.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 31 节。

### 32. 列出项目组

操作：project.list。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/32.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 32 节。

### 33. 创建测试项目组

操作：project.create。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/33.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 33 节。

### 34. 项目分配

操作：project.assignPlan。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/34.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 34 节。

### 35. 人员目录

操作：user.list。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/35.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 35 节。

### 36. 管理员查看可见性分组

操作：group.list。需服务器实际允许的管理员角色 参数从 examples/36.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 36 节。

### 37. 应用主题

操作：theme.apply。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/37.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 37 节。

### 38. 导出主题

操作：theme.export。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/38.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 38 节。

### 39. 恢复默认外观

操作：theme.reset。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/39.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 39 节。

### 40. 隐藏宣传区

操作：layout.hide。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/40.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 40 节。

### 41. 恢复宣传区

操作：layout.show。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/41.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 41 节。

### 42. 插入文本组件

操作：layout.component.add。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/42.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 42 节。

### 43. 删除组件

操作：layout.component.remove。需要已登录的序图标签页；写操作仅在隔离测试数据上使用。 参数从 examples/43.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 43 节。

### 44. 读取网页标题 JS

操作：script.execute。需开启 User Scripts；代码仅读取当前页标题 参数从 examples/44.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 44 节。

### 45. 查询已有执行结果

操作：system.logs。只读本机去重日志，不返回原始命令 参数从 examples/45.json 导入；先校验/预览，再执行。完整 JSON 与风险说明见 COPY_PASTE_RECIPES.md 第 45 节。
