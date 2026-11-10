import {parseCLI,validate} from './core.js';
import {parameterSchemas,validateStep} from './validation.js';
import {websiteGuide} from './website-guide.js';
import {aiInstructions,buildIntake} from './ai-brief.js';
export function prepareCommand(text,mode,tabId,requestId){
 let source=text.trim();
 if(!source)throw Error('先粘贴 AI 返回的指令。');
 if(mode==='JSON'&&!source.startsWith('{')){
  const blocks=[...source.matchAll(/```([^\n]*)\r?\n([\s\S]*?)```/g)];
  if(blocks.length>1)throw Error('检测到多个代码块，请只粘贴本次要执行的一个完整JSON代码块。');
  if(blocks.length===1){if(!['','json'].includes(blocks[0][1].trim().toLowerCase()))throw Error('请选择JSON代码块，或切换到对应指令格式。');source=blocks[0][2].trim();}
  if(!source.startsWith('{'))throw Error('请让AI直接在聊天里输出完整JSON代码块，再复制粘贴；文件路径、链接和问卷不能作为指令执行。');
 }else source=source.replace(/^```(?:javascript|js|cli|text|powershell|bash)?\s*\n([\s\S]*?)\n```$/i,'$1');
 if(!source)throw Error('先粘贴 AI 返回的指令。');
 let command=mode==='CLI'?parseCLI(source):mode==='JavaScript'?{protocol:'xutu.command/v1',steps:[{id:'script',op:'script.execute',params:{source,world:'MAIN'}}]}:JSON.parse(source);
 command={...command,requestId,mode:'execute'};delete command.tabId;if(tabId)command.tabId=tabId;
 validate(command);for(const step of command.steps){if(/^(theme|layout)\./.test(step.op))throw Error('外观功能已移除。');validateStep(step);}
 return command;
}
export function buildPrompt(request,context,tabId){
 if(!request.trim())throw Error('先写下你想做什么。');
 const businessContext=context?Object.fromEntries(Object.entries(context).filter(([key])=>!['websiteGuide','commandContract','aiGuidance'].includes(key))):null;
 const contracts=Object.fromEntries(Object.entries(parameterSchemas).filter(([op])=>op!=='script.execute'&&op!=='history.list'));
 return aiInstructions+'\n\n本次资料生成时间：'+new Date().toISOString()+'；用户浏览器时区：'+(context?.clientTimeZone||Intl.DateTimeFormat().resolvedOptions().timeZone||'未确认')+
 '\n信息核对摘要：'+JSON.stringify(buildIntake(context))+
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
