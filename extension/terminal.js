import {validate} from './core.js';
import {parameterSchemas,validateStep} from './validation.js';
import {websiteGuide} from './website-guide.js';
import {aiInstructions,buildIntake} from './ai-brief.js';
export function prepareCommand(text,tabId,requestId){
 let source=text.trim();
 if(!source)throw Error('先粘贴 AI 返回的指令。');
 if(!source.startsWith('{')){
  const blocks=[...source.matchAll(/```([^\n]*)\r?\n([\s\S]*?)```/g)];
  if(blocks.length>1)throw Error('检测到多个代码块，请只粘贴本次要执行的一个完整JSON代码块。');
  if(blocks.length===1){if(!['','json'].includes(blocks[0][1].trim().toLowerCase()))throw Error('插件只接收 JSON，请改用完整 JSON 或 Markdown JSON 代码块。脚本需显式封装为 JSON 的 script.execute。');source=blocks[0][2].trim();}
  if(!source.startsWith('{'))throw Error('插件只接收 JSON，请让 AI 直接给出完整 JSON 代码块。命令行文本、独立 JavaScript、文件路径和问卷不能直接执行。');
 }
 if(!source)throw Error('先粘贴 AI 返回的指令。');
 let command;try{command=JSON.parse(source);}catch{throw Error('JSON 格式无效，请粘贴完整 JSON 对象或 Markdown JSON 代码块。');}
 command={...command,requestId:command.requestId??requestId,mode:'execute'};delete command.tabId;if(tabId)command.tabId=tabId;
 validate(command);for(const step of command.steps){if(/^(theme|layout)\./.test(step.op))throw Error('外观功能已移除。');validateStep(step);}
 return command;
}
export function buildPrompt(request,context,tabId,{intent}={}){
 if(!request.trim())throw Error('先写下你想做什么。');
 const businessContext=context?Object.fromEntries(Object.entries(context).filter(([key])=>!['websiteGuide','commandContract','aiGuidance','preferences'].includes(key))):null;
 const contracts=Object.fromEntries(Object.entries(parameterSchemas).filter(([op])=>op!=='script.execute'));
 const intake=buildIntake(intent==='create'?{...context,plan:null,target:null,status:null,permissions:null}:context);
 if(intent){intake.selectedIntent=intent;intake.unknowns=intake.unknowns.slice(1);}
 const intentGuide=intent==='create'?'用户已在插件明确选择【新建】。创建独立的新计划，优先一次plan.create提交完整节点与连线；不得用plan.replace/plan.update覆盖当前计划。当前选中计划只是参考，不自动继承其编号、负责人、执行人、日期、审核、基线或进度；新计划编号应核对未占用。不要再追问新建还是管理；若用户文字与此选择冲突，先澄清。':intent==='manage'?'用户已在插件明确选择【管理】。这包括新增/删除任务、合并拆分、调整依赖与结构、人员、日期、进度和审核等现有命令支持的操作，不局限于微调任务内部文字。根据用户具体授权选择命令，保留未要求改动的其他内容；不擅自扩大删除或审核范围。涉及既有计划时须确认目标和版本；未选中计划或目标不清楚先澄清，不猜目标。':'';
 return aiInstructions+'\n\n本次资料生成时间：'+new Date().toISOString()+'；用户浏览器时区：'+(context?.clientTimeZone||Intl.DateTimeFormat().resolvedOptions().timeZone||'未确认')+
 '\n所有业务澄清、表达偏好、人员与建议估时确认都在你与用户的AI聊天中完成。复杂任务先问3–6个有价值的问题，后续只补缺项；简单改名不问无关字段。不要要求用户填写插件问卷、保存偏好或点击方案确认。插件没有本地问卷、长期偏好或intakeId门禁。信息充分后直接给一个完整JSON代码块，不生成文件链接。'+
 '\n项目组关联：project.assignPlan.params.planIdFrom={stepId:前面plan.create步骤id,field:"targetId"}，并dependsOn依赖该创建步骤；不得猜新建ID。网站截止是硬约束，预测完成不是deadline；owner默认当前账号，但节点负责人/连线executor须分别核实。'+
 '\n本次操作选择：'+intentGuide+
 '\n信息核对摘要：'+JSON.stringify(intake)+
 '\n网站详细说明与规划守则：'+JSON.stringify(context?.websiteGuide||websiteGuide)+
 '\n参数契约：'+JSON.stringify(contracts)+
 '\n当前完整计划上下文（网站规则与参数契约已在上方独立列出）：'+JSON.stringify(businessContext)+
 '\n当前网页标签ID：'+(tabId||'尚未选择')+
 '\n用户本次需求：'+request.trim();
}
export function summarize(result){
 if(['partial_undo','partial_redo'].includes(result?.status))return (result.status==='partial_undo'?'部分撤销完成。':'部分重做完成。')+'已完成目标保留，其他目标未恢复；请查看详情与差异。';
 if(result?.status==='success'){if(result.steps?.every(s=>s.data?.valid))return '格式校验通过，尚未写入网站。';if(result.steps?.some(s=>s.data?.after&&s.serverVerified===false))return '已生成预览，尚未写入网站。';return result.steps?.every(s=>s.serverVerified)?'网站操作成功，已回读确认。':'执行已返回；详见结果中的确认状态。';}
 const failure=result?.steps?.find(s=>s.status==='failed');
 const plain={INTAKE_REQUIRED:'先完成需求问卷，再让 AI 生成指令。',ESTIMATE_NOT_CONFIRMED:'先展开人员与工期方案，核实后再执行。',INTAKE_CONTEXT_CHANGED:'账号、网页或计划内容已变化，请重新核对问卷。',REQUIRED_FIELD_UNKNOWN:'还有必需信息未明确，请查看提示补充。',UNDO_CONFLICT:'网站内容已变化，本次未覆盖；请展开结果查看差异。',REDO_CONFLICT:'网站内容已变化，本次未覆盖；请展开结果查看差异。',RESTORE_UNSUPPORTED:'该记录包含无法安全恢复的操作，未执行恢复。',HISTORY_SNAPSHOT_INCOMPLETE:'有尚未确认的执行或恢复，请先打开历史核对现状。',HISTORY_EMPTY:'没有可用的历史记录。',INVALID_SCHEMA:'指令格式或参数不正确，请复制详情给 AI 修正。',PERMISSION_DENIED:'当前账号无权执行这项修改，网站内容未被强行覆盖。',NOT_LOGGED_IN:'请先在序图网站登录，再重新打开插件。',TARGET_AMBIGUOUS:'请先明确选择要操作的计划或网页。',TARGET_NOT_FOUND:'没有找到指定计划，请核对目标。'};
 if(failure?.outcome==='unconfirmed'||['NON_IDEMPOTENT_RETRY_BLOCKED','TIMEOUT_RESULT_UNKNOWN','SCRIPT_TIMEOUT'].includes(result?.code||failure?.code))return '结果尚未确认。请先读取网站最新内容或复制结果求助，不要换编号重复执行。';
 if(failure?.code==='VERSION_CONFLICT')return (result.status==='partial_success'?'部分步骤已完成。':'')+failure.message;
 return (result?.status==='partial_success'?'部分完成：':'未执行成功：')+(plain[failure?.code||result?.code]||failure?.message||result?.message||failure?.code||result?.code||'连接异常，请重试。');
}

export function commandSummary(command){
 return command.steps.map(s=>{
 if(s.op==='node.batchUpdate'){const updates=s.params.updates;const names=updates.filter(x=>Object.hasOwn(x.set,'name')).length;const onlyNames=updates.every(x=>Object.keys(x.set).every(k=>k==='name'));return '调整'+updates.length+'个节点（'+names+'个名称）'+(onlyNames?'；工期、人员、依赖和布局不变':'；仅修改列明字段');}
 if(s.op==='node.renumber')return '调整节点编号：'+s.params.mapping.map(m=>m.from+'→'+m.to).join('，')+'；同步连线、明确引用及布局，业务依赖不变';
 if(s.op==='node.update')return '修改节点'+s.params.id+'的'+Object.keys(s.params.set).map(k=>({name:'名称',content:'内容',owner:'负责人'}[k]||k)).join('、')+'；其余字段保持';
 if(s.op==='node.reorder')return '调整显示排序，不重编号、不改依赖';
 if(s.op==='plan.replace')return '全量替换计划内容，可能改变工期、人员和布局；请核对是否符合需求';
 return ({'plan.create':'创建独立计划','plan.update':'修改列明的计划属性','plan.delete':'将计划移入垃圾桶','task.merge':'合并工作，请核对内容、工期和验收要求','task.split':'拆分工作，请核对各段工期','script.execute':'执行明确提供的脚本，效果无法静态保证'}[s.op]||({'edge.create':'添加工作或依赖','edge.update':'修改指定连线的估时、执行人或类型','edge.remove':'移除指定连线','node.create':'添加节点','node.remove':'删除指定节点','graph.simplify':'清理已有替代路径的零耗时虚线','review.submit':'提交计划审核','review.approve':'批准审核','review.reject':'退回审核','plan.archive':'将计划移入垃圾桶','plan.restore':'从垃圾桶恢复计划','plan.copy':'复制为新计划','schedule.updateInputs':'修改列明的计划日期','task.assign':'修改工作执行人','task.updateStatus':'修改工作完成状态','progress.complete':'登记实际完成日期','progress.update':'修改实际完成日期','history.restore':'恢复指定历史状态','plan.restoreSnapshot':'恢复本机快照，可能覆盖现有内容'}[s.op])||(s.op.startsWith('group.')||s.op.startsWith('project.')?'调整项目或权限分组，请核对指令详情':s.op.startsWith('convert.')?'转换数据格式':'读取信息，不直接修改计划'));
 }).join('；');
}
export async function stableRequestId(text){
 let source=text.trim();const block=[...source.matchAll(/```[^\n]*\r?\n([\s\S]*?)```/g)];if(block.length===1)source=block[0][1];
 let value;try{value=JSON.parse(source);}catch{return 'invalid';}
 if(value.requestId)return value.requestId;
 const sorted=x=>Array.isArray(x)?x.map(sorted):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sorted(x[k])])):x;
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(sorted(value))));
 return 'ui-'+Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
