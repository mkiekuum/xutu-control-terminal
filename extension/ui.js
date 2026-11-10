import {prepareCommand,buildPrompt,summarize} from './terminal.js';
import {formatCompatibility} from './compatibility.js';
const $=id=>document.getElementById(id);let tabs=[],lastSignature='',lastRequestId='',compatibilityReport=null,compatibilityGeneration=0,refreshGeneration=0;
const tabId=()=>Number($('tabs').value)||undefined;
const message=(text,error=false)=>{$('message').textContent=text;$('message').dataset.error=String(error);};
const send=async input=>{const result=await chrome.runtime.sendMessage(input);if(!result)throw Error('插件未响应，请重新加载插件。');return result;};
const envelope=(op,target)=>({protocol:'xutu.command/v1',requestId:crypto.randomUUID(),...(tabId()?{tabId:tabId()}:{}),steps:[{id:'read',op,...(target?{target}:{})}]});
function data(result){if(result.status!=='success')throw Error(summarize(result));return result.steps[0].data;}
async function busy(id,action){const button=$(id);button.disabled=true;try{await action();}catch(e){message(e.message,true);}finally{button.disabled=false;}}
async function clipboard(text){try{await navigator.clipboard.writeText(text);$('manualCopy').hidden=true;$('manualCopyText').value='';}catch{$('manualCopy').hidden=false;$('manualCopy').open=true;$('manualCopyText').value=text;throw Error('未能写入剪贴板，请在下方“手动复制内容”中复制完整文本。');}}
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
 for(const tab of tabs){const option=document.createElement('option');option.value=tab.id;option.textContent=tab.title+' · '+tab.id;$('tabs').append(option);}
 if(tabs.some(t=>t.id===prior))$('tabs').value=prior;else if(tabs.find(t=>t.active))$('tabs').value=tabs.find(t=>t.active).id;
 $('targetRow').hidden=tabs.length<2;if(!tabs.length){$('connection').textContent='先打开序图并登录';document.querySelector('.connection-strip').dataset.state='error';++compatibilityGeneration;showCompatibility(null);return;}
 const session=await send({kind:'run',command:envelope('site.session')});if(generation!==refreshGeneration)return;$('connection').textContent=session.status==='success'?'已连接 · 使用当前网站账号':'请在序图网站登录后重新打开插件';document.querySelector('.connection-strip').dataset.state=session.status==='success'?'connected':'error';await checkCompatibility();
}
$('openSite').onclick=()=>busy('openSite',async()=>{await send({kind:'openSite'});});
$('tabs').onchange=()=>refresh().catch(e=>message(e.message,true));
$('copyPrompt').onclick=()=>busy('copyPrompt',async()=>{
 if(!$('request').value.trim())throw Error('先写下你想做什么。');
 const selected=tabId(),context=await readContext();
 if(selected!==tabId())throw Error('目标网页已变化，请重新复制以获取对应计划。');
 await clipboard(buildPrompt($('request').value,context,tabId()));message(context?.plan?(context.complete?'已复制完整资料；AI应先核对信息，必要时提问。':'已复制；部分状态未能读取，提示词中已注明。'):'已复制。没有可确认的当前计划，AI应先核对需求和目标。');
});
$('execute').onclick=()=>busy('execute',async()=>{
 const signature=JSON.stringify([$('editor').value,$('mode').value,tabId()]);
 if(signature!==lastSignature){lastSignature=signature;lastRequestId=crypto.randomUUID();}
 const command=prepareCommand($('editor').value,$('mode').value,tabId(),lastRequestId);
 message('正在执行，请稍候…');const result=await send({kind:'run',command});$('output').textContent=JSON.stringify(result,null,2);$('resultDetails').hidden=false;message(summarize(result),result.status!=='success');if(result.status!=='success')$('resultDetails').open=true;
});
$('copyResult').onclick=event=>{event.preventDefault();busy('copyResult',async()=>{await clipboard($('output').textContent);message('结果已复制。');});};
$('extensionId').textContent=chrome.runtime.id;$('copyId').onclick=()=>busy('copyId',async()=>{await clipboard(chrome.runtime.id);message('扩展 ID 已复制。');});
$('native').onclick=()=>busy('native',async()=>{const result=await send({kind:'native'});$('cliStatus').textContent=result.message||'未连接';if(!result.connected)throw Error(result.message||'请先安装本地宿主。');await checkCompatibility();});
$('copyCli').onclick=()=>busy('copyCli',async()=>{
 const context=await readContext();
 const suffix=tabId()?' --tab-id '+tabId():'';
 const usage='Windows PowerShell：\n& "$env:USERPROFILE\\.xutu\\windows\\xutu.cmd" tabs\n& "$env:USERPROFILE\\.xutu\\windows\\xutu.cmd" context'+suffix+'\n& "$env:USERPROFILE\\.xutu\\windows\\xutu.cmd" run --file command.json'+suffix;
 await clipboard(buildPrompt($('request').value.trim()||'先理解当前计划与状态，按用户接下来的要求修改。',context,tabId())+'\n\n下面是当前Windows用户默认安装位置的CLI示例，不是已执行授权。只有能访问这台电脑的AI才能调用；在另一台电脑先按跨电脑手册安装，不沿用旧tab-id。信息不足时仍先提问。完整JSON必须在聊天代码块中提供；用户选择CLI后才保存该JSON为本地command.json并调用。修改前刷新context，执行后回读。\n'+usage);message('已复制 CLI 用法、计划详情和状态。');
});
window.addEventListener('unhandledrejection',event=>message(event.reason?.message||'连接异常，请重新打开插件。',true));
refresh().catch(e=>{$('connection').textContent='暂未连接';document.querySelector('.connection-strip').dataset.state='error';message(e.message,true);});
