# 序图终端使用手册（2.1.0）

## 安装与开始

Windows安装见WINDOWS_INSTALL.md。更新已经加载的扩展时，在浏览器扩展管理页点一次“重新加载”，再打开插件。无需重新登录AI服务，因为插件不再连接AI API。登录仍由序图网站完成。

插件只有一个页面，没有“终端”导航按钮。顶部显示网站连接状态；未登录时使用“打开序图”。多个网页时选择要操作的目标，避免误改计划。

## 自然语言到指令

在第一个框描述需求，点击“复制 AI 提示词”，粘贴给你常用的AI。复制时读取当前选中计划的完整服务端内容并包含在提示词中，无需额外勾选。当前计划的名称、编号、人员和任务正文都会包含；不会后台发送到第三方服务。未选计划则附带空上下文，要求AI先查询或生成新计划。

将AI返回的JSON放入第二个输入框，点击“一键执行”。代码围栏包裹的JSON也可识别。执行默认直接写入，不要求预览/确认。AI输出错误或网站拒绝会显示原因，不会假装成功。

## 结果与重复点击

成功后显示完成步骤数。失败时展开详细结果，复制给AI排查。serverVerified=true表示对应服务端操作做过回读；本地版本、网页脚本等不会声称服务端已保存。

同一输入、格式及目标在当前弹窗内重复点击会保留requestId，因此不会重复提交同一作业。编辑内容或换目标会生成新作业。网络错误后应先查询状态，不要盲目修改指令反复执行。

## JSON结构

protocol固定xutu.command/v1，steps按顺序执行。每一步有唯一id、op动作、target目标和params参数。target优先使用服务器id；按number定位遇到重名会拒绝猜测。执行按钮管理当前作业requestId，强制mode=execute；CLI/API仍支持validate/preview供高级用户自行调用。

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

## CLI与JavaScript

指令格式可切换JSON、CLI、JavaScript。CLI示例：plan get --number YOUR_NUMBER。复杂参数通过--params传JSON。JavaScript使用MAIN world，需要浏览器“允许用户脚本”授权；受网站会话、浏览器网络与权限限制，不等于系统命令执行。

本地CLI需先安装宿主；展开底部CLI区域，连接后复制CLI用法。外部AI通过本机xutu.cmd run --file command.json调用，多个网页务必带--tab-id。相关配置与安装路径见WINDOWS_INSTALL.md。

## 删除、人员与审核

删除/归档目前仅移入垃圾桶，permanent:true明确返回不可用。正常列表消失不代表垃圾桶彻底清空。审核通过/退回需要真实管理员权限；普通账号不能绕过。任务表写入依赖canAssign/canComplete，任务不在工作任务表则拒绝。

## 常见问题

未登录：回序图登录，重新打开插件。多标签歧义：选择目标或给CLI加tab-id。CLI连接失败：检查宿主是否安装、扩展ID和目录是否改变。版本冲突：读取最新计划后重新决定修改。参数错误：把详细结果复制给AI。完整能力与限制见CURRENT_STATUS.md。

## 给新AI的完整上下文

“复制 AI 提示词”和“复制 CLI 用法”共用site.context接口，包含当前计划原文（所有节点、连线、估时、人员、日期）、计划ID/编号/版本、审核记录、基线、完成日期、任务表及canAssign/canComplete权限、预计完成日期记录和依赖检查。还带账号角色、命令参数契约与能力限制，AI不需要从零猜字段。

CLI可运行：

~~~powershell
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" tabs
& "$env:USERPROFILE\.xutu\windows\xutu.cmd" context --tab-id YOUR_TAB_ID
~~~

context是只读快照，带capturedAt、target.version和complete。有部分接口失败或读取时版本改变，complete=false并列出warnings；不能把缺失状态当成未完成/无权限。写入前重新获取context，使用目标当前版本。工作任务表只保留当前计划，不附带其他计划的任务。

## 网站规则与真实评分

提示词与CLI context均包含websiteGuide：双代号网络、节点/工作区别、实线/虚线、三点估时、编号、任务资源、审核和权限规则。siteAnalysis读取当前网页的真实scorePlan/validatePlan及当前评分阈值，包含得分、逐项扣分、总工期、TE/TL、时差、关键边和完成率；读取不到时标记不完整，不编造分数。完整介绍见WEBSITE_GUIDE.md。

优先保证原任务完整、约束真实、编号稳定，再改善评分。固定等待不能改成虚线；不能删除有耗时的工作或修改评分阈值骗分。明确要求保留原数字按天演示时不得转换或缩短；长工期扣分可能无法消除。分数高也不证明人员、截止等现实约束全部可行。
