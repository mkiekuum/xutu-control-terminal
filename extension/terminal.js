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
  if(blocks.length===1){if(!['','json'].includes(blocks[0][1].trim().toLowerCase()))throw Error('插件只接收 JSON，请改用完整 JSON 或 Markdown JSON 代码块。CLI 请在本机终端运行；脚本需显式封装为 JSON 的 script.execute。');source=blocks[0][2].trim();}
  if(!source.startsWith('{'))throw Error('插件只接收 JSON，请让 AI 直接给出完整 JSON 代码块。CLI 文本、独立 JavaScript、文件路径和问卷不能直接执行。');
 }
 if(!source)throw Error('先粘贴 AI 返回的指令。');
 let command;try{command=JSON.parse(source);}catch{throw Error('JSON 格式无效，请粘贴完整 JSON 对象或 Markdown JSON 代码块。');}
 command={...command,requestId,mode:'execute'};delete command.tabId;if(tabId)command.tabId=tabId;
 validate(command);for(const step of command.steps){if(/^(theme|layout)\./.test(step.op))throw Error('外观功能已移除。');validateStep(step);}
 return command;
}
export function buildPrompt(request,context,tabId,{intent}={}){
 if(!request.trim())throw Error('先写下你想做什么。');
 const businessContext=context?Object.fromEntries(Object.entries(context).filter(([key])=>!['websiteGuide','commandContract','aiGuidance'].includes(key))):null;
 const contracts=Object.fromEntries(Object.entries(parameterSchemas).filter(([op])=>op!=='script.execute'&&op!=='history.list'));
 const intake=buildIntake(intent==='create'?{...context,plan:null,target:null,status:null,permissions:null}:context);
 if(intent){intake.selectedIntent=intent;intake.unknowns=intake.unknowns.slice(1);}
 const intentGuide=intent==='create'?'用户已在插件明确选择【新建】。创建独立的新计划，优先一次plan.create提交完整节点与连线；不得用plan.replace/plan.update覆盖当前计划。当前选中计划只是参考，不自动继承其编号、负责人、执行人、日期、审核、基线或进度；新计划编号应核对未占用。不要再追问新建还是管理；若用户文字与此选择冲突，先澄清。':intent==='manage'?'用户已在插件明确选择【管理】。这包括新增/删除任务、合并拆分、调整依赖与结构、人员、日期、进度和审核等现有命令支持的操作，不局限于微调任务内部文字。根据用户具体授权选择命令，保留未要求改动的其他内容；不擅自扩大删除或审核范围。涉及既有计划时须确认目标和版本；未选中计划或目标不清楚先澄清，不猜目标。':'';
 return aiInstructions+'\n\n本次资料生成时间：'+new Date().toISOString()+'；用户浏览器时区：'+(context?.clientTimeZone||Intl.DateTimeFormat().resolvedOptions().timeZone||'未确认')+
 '\n本次操作选择：'+intentGuide+
 '\n信息核对摘要：'+JSON.stringify(intake)+
 '\n网站详细说明与规划守则：'+JSON.stringify(context?.websiteGuide||websiteGuide)+
 '\n参数契约：'+JSON.stringify(contracts)+
 '\n当前完整计划上下文（网站规则与参数契约已在上方独立列出）：'+JSON.stringify(businessContext)+
 '\n当前网页标签ID：'+(tabId||'尚未选择')+
 '\n用户本次需求：'+request.trim();
}
export function summarize(result){
 if(result?.status==='success')return `已完成${result.summary?' '+result.summary.success+' 步':''}。`;
 const failure=result?.steps?.find(s=>s.status==='failed');
 return (result?.status==='partial_success'?'部分完成：':'未执行成功：')+(failure?.message||result?.message||failure?.code||result?.code||'连接异常，请重试。');
}
