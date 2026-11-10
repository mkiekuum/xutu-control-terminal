import {prepareCommand,buildPrompt,summarize,commandSummary,stableRequestId} from './terminal.js';
import {formatCompatibility} from './compatibility.js';
import {VERSION} from './core.js';
import {buildAgentUpdatePrompt,updateStatusText} from './updates.js';
import {formatCliDiagnostics,stageText} from './cli-diagnostics.js';
import {neutralPreferences,sanitizePreferences,preferenceKey} from './preferences.js';
const $=id=>document.getElementById(id);let tabs=[],lastRequestId='',compatibilityReport=null,compatibilityGeneration=0,refreshGeneration=0;
let intent='create',updateReport=null,cliReport=null,preferenceScope=null;
const preferenceFields={audience:'prefAudience',detail:'prefDetail',naming:'prefNaming',scope:'prefScope',numbering:'prefNumbering'};
const selectedPreferences=()=>sanitizePreferences(Object.fromEntries(Object.entries(preferenceFields).map(([key,id])=>[key,$(id).value])));
function showPreferences(values){for(const[key,id]of Object.entries(preferenceFields))$(id).value=values[key];}
async function loadPreferences(){const selected=tabId(),scene=intent;const report=await send({kind:'preferences',tabId:selected,scene,action:'get'});if(selected!==tabId()||scene!==intent)return null;if(!report.scope){preferenceScope=null;showPreferences(neutralPreferences);return null;}if(preferenceScope!==report.scope){preferenceScope=report.scope;showPreferences(report.values);}$('preferenceStatus').textContent=report.remembered?'已记住此账号、此场景的选择；可修改或重置。':'未保存，仅用于本次。';return report;}
$('preferenceDetails').ontoggle=()=>{if($('preferenceDetails')?.open)return loadPreferences().catch(()=>{$('preferenceStatus').textContent='先登录网站，暂不读取或保存长期偏好。';});};
$('rememberPreferences').onclick=()=>busy('rememberPreferences',async()=>{if(!preferenceScope)throw Error('请先展开偏好并登录网站。');const report=await send({kind:'preferences',tabId:tabId(),scene:intent,action:'save',values:selectedPreferences(),scope:preferenceScope});if(!report.scope)throw Error(report.message||'未能保存偏好');$('preferenceStatus').textContent='已记住，仅此账号、此场景使用。';});
$('resetPreferences').onclick=()=>busy('resetPreferences',async()=>{if(!preferenceScope){showPreferences(neutralPreferences);return;}const report=await send({kind:'preferences',tabId:tabId(),scene:intent,action:'reset',scope:preferenceScope});if(!report.scope)throw Error(report.message||'未能重置');showPreferences(neutralPreferences);$('preferenceStatus').textContent='已重置，恢复中性默认。';});
function chooseIntent(value){if(intent!==value){preferenceScope=null;showPreferences(neutralPreferences);}intent=value;$('createPlan').setAttribute('aria-pressed',String(value==='create'));$('managePlan').setAttribute('aria-pressed',String(value==='manage'));$('requestLabel').textContent=value==='create'?'新建计划的需求':'管理计划的需求';$('request').placeholder=value==='create'?'想新建什么计划？写下目标和要求…':'要新增、删除任务，还是调整依赖、人员或进度？';}
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
$('tabs').onchange=()=>{preferenceScope=null;showPreferences(neutralPreferences);cliReport=null;$('copyDiagnostics').disabled=true;$('hostTest').textContent='1. 宿主连接与响应：未测试';$('pageTest').textContent='2. 经本机 CLI 查询选中网页：未测试';$('cliStatus').textContent='目标已改变，请重新测试。';return refresh().catch(e=>message(e.message,true));};
$('copyPrompt').onclick=()=>busy('copyPrompt',async()=>{
 if(!$('request').value.trim())throw Error('先写下你想做什么。');
 const selected=tabId(),selectedIntent=intent,requestText=$('request').value,context=await readContext();
 await loadPreferences().catch(()=>{preferenceScope=null;showPreferences(neutralPreferences);});
 if(context.account?.actor&&preferenceScope&&await preferenceKey(context.account.actor,selectedIntent)!==preferenceScope)throw Error('登录账号已变化，请重新复制以读取当前账号资料。');
 if(selected!==tabId()||selectedIntent!==intent||requestText!==$('request').value)throw Error('操作选择或需求已变化，请重新复制以获取对应资料。');
 await clipboard(buildPrompt(requestText,context,selected,{intent:selectedIntent,preferences:selectedPreferences()}));message(intent==='create'?'已复制新建提示词，发给 AI 生成独立计划。':context?.plan?(context.complete?'已复制管理提示词与当前计划资料。':'已复制；部分状态未能读取，提示词中已注明。'):'已复制；涉及既有计划时，请先在网站选中目标，AI 会核对。');
});
$('execute').onclick=()=>busy('execute',async()=>{
 lastRequestId=await stableRequestId($('editor').value);
 const command=prepareCommand($('editor').value,tabId(),lastRequestId);
 $('changeSummary').textContent=commandSummary(command);message('格式校验通过，正在核对网站最新内容并执行…');await new Promise(resolve=>setTimeout(resolve,0));const result=await send({kind:'run',command});$('output').textContent=JSON.stringify(result,null,2);$('resultDetails').hidden=false;message(summarize(result),result.status!=='success');if(result.status!=='success')$('resultDetails').open=true;
});
$('editor').addEventListener('input',()=>{try{$('changeSummary').textContent=commandSummary(prepareCommand($('editor').value,tabId(),'preview-only'));}catch{$('changeSummary').textContent='请粘贴完整指令；格式校验通过后显示改动摘要。';}});
$('copyResult').onclick=event=>{event.preventDefault();busy('copyResult',async()=>{await clipboard($('output').textContent);message('结果已复制。');});};
$('testCli').onclick=()=>busy('testCli',async()=>{
 const selected=tabId();cliReport=null;$('copyDiagnostics').disabled=true;$('hostTest').textContent='1. 宿主连接与响应：测试中…';$('pageTest').textContent='2. 经本机 CLI 查询选中网页：等待宿主响应…';$('cliStatus').textContent='正在执行两段只读测试…';
 let report;try{report=await send({kind:'cliTest',...(selected?{tabId:selected}:{})});if(!Array.isArray(report.stages))throw Error('INVALID_REPORT');}
 catch{report={version:VERSION,testedAt:new Date().toISOString(),stages:[{id:'host',status:'failed',code:'HOST_RESPONSE_INVALID'},{id:'page',status:'skipped'}]};}
 if(selected!==tabId()){$('hostTest').textContent='1. 宿主连接与响应：未测试当前目标';$('pageTest').textContent='2. 经本机 CLI 查询选中网页：未测试当前目标';$('cliStatus').textContent='测试期间目标已改变，请重新测试。';return;}
 cliReport=report;$('copyDiagnostics').disabled=false;const host=report.stages.find(s=>s.id==='host'),page=report.stages.find(s=>s.id==='page');
 $('hostTest').textContent='1. 宿主连接与响应：'+stageText(host);$('pageTest').textContent='2. 经本机 CLI 查询选中网页：'+stageText(page);
 $('cliStatus').textContent=host?.status==='passed'&&page?.status==='passed'?'测试成功，两步均通过。':'测试未通过，请按各阶段原因排查。';
});
$('copyDiagnostics').onclick=()=>busy('copyDiagnostics',async()=>{if(!cliReport)throw Error('请先测试本地 CLI。');await clipboard(formatCliDiagnostics(cliReport));message('诊断结果已复制，不包含计划、账号或本机路径。');});
window.addEventListener('unhandledrejection',event=>message(event.reason?.message||'连接异常，请重新打开插件。',true));
refresh().catch(e=>{$('connection').textContent='暂未连接';document.querySelector('.connection-strip').dataset.state='error';message(e.message,true);});
