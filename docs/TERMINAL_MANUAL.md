# 序图终端使用手册（2.4.0）

## 安装与开始

Windows安装见WINDOWS_INSTALL.md。更新已经加载的扩展时，在浏览器扩展管理页点一次“重新加载”，再打开插件。无需重新登录AI服务，因为插件不再连接AI API。登录仍由序图网站完成。

插件只有一个页面，没有“终端”导航按钮。顶部显示网站连接状态；未登录时使用“打开网站”。多个网页时选择要操作的目标，避免误改计划。

## 自然语言到指令

默认“新建”独立计划；选择“管理”可让 AI 协助新增/删除任务、调整结构、人员和进度等。该选择只指导提示词，不限制明确的 JSON 命令。在第一个框描述需求，点击“复制 AI 提示词”，粘贴给你常用的AI。复制时读取当前选中计划的完整服务端内容并包含在提示词中，无需额外勾选。当前计划的名称、编号、人员和任务正文都会包含；不会后台发送到第三方服务。未选计划则附带空上下文，要求AI先查询或生成新计划。

将AI返回的JSON放入第二个输入框，点击“执行”。代码围栏包裹的JSON也可识别。粘贴后自动显示改动摘要；执行默认直接写入，不要求额外确认。AI输出错误或网站拒绝会显示原因，不会假装成功。

## 结果与重复点击

成功后区分格式通过、预览、回读确认及未确认。失败时展开详细结果，复制给AI排查。serverVerified=true表示对应服务端操作做过回读；本地版本、网页脚本等不会声称服务端已保存。

输入自带requestId时原值保留到执行、结果和日志。没有编号时按规范化JSON生成稳定编号，重开弹窗仍可防止同一作业重复写入；修改内容却复用原ID会拒绝执行。新业务意图才生成新ID，未知结果不能换ID重发。网络错误后应先查询状态，不要盲目修改指令反复执行。

## JSON结构

protocol固定xutu.command/v1，steps按顺序执行。每一步有唯一id、op动作、target目标和params参数。target优先使用服务器id；按number定位遇到重名会拒绝猜测。执行按钮保留输入requestId，强制mode=execute；CLI/API仍支持validate/preview供高级用户自行调用。

## 计划、节点与连线

plan.create默认草稿，必须填写title和number。三点估时为estimateDays.minimum/likely/maximum，使用网站原生天数，非负且递增。虚任务必须三个0，不隐藏改变时间单位。

plan.update可修改标题、开工和截止日期。node.*调整节点；edge.*调整连线及执行人。全量替换需plan.replace和replace:true。修改先做版本检查，随后服务端回读，失败输出可能说明已写入但未确认。

## 合并、拆分和编号

合并使用task.merge，nodeIds依次包含无分支任务链，例如1、2、3；保留首尾1和3，移除中间2。三点估时分别求和。默认拒绝已完成、有基线、外部分支或独立验收里程碑，避免丢失进度和依赖。

拆分使用task.split，指定原边端点、新节点和N+1段估时。默认各段估时总和等于原三点估时；明确改变工期才使用allowDurationChange:true。新增ID不能重复。拆分及显式排序使用网站正式import接口保留提交顺序。

计划编号和保留节点ID不变；网站后续自身编辑可能重新编号，不能承诺原站显示序号永不变化。graph.inspect检查长任务、可合并链和冗余虚依赖；graph.simplify仅去掉已有替代路径的零耗时虚边。

## 批量、快照与日志

多个steps构成批次。dependsOn失败则依赖步骤跳过，continueOnError控制独立步骤继续。execution.backup=true可选本机快照；plan.restoreSnapshot需有效backupId且当前账号仍有权限。没有强制备份，不保证所有操作可恢复。

system.logs/system.status按requestId读取结果。跨浏览器不共享执行锁；未知写入中断后自动恢复尚未完成。

## 插件 JSON 与本机 CLI

插件指令框只接收原始 JSON 或单个 Markdown JSON 代码块。CLI 文本和独立 JavaScript 会提示改用 JSON，不再提供格式下拉框。业务命令、后台执行和参数校验保留。

JSON 中显式 script.execute 仍支持 MAIN / USER_SCRIPT world，沿用浏览器“允许用户脚本”授权和 source/world 校验，不新增确认弹窗；AI 提示词仍限制脚本命令，不能用它绕过业务契约。

本机 CLI 是另一入口，命令示例：xutu exec "plan get --number YOUR_NUMBER" --tab-id YOUR_TAB_ID。复杂参数用 --params 传 JSON，--mode preview / --mode validate 保留；run --file command.json 和 --jsonl 批量执行、context、doctor 也保留。

安装宿主后，在主界面选中网页，展开“更多 → 本地 CLI”点击“测试本地 CLI”。测试分别验证宿主响应和经实际 CLI 查询该网页，两步通过才整体成功。测试区只保留测试、脱敏诊断复制、安装/排查链接，没有命令输入或复制用法按钮。详见 CLI_DIAGNOSTICS.md；本机命令示例见 WINDOWS_INSTALL.md。

## 删除、人员与审核

删除/归档目前仅移入垃圾桶，permanent:true明确返回不可用。正常列表消失不代表垃圾桶彻底清空。审核通过/退回需要真实管理员权限；普通账号不能绕过。任务表写入依赖canAssign/canComplete，任务不在工作任务表则拒绝。

## 常见问题

未登录：回序图登录，重新打开插件。多标签歧义：选择目标或给CLI加tab-id。CLI连接失败：检查宿主是否安装、扩展ID和目录是否改变。版本冲突：读取最新计划后重新决定修改。参数错误：把详细结果复制给AI。完整能力与限制见CURRENT_STATUS.md。

## 给新AI的完整上下文

“复制 AI 提示词”和本机 CLI context 使用同一份 site.context 数据，包含当前计划原文（所有节点、连线、估时、人员、日期）、计划ID/编号/版本、审核记录、基线、完成日期、任务表及canAssign/canComplete权限、预计完成日期记录和依赖检查。还带账号角色、命令参数契约与能力限制，AI不需要从零猜字段。

CLI可运行：

~~~powershell
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" tabs
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" context --tab-id YOUR_TAB_ID
~~~

context是只读快照，带capturedAt、target.version和complete。有部分接口失败或读取时版本改变，complete=false并列出warnings；不能把缺失状态当成未完成/无权限。写入前重新获取context，使用目标当前版本。工作任务表只保留当前计划，不附带其他计划的任务。

## 网站规则与真实评分

提示词与CLI context均包含websiteGuide：双代号网络、节点/工作区别、实线/虚线、三点估时、编号、任务资源、审核和权限规则。siteAnalysis读取当前网页的真实scorePlan/validatePlan及当前评分阈值，包含得分、逐项扣分、总工期、TE/TL、时差、关键边和完成率；读取不到时标记不完整，不编造分数。完整介绍见WEBSITE_GUIDE.md。

优先保证原任务完整、约束真实、编号稳定，再改善评分。固定等待不能改成虚线；不能删除有耗时的工作或修改评分阈值骗分。明确要求保留原数字按天演示时不得转换或缩短；长工期扣分可能无法消除。分数高也不证明人员、截止等现实约束全部可行。

## 2.2新增入口

底部“更多 → 兼容性与排查”默认折叠，打开插件自动只读检查；可重新检查或一键复制脱敏状态。CLI命令为 xutu compatibility --tab-id ID。详细AI规则见AI_PROMPT_GUIDE.md，维护更新见GITHUB_MAINTENANCE.md，新设备与分享见CROSS_DEVICE.md。业务信息不足先问卷；软件维护按既有授权自主执行，不发维护问卷。

## 2.4 局部修改与偏好

更多→表达与修改偏好可选本次表达，显式记住后按账号和新建/管理场景隔离，可随时修改/重置。默认仅改指定部分；质量建议不等于错误，偏好不扩张本次授权。

批量改名用node.batchUpdate，重编号用node.renumber，显示排序仍是node.reorder；前两者需要target.version。后续同计划操作可用target.versionFrom引用已确认步骤，不能猜版本+1。冲突自动独立回读，保留最新内容，复制结果给AI核对差异；未知结果不盲重试。参见[详细契约与示例](LOCAL_EDITING.md)。
