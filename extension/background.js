import {captureSummary,redact} from './assistance.js';
import {Executor,validate,fail,VERSION,clean} from './core.js';
import {ApiAdapter,reads,writes} from './api.js';
import {legacyToNative,nativeToLegacy} from './converter.js';
import {validateStep,parameterSchemas} from './validation.js';
import {collectContext} from './context.js';
import {readNativeAnalysis} from './website-guide.js';
import {buildIntake} from './ai-brief.js';
import {collectCompatibility,probeNativeCompatibility} from './compatibility.js';
import {createUpdateChecker} from './updates.js';
import {LocalStore,accountKey} from './local-store.js';
import {HistoryManager,isBusinessWrite} from './history.js';
import {capturePage,pageChunk,releasePageExport} from './html-export.js';
const privateStore=new LocalStore();
const exportHandles=new Map();
async function sessionFor(tab){const session=await request(tab,'/api/session');if(!session.actor||session.mustChangePassword)fail('NOT_LOGGED_IN','请先在序图网站登录并完成账号设置。');return session;}
async function exportCommand(tab,op,p){
 const session=await sessionFor(tab);let func,args;
 if(op==='site.html.begin'){func=capturePage;args=[p.kind];}
 else {const handle=exportHandles.get(p.exportId);if(!handle||handle.actor!==session.actor||handle.tabId!==tab.id)fail('EXPORT_CONTEXT_CHANGED','导出已过期或账号/网页变化，请重新导出。');func=op==='site.html.chunk'?pageChunk:releasePageExport;args=[p.exportId,p.offset];}
 const data=(await chrome.scripting.executeScript({target:{tabId:tab.id},world:'ISOLATED',func,args}))[0]?.result;
 if(op==='site.html.begin'){if(!data?.exportId)fail('EXPORT_FAILED');exportHandles.set(data.exportId,{actor:session.actor,tabId:tab.id});if(exportHandles.size>16)exportHandles.delete(exportHandles.keys().next().value);}
 if(op==='site.html.release')exportHandles.delete(p.exportId);return data;
}
const checkUpdates=createUpdateChecker({load:async()=>(await chrome.storage.local.get('releaseCheck')).releaseCheck,save:report=>chrome.storage.local.set({releaseCheck:report})});
async function compatibilityFor(tab){return collectCompatibility({inspect:()=>bridge(tab.id,{kind:'inspect'}),session:()=>request(tab,'/api/session'),plans:()=>request(tab,'/api/plans'),probe:async()=>(await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:probeNativeCompatibility}))[0]?.result,userScripts:async()=>{if(!chrome.userScripts?.getScripts)return false;await chrome.userScripts.getScripts();return true;}});}
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
export const executor=new Executor(store,async(s,e,batch)=>{
 validateStep(s);
 if(s.op==='convert.legacyToNative')return {data:legacyToNative(s.params),serverVerified:false};
 if(s.op==='convert.nativeToLegacy')return {data:nativeToLegacy(s.params),serverVerified:false};
 if(s.op==='system.version')return {data:{version:VERSION},serverVerified:false};
 if(s.op==='site.tabs')return {data:(await chrome.tabs.query({url:'https://plan.fpgabbs.cn/*'})).map(t=>({id:t.id,title:t.title,active:t.active})),serverVerified:false};
 if(s.op==='system.capabilities'||s.op==='site.capabilities')return {data:{api:Object.keys(reads).concat(writes,['site.context','site.tabs','site.compatibility']),local:Object.keys(parameterSchemas).filter(op=>op.startsWith('site.html.')||['history.list','history.diff','history.undo','history.redo','history.restorePoint','history.resolvePending','history.preview','history.pending'].includes(op)),unavailable:['plan.delete permanent','user.create','user.update','user.disable','role.*','schedule.recalculate','server history'],testStatus:'contract observed; test status varies by operation; see docs/LIVE_TEST_RESULTS.md'},serverVerified:false};
 if(s.op==='system.logs'||s.op==='system.status'){const job=await store.get('job:'+(batch?.scope?batch.scope+':':'')+s.params?.requestId);return {data:job?.result||{status:job?'unconfirmed':'not_found',message:job?'此请求已有执行记录但未确认完成；只读核对，不自动重发。':'没有找到执行记录；不代表网站未修改。'},serverVerified:false};}
 if(s.op==='system.backup.get')return {data:await store.get('snapshot:'+s.params.backupId)||null,serverVerified:false};
 const tab=await tabFor(e);
 if(batch?.actor&&(await sessionFor(tab)).actor!==batch.actor)fail('HISTORY_CONTEXT_MISMATCH','登录账号在执行期间变化，已停止后续操作。');
 if(s.op.startsWith('site.html.'))fail('EXPORT_USER_ACTION_REQUIRED','网页原文只通过主界面的复制/导出按钮读取，不进入执行日志。');
 if(['history.list','history.diff','history.undo','history.redo','history.restorePoint','history.resolvePending','history.preview','history.pending'].includes(s.op)){
 const session=await sessionFor(tab),history=new HistoryManager(privateStore,async(...args)=>{if(args[1]==='POST'&&(await sessionFor(tab)).actor!==session.actor)fail('HISTORY_CONTEXT_MISMATCH');return request(tab,...args);},{lookupRequest:async requestId=>store.get('job:'+await accountKey(session.actor)+':'+requestId)});let data;
 if(s.op==='history.preview')data=await history.preview(session.actor,s.params,s.params.direction);else if(s.op==='history.pending')data=await history.diagnosePending(session.actor);else if(s.op==='history.list')data=await history.list(session.actor);else if(s.op==='history.diff')data=await history.diff(session.actor,s.params);else if(e.mode==='preview'||e.mode==='validate')return {data:{valid:true,notice:'预览不修改网站或历史游标'},serverVerified:false};else if(s.op==='history.resolvePending')data=await history.resolvePending(session.actor,s.params);else data=await history.restore(session.actor,session.role,s.params||{},e.requestId,s.op==='history.undo'?'undo':s.op==='history.redo'?'redo':'point');
 if(data.status&&data.status!=='success')throw Object.assign(Error('部分恢复未完成；已成功的目标保留，请查看各项结果。'),{code:data.status==='failed'?(data.outcomes?.find(x=>x.status==='failed')?.code||'RESTORE_FAILED'):data.status.toUpperCase(),outcome:data.outcomes?.some(x=>x.outcome==='unconfirmed')?'unconfirmed':data.outcomes?.some(x=>x.status==='success')?'partially_executed':'not_executed',diagnostic:data});
 return {data,serverVerified:!!data.outcomes?.length&&data.status==='success'};
 }
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
 const api=new ApiAdapter(async(path,method,body)=>{let tries=method==='POST'?1:(e.execution?.retry?.maxAttempts||1);for(let i=0;i<tries;i++){try{return await request(tab,path,method,body);}catch(err){if(err.code!=='NETWORK_ERROR'||i===tries-1)throw err;await new Promise(r=>setTimeout(r,Math.min(10000,(e.execution?.retry?.backoffMs||500)*2**i)));}}},{saveSnapshot:(id,value)=>store.set('snapshot:'+id,value),loadSnapshot:id=>store.get('snapshot:'+id),expectedActor:batch?.actor,onPhase:phase=>{try{chrome.runtime.sendMessage({kind:'executionPhase',requestId:e.requestId,phase}).catch(()=>{});}catch{}}});const guarded=batch?.prepared?await batch.history.protectStep(s,batch.prepared):s;const result=await api.run(guarded,e);if(batch?.prepared)await batch.history.trackStep(result,batch.prepared);return result;
},{
 context:async e=>{if(!e.steps.some(s=>isBusinessWrite(s)||s.op.startsWith('history.')||['system.logs','system.status'].includes(s.op)))return null;const tab=await tabFor(e),session=await sessionFor(tab);return {...session,tab,scope:await accountKey(session.actor)};},
 before:async(e,ctx)=>{
 if(!e.steps.some(isBusinessWrite)||['validate','preview'].includes(e.mode))return ctx;
 if(e.steps.some(s=>['history.undo','history.redo','history.restorePoint','history.resolvePending','history.preview','history.pending'].includes(s.op)))fail('INVALID_SCHEMA','历史恢复与业务写入请分成独立批次。');
 const history=new HistoryManager(privateStore,(...args)=>request(ctx.tab,...args));
 const prepared=await history.prepare(ctx.actor,e);return {...ctx,history,prepared};
 },
 after:async(e,result,ctx)=>ctx?.prepared?ctx.history.finish(ctx.actor,ctx.prepared,e,result):undefined
});
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(sender.id!==chrome.runtime.id||sender.url?.split(/[?#]/)[0]!==chrome.runtime.getURL('ui.html'))return;
 (async()=>{
  if(message.kind==='openSite'){const tabs=await chrome.tabs.query({url:'https://plan.fpgabbs.cn/*'});if(tabs.length)await chrome.tabs.update(tabs[0].id,{active:true});else await chrome.tabs.create({url:'https://plan.fpgabbs.cn/'});return {opened:true};}
  if(message.kind==='tabs')return (await chrome.tabs.query({url:'https://plan.fpgabbs.cn/*'})).map(t=>({id:t.id,title:t.title,active:t.active}));
  if(message.kind==='updates')return checkUpdates();
  if(message.kind==='pageSummary'){const tab=await tabFor(message);await sessionFor(tab);return redact((await chrome.scripting.executeScript({target:{tabId:tab.id},world:'ISOLATED',func:captureSummary}))[0]?.result);}
  if(message.kind==='export'){const op='site.html.'+message.action;validateStep({id:'export',op,params:message.params});if(!['site.html.begin','site.html.chunk','site.html.release'].includes(op))fail('INVALID_SCHEMA');return exportCommand(await tabFor(message),op,message.params);}
  if(message.kind==='run'){const e=message.command;if(e?.steps?.some(s=>s.op?.startsWith('site.html.'))){validate(e);if(e.steps.length!==1)fail('INVALID_SCHEMA','网页导出请使用独立指令，不与业务操作混合');const s=e.steps[0];validateStep(s);if(!['site.html.begin','site.html.chunk','site.html.release'].includes(s.op))fail('INVALID_SCHEMA');const value=['preview','validate'].includes(e.mode)?{valid:true}:await exportCommand(await tabFor(e),s.op,s.params);return {protocol:'xutu.result/v1',requestId:e.requestId,status:'success',steps:[{id:s.id,status:'success',serverVerified:false,data:value}],notice:'此导出不写入日志或批次历史'};}return executor.run(e);}
  fail('INVALID_SCHEMA');
 })().then(reply,e=>reply({status:'failed',...(message.command?.requestId?{requestId:message.command.requestId}:{}),code:e.code||'INTERNAL_ERROR',message:e.message}));return true;
});
chrome.runtime.onInstalled.addListener(()=>{chrome.storage.local.remove(['xutuThemes','xutuThemeUndo','releaseCheck']);chrome.storage.session.remove('aiConnection');});
