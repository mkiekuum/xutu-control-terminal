import {Executor,parseCLI,fail,VERSION,clean} from './core.js';
import {ApiAdapter,reads,writes} from './api.js';
import {legacyToNative,nativeToLegacy} from './converter.js';
import {validateStep} from './validation.js';
import {collectContext} from './context.js';
import {readNativeAnalysis} from './website-guide.js';
import {buildIntake} from './ai-brief.js';
import {collectCompatibility,probeNativeCompatibility} from './compatibility.js';
async function compatibilityFor(tab){return collectCompatibility({inspect:()=>bridge(tab.id,{kind:'inspect'}),session:()=>request(tab,'/api/session'),plans:()=>request(tab,'/api/plans'),probe:async()=>(await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:probeNativeCompatibility}))[0]?.result,userScripts:async()=>{if(!chrome.userScripts?.getScripts)return false;await chrome.userScripts.getScripts();return true;},nativeConnected:ready});}
const store={get:async k=>(await chrome.storage.local.get(k))[k],set:async(k,v)=>chrome.storage.local.set({[k]:v})};
async function tabFor(e){if(e.tabId){const t=await chrome.tabs.get(e.tabId);if(new URL(t.url).origin!=='https://plan.fpgabbs.cn')fail('PERMISSION_DENIED');return t;}const tabs=await chrome.tabs.query({url:'https://plan.fpgabbs.cn/*'});if(tabs.length!==1)fail('TARGET_AMBIGUOUS','请打开唯一序图标签页或指定 tabId');return tabs[0];}
async function request(tab,path,method='GET',body){
 const r=await bridge(tab.id,{kind:'api',path,method,body});if(!r?.ok)fail(r?.code||'NETWORK_ERROR',r?.message||'网站连接失败');return r.data;
}
async function bridge(tabId,message){
 try{return await chrome.tabs.sendMessage(tabId,message);}catch(error){
 if(!String(error.message).includes('Receiving end does not exist'))throw error;
 await chrome.scripting.executeScript({target:{tabId},files:['content.js']});
 return chrome.tabs.sendMessage(tabId,message);
 }
}
export const executor=new Executor(store,async(s,e)=>{
 validateStep(s);
 if(s.op==='convert.legacyToNative')return {data:legacyToNative(s.params),serverVerified:false};
 if(s.op==='convert.nativeToLegacy')return {data:nativeToLegacy(s.params),serverVerified:false};
 if(s.op==='system.version')return {data:{version:VERSION},serverVerified:false};
 if(s.op==='site.tabs')return {data:(await chrome.tabs.query({url:'https://plan.fpgabbs.cn/*'})).map(t=>({id:t.id,title:t.title,active:t.active})),serverVerified:false};
 if(s.op==='system.capabilities'||s.op==='site.capabilities')return {data:{api:Object.keys(reads).concat(writes,['site.context','site.tabs','site.compatibility']),unavailable:['plan.delete permanent','user.create','user.update','user.disable','role.*','schedule.recalculate','history.diff'],testStatus:'contract observed; test status varies by operation; see docs/LIVE_TEST_RESULTS.md'},serverVerified:false};
 if(s.op==='system.logs'||s.op==='system.status')return {data:(await store.get('job:'+s.params?.requestId))?.result||{status:'unknown'},serverVerified:false};
 if(s.op==='system.backup.get')return {data:await store.get('snapshot:'+s.params.backupId)||null,serverVerified:false};
 const tab=await tabFor(e);
 if(s.op==='site.compatibility')return {data:await compatibilityFor(tab),serverVerified:false};
 if(s.op==='site.context'){
  const target=s.target?.id||s.target?.number?s.target:(await bridge(tab.id,{kind:'inspect'})).activeTarget;
  const context=await collectContext((path,method,body)=>request(tab,path,method,body),target);
  if(context.plan){
   try{const result=await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:readNativeAnalysis,args:[context.plan.current]});context.siteAnalysis=result[0]?.result||{available:false,reason:'网页未返回评分'};}
   catch(error){context.siteAnalysis={available:false,reason:error.message};}
   if(!context.siteAnalysis.available){context.complete=false;context.warnings.push('原站评分/计算未读取成功，不能保证状态完整。');}
  }
  context.compatibility=await compatibilityFor(tab);
  context.aiGuidance.intake=buildIntake(context);
  return {data:{...context,tabId:tab.id},serverVerified:!!context.plan&&context.complete};
 }
 if(s.op==='system.health'||s.op==='site.inspect')return {data:await bridge(tab.id,{kind:'inspect'}),serverVerified:false};
 if(s.op==='script.execute'){
 if(e.mode==='validate'||e.mode==='preview')return {data:{warning:'脚本不会执行；无法静态证明其效果',rollback:'not_guaranteed'},serverVerified:false};
 if(!chrome.userScripts?.execute)fail('USER_SCRIPTS_DISABLED','请开启扩展详情中的允许用户脚本；Chrome 135–137 需开发者模式');
 const p=s.params||{};if(typeof p.source!=='string'||!['MAIN','USER_SCRIPT'].includes(p.world))fail('INVALID_SCHEMA','需要 source 字符串及 world');
 let timer;try{const out=await Promise.race([chrome.userScripts.execute({target:{tabId:tab.id},world:p.world,js:[{code:p.source}]}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(Error('脚本超时；无法取消已运行脚本，请检查网页状态'),{code:'SCRIPT_TIMEOUT'})),20000);})]);if(out.some(x=>x.error))fail('SCRIPT_RUNTIME_ERROR','脚本执行错误；详情仅留在网页开发者工具');return {data:clean(out),serverVerified:false,rollback:'not_guaranteed'};}catch(err){fail(err.code||'SCRIPT_RUNTIME_ERROR',err.code?err.message:'浏览器拒绝或脚本异常，请检查用户脚本权限和网页控制台');}finally{clearTimeout(timer);}
 }
 const api=new ApiAdapter(async(path,method,body)=>{let tries=method==='POST'?1:(e.execution?.retry?.maxAttempts||1);for(let i=0;i<tries;i++){try{return await request(tab,path,method,body);}catch(err){if(err.code!=='NETWORK_ERROR'||i===tries-1)throw err;await new Promise(r=>setTimeout(r,Math.min(10000,(e.execution?.retry?.backoffMs||500)*2**i)));}}},{saveSnapshot:(id,value)=>store.set('snapshot:'+id,value),loadSnapshot:id=>store.get('snapshot:'+id)});return api.run(s,e);
});
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(sender.id!==chrome.runtime.id||sender.url?.split(/[?#]/)[0]!==chrome.runtime.getURL('ui.html'))return;
 (async()=>{
  if(message.kind==='openSite'){const tabs=await chrome.tabs.query({url:'https://plan.fpgabbs.cn/*'});if(tabs.length)await chrome.tabs.update(tabs[0].id,{active:true});else await chrome.tabs.create({url:'https://plan.fpgabbs.cn/'});return {opened:true};}
  if(message.kind==='native'){try{await connectNative();return {connected:true,message:'CLI 已连接，可直接运行命令。'};}catch(e){return {connected:false,message:e.message};}}
  if(message.kind==='tabs')return (await chrome.tabs.query({url:'https://plan.fpgabbs.cn/*'})).map(t=>({id:t.id,title:t.title,active:t.active}));
  if(message.kind==='run')return executor.run(message.command);
  fail('INVALID_SCHEMA');
 })().then(reply,e=>reply({status:'failed',code:e.code||'INTERNAL_ERROR',message:e.message}));return true;
});
let native,ready=false,connecting;
function connectNative(){
 if(ready)return Promise.resolve();if(connecting)return connecting;
 connecting=new Promise((resolve,reject)=>{
  let settled=false;const done=error=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve();};
  const timer=setTimeout(()=>{native?.disconnect();native=null;ready=false;done(Error('连接超时，请检查本地宿主是否已安装。'));},8000);
  try{
   native=chrome.runtime.connectNative('cn.fpgabbs.xutu');
   native.onMessage.addListener(m=>{if(m.kind==='ready'){ready=true;done();return;}executor.run(m.command).then(result=>native?.postMessage({id:m.id,result}),e=>native?.postMessage({id:m.id,result:{status:'failed',code:e.code||'INTERNAL_ERROR',message:e.message}}));});
   native.onDisconnect.addListener(()=>{const detail=chrome.runtime.lastError?.message;native=null;ready=false;done(Error('本地 CLI 未连接。请先安装宿主，再重试。'+(detail?' '+detail:'')));});
  }catch(error){native=null;done(error);}
 }).finally(()=>{connecting=null;});return connecting;
}
chrome.runtime.onStartup.addListener(()=>connectNative().catch(()=>{}));
chrome.runtime.onInstalled.addListener(()=>{chrome.storage.local.remove(['xutuThemes','xutuThemeUndo']);chrome.storage.session.remove('aiConnection');});
