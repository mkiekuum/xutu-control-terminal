import {prepareCommand,buildPrompt,summarize} from './terminal.js';
const $=id=>document.getElementById(id);let tabs=[],lastSignature='',lastRequestId='';
const tabId=()=>Number($('tabs').value)||undefined;
const message=(text,error=false)=>{$('message').textContent=text;$('message').dataset.error=String(error);};
const send=async input=>{const result=await chrome.runtime.sendMessage(input);if(!result)throw Error('插件未响应，请重新加载插件。');return result;};
const envelope=(op,target)=>({protocol:'xutu.command/v1',requestId:crypto.randomUUID(),...(tabId()?{tabId:tabId()}:{}),steps:[{id:'read',op,...(target?{target}:{})}]});
function data(result){if(result.status!=='success')throw Error(summarize(result));return result.steps[0].data;}
async function busy(id,action){const button=$(id);button.disabled=true;try{await action();}catch(e){message(e.message,true);}finally{button.disabled=false;}}
async function clipboard(text){await navigator.clipboard.writeText(text);}
async function refresh(){
 const prior=tabId();tabs=await send({kind:'tabs'});if(!Array.isArray(tabs))throw Error('无法读取序图网页。');$('tabs').replaceChildren();
 for(const tab of tabs){const option=document.createElement('option');option.value=tab.id;option.textContent=tab.title+' · '+tab.id;$('tabs').append(option);}
 if(tabs.some(t=>t.id===prior))$('tabs').value=prior;else if(tabs.find(t=>t.active))$('tabs').value=tabs.find(t=>t.active).id;
 $('targetRow').hidden=tabs.length<2;if(!tabs.length){$('connection').textContent='先打开序图并登录';return;}
 const session=await send({kind:'run',command:envelope('site.session')});$('connection').textContent=session.status==='success'?'已连接 · 使用当前网站账号':'请在序图网站登录后重新打开插件';
}
$('openSite').onclick=()=>busy('openSite',async()=>{await send({kind:'openSite'});});
$('tabs').onchange=()=>refresh().catch(e=>message(e.message,true));
$('copyPrompt').onclick=()=>busy('copyPrompt',async()=>{
 if(!$('request').value.trim())throw Error('先写下你想做什么。');
 const context=tabId()?data(await send({kind:'run',command:envelope('site.context')})):null;
 await clipboard(buildPrompt($('request').value,context,tabId()));message(context?.plan?(context.complete?'已复制完整计划与状态，粘贴给 AI 即可。':'已复制；部分状态未能读取，提示词中已注明。'):'已复制。尚未选中计划，AI 可先生成查询或新建指令。');
});
$('execute').onclick=()=>busy('execute',async()=>{
 const signature=JSON.stringify([$('editor').value,$('mode').value,tabId()]);
 if(signature!==lastSignature){lastSignature=signature;lastRequestId=crypto.randomUUID();}
 const command=prepareCommand($('editor').value,$('mode').value,tabId(),lastRequestId);
 message('正在执行，请稍候…');const result=await send({kind:'run',command});$('output').textContent=JSON.stringify(result,null,2);$('resultDetails').hidden=false;message(summarize(result),result.status!=='success');if(result.status!=='success')$('resultDetails').open=true;
});
$('copyResult').onclick=event=>{event.preventDefault();busy('copyResult',async()=>{await clipboard($('output').textContent);message('结果已复制。');});};
$('extensionId').textContent=chrome.runtime.id;$('copyId').onclick=()=>busy('copyId',async()=>{await clipboard(chrome.runtime.id);message('扩展 ID 已复制。');});
$('native').onclick=()=>busy('native',async()=>{const result=await send({kind:'native'});$('cliStatus').textContent=result.message||'未连接';if(!result.connected)throw Error(result.message||'请先安装本地宿主。');});
$('copyCli').onclick=()=>busy('copyCli',async()=>{
 const context=tabId()?data(await send({kind:'run',command:envelope('site.context')})):null;
 const suffix=tabId()?' --tab-id '+tabId():'';
 const usage='Windows PowerShell：\n& "$env:USERPROFILE\\.xutu\\windows\\xutu.cmd" tabs\n& "$env:USERPROFILE\\.xutu\\windows\\xutu.cmd" context'+suffix+'\n& "$env:USERPROFILE\\.xutu\\windows\\xutu.cmd" run --file command.json'+suffix;
 await clipboard(buildPrompt($('request').value.trim()||'先理解当前计划与状态，按用户接下来的要求修改。',context,tabId())+'\n\n你可以直接调用本地CLI。修改前用context命令刷新状态，按最新版本写入；执行后回读。\n'+usage);message('已复制 CLI 用法、计划详情和状态。');
});
window.addEventListener('unhandledrejection',event=>message(event.reason?.message||'连接异常，请重新打开插件。',true));
refresh().catch(e=>{$('connection').textContent='暂未连接';message(e.message,true);});
