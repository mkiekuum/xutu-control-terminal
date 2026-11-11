import {compactPlanEdits} from './batch-input.js';
import {prepareCommand,buildPrompt,summarize,commandSummary,stableRequestId} from './terminal.js';
import {formatCompatibility} from './compatibility.js';
import {VERSION} from './core.js';
import {buildAgentUpdatePrompt,updateStatusText} from './updates.js';
import {setupHistory,setupExport} from './ui-workflows.js';
const $=id=>document.getElementById(id);let tabs=[],lastRequestId='',compatibilityReport=null,compatibilityGeneration=0,refreshGeneration=0;
let intent='create',updateReport=null;
chrome.runtime.onMessage.addListener((m,sender)=>{if(sender.id===chrome.runtime.id&&m.kind==='executionPhase'&&m.requestId===lastRequestId&&$('execute').disabled){const labels={checking:'正在检查网站最新内容…',submitting:'正在提交修改，请勿重复执行…',verifying:'网站已响应，正在回读核对…'};if(labels[m.phase])message(labels[m.phase]);}});
function chooseIntent(value){intent=value;$('createPlan').setAttribute('aria-pressed',String(value==='create'));$('managePlan').setAttribute('aria-pressed',String(value==='manage'));$('requestLabel').textContent=value==='create'?'新建计划的需求':'管理计划的需求';$('request').placeholder=value==='create'?'想新建什么计划？写下目标和要求…':'要新增、删除任务，还是调整依赖、人员或进度？';}
$('createPlan').onclick=()=>chooseIntent('create');$('managePlan').onclick=()=>chooseIntent('manage');
const tabId=()=>Number($('tabs').value)||undefined;
const message=(text,error=false)=>{$('message').textContent=text;$('message').dataset.error=String(error);};
const send=async input=>{const result=await chrome.runtime.sendMessage(input);if(!result)throw Error('插件未响应，请重新加载插件。');return result;};
const updatePromise=(async()=>{
 try{const result=await send({kind:'updates'});if(!['available','current','ahead','unknown'].includes(result.status))throw Error('UPDATE_UNAVAILABLE');updateReport=result;}
 catch{updateReport={status:'unknown',currentVersion:VERSION,reason:'请确认已重新加载插件，并检查网络后重新打开。'};}
 $('updateStatus').textContent=updateStatusText(updateReport);
 $('updateCheckedAt').textContent=updateReport.checkedAt?'检查时间：'+new Date(updateReport.checkedAt).toLocaleString()+(updateReport.cached?'（短时缓存）':''):'';
 $('moreLabel').textContent=updateReport.status==='available'?'更多 · 有新版本':'更多';$('moreLabel').dataset.update=String(updateReport.status==='available');
})();
const envelope=(op,target)=>({protocol:'xutu.command/v1',requestId:crypto.randomUUID(),...(tabId()?{tabId:tabId()}:{}),steps:[{id:'read',op,...(target?{target}:{})}]});
function data(result){if(result.status!=='success')throw Error(summarize(result));return result.steps[0].data;}
async function busy(id,action){const button=$(id);button.disabled=true;try{await action();}catch(e){message(e.message,true);}finally{button.disabled=false;}}
async function clipboard(text){try{await navigator.clipboard.writeText(text);$('manualCopy').hidden=true;$('manualCopyText').value='';}catch{$('manualCopy').hidden=false;$('manualCopy').open=true;$('manualCopyText').value=text;throw Error('未能写入剪贴板，请在下方“手动复制内容”中复制完整文本。');}}
$('copyUpdate').onclick=()=>busy('copyUpdate',async()=>{await updatePromise;await clipboard(buildAgentUpdatePrompt(updateReport,{currentVersion:VERSION,extensionId:chrome.runtime.id}));message('更新指令已复制，交给能操作本机的 AI Agent 执行；尚未更新软件。');});
function showCompatibility(report){compatibilityReport=report;$('compatibilityStatus').textContent=report?.status==='ok'?'基础只读检查通过；业务写入仍由服务器判定。':report?.status==='limited'?'部分检查待核对，展开下方报告查看。':'尚未完成网页兼容性检查。';$('compatibilityOutput').textContent=formatCompatibility(report);}
async function checkCompatibility(){const generation=++compatibilityGeneration,selected=tabId();let report;
 try{report=selected?data(await send({kind:'run',command:envelope('site.compatibility')})):null;}
 catch{report={status:'unavailable',checkedAt:new Date().toISOString(),checks:[{id:'connection',status:'fail',message:'无法读取兼容性报告，请确认插件已重新加载且序图网页已打开。'}],scope:'未执行业务写入。'};}
 if(generation===compatibilityGeneration&&selected===tabId())showCompatibility(report);return report;
}
async function readContext(){if(!tabId())return {complete:false,plan:null,warnings:['未打开序图网页，先根据需求提问，不猜测已有计划。']};try{const context=data(await send({kind:'run',command:envelope('site.context')}));if(context.compatibility)showCompatibility(context.compatibility);return context;}catch{return {complete:false,plan:null,warnings:['本次计划上下文读取失败；请先核对登录、目标网页及兼容性，不得假设当前计划内容。'],compatibility:compatibilityReport};}}
$('checkCompatibility').onclick=()=>busy('checkCompatibility',checkCompatibility);
$('copyCompatibility').onclick=()=>busy('copyCompatibility',async()=>{const report=await checkCompatibility();await clipboard(formatCompatibility(report));message('兼容状态已复制，可交给维护者；不含计划内容。');});
async function refresh(){
 const generation=++refreshGeneration,prior=tabId();const found=await send({kind:'tabs'});if(generation!==refreshGeneration)return;tabs=found;if(!Array.isArray(tabs))throw Error('无法读取序图网页。');$('tabs').replaceChildren();
 if(tabs.length>1){const empty=document.createElement('option');empty.value='';empty.textContent='请选择要操作的序图网页';$('tabs').append(empty);}
 for(const tab of tabs){const option=document.createElement('option');option.value=tab.id;option.textContent=tab.title+' · '+tab.id;$('tabs').append(option);}
 if(tabs.some(t=>t.id===prior))$('tabs').value=prior;
 $('targetRow').hidden=tabs.length<2;if(!tabs.length){$('connection').textContent='先打开序图并登录';document.querySelector('.connection-strip').dataset.state='error';++compatibilityGeneration;showCompatibility(null);return;}
 if(!tabId()){$('connection').textContent='请先选择要操作的序图网页';document.querySelector('.connection-strip').dataset.state='error';++compatibilityGeneration;showCompatibility(null);return;}
 const session=await send({kind:'run',command:envelope('site.session')});if(generation!==refreshGeneration)return;$('connection').textContent=session.status==='success'?'已连接 · 使用当前网站账号':'请在序图网站登录后重新打开插件';document.querySelector('.connection-strip').dataset.state=session.status==='success'?'connected':'error';await checkCompatibility();
}
$('openSite').onclick=()=>busy('openSite',async()=>{await send({kind:'openSite'});});
$('tabs').onchange=()=>{historyUI.reset();return refresh().catch(e=>message(e.message,true));};
$('copyPrompt').onclick=()=>busy('copyPrompt',async()=>{
 if(!$('request').value.trim())throw Error('先写下你想做什么。');
 const selected=tabId(),selectedIntent=intent,requestText=$('request').value,context=await readContext();
 if(selected!==tabId()||selectedIntent!==intent||requestText!==$('request').value)throw Error('操作选择或需求已变化，请重新复制以获取对应资料。');
 await clipboard(buildPrompt(requestText,context,selected,{intent:selectedIntent}));message(intent==='create'?'已复制新建提示词，发给 AI 生成独立计划。':context?.plan?(context.complete?'已复制管理提示词与当前计划资料。':'已复制；部分状态未能读取，提示词中已注明。'):'已复制；涉及既有计划时，请先在网站选中目标，AI 会核对。');
});
$('execute').onclick=()=>busy('execute',async()=>{
 lastRequestId=await stableRequestId($('editor').value);
 const command=compactPlanEdits(prepareCommand($('editor').value,tabId(),lastRequestId));
 $('changeSummary').textContent=commandSummary(command);message('格式校验通过，正在核对网站最新内容并执行…');await new Promise(resolve=>setTimeout(resolve,0));let result;try{result=await send({kind:'run',command});}catch{result={requestId:command.requestId,status:'failed',code:'TIMEOUT_RESULT_UNKNOWN',message:'连接中断，执行结果尚未确认。请只读核对，不要重新提交。'};}$('output').textContent=JSON.stringify(result,null,2);$('resultDetails').hidden=false;message(summarize(result),result.status!=='success');if(result.status!=='success')$('resultDetails').open=true;await historyUI.load(false).catch(()=>{});
});
$('editor').addEventListener('input',()=>{try{$('changeSummary').textContent=commandSummary(prepareCommand($('editor').value,tabId(),'preview-only'));}catch{$('changeSummary').textContent='请粘贴完整指令；格式校验通过后显示改动摘要。';}});
$('copyResult').onclick=event=>{event.preventDefault();busy('copyResult',async()=>{await clipboard($('output').textContent);message('结果已复制。');});};
const helpers={$ ,tabId,send,message,busy,clipboard,intent:()=>intent,envelope,data,readContext,chooseIntent};
const historyUI=setupHistory(helpers);setupExport(helpers);
window.addEventListener('unhandledrejection',event=>message(event.reason?.message||'连接异常，请重新打开插件。',true));
refresh().catch(e=>{$('connection').textContent='暂未连接';document.querySelector('.connection-strip').dataset.state='error';message(e.message,true);});
