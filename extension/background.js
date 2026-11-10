import {Executor,parseCLI,fail,VERSION,clean} from './core.js';
import {ApiAdapter,reads,writes} from './api.js';
import {legacyToNative,nativeToLegacy} from './converter.js';
import {validateStep} from './validation.js';
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
 if(s.op==='system.capabilities'||s.op==='site.capabilities')return {data:{api:Object.keys(reads).concat(writes),unavailable:['plan.delete permanent','user.create','user.update','user.disable','role.*','schedule.recalculate','history.diff'],testStatus:'contract observed; test status varies by operation; see docs/LIVE_TEST_RESULTS.md'},serverVerified:false};
 if(s.op==='system.logs'||s.op==='system.status')return {data:(await store.get('job:'+s.params?.requestId))?.result||{status:'unknown'},serverVerified:false};
 if(s.op==='system.backup.get')return {data:await store.get('snapshot:'+s.params.backupId)||null,serverVerified:false};
 const tab=await tabFor(e);
 if(s.op==='system.health'||s.op==='site.inspect')return {data:await bridge(tab.id,{kind:'inspect'}),serverVerified:false};
 if(s.op.startsWith('theme.')||s.op.startsWith('layout.')){if(e.mode==='validate'||e.mode==='preview')return {data:{operation:s.op,config:s.params,notice:'仅预览配置；锚点在应用时验证'},serverVerified:false};const data=await chrome.tabs.sendMessage(tab.id,{kind:'appearance',op:s.op,params:s.params||{}});if(data?.ok===false)fail(data.code,data.message);return {data,serverVerified:false};}
 if(s.op==='script.execute'){
 if(e.mode==='validate'||e.mode==='preview')return {data:{warning:'脚本不会执行；无法静态证明其效果',rollback:'not_guaranteed'},serverVerified:false};
 if(!chrome.userScripts?.execute)fail('USER_SCRIPTS_DISABLED','请开启扩展详情中的允许用户脚本；Chrome 135–137 需开发者模式');
 const p=s.params||{};if(typeof p.source!=='string'||!['MAIN','USER_SCRIPT'].includes(p.world))fail('INVALID_SCHEMA','需要 source 字符串及 world');
 let timer;try{const out=await Promise.race([chrome.userScripts.execute({target:{tabId:tab.id},world:p.world,js:[{code:p.source}]}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(Error('脚本超时；无法取消已运行脚本，请检查网页状态'),{code:'SCRIPT_TIMEOUT'})),20000);})]);if(out.some(x=>x.error))fail('SCRIPT_RUNTIME_ERROR','脚本执行错误；详情仅留在网页开发者工具');return {data:clean(out),serverVerified:false,rollback:'not_guaranteed'};}catch(err){fail(err.code||'SCRIPT_RUNTIME_ERROR',err.code?err.message:'浏览器拒绝或脚本异常，请检查用户脚本权限和网页控制台');}finally{clearTimeout(timer);}
 }
 const api=new ApiAdapter(async(path,method,body)=>{let tries=method==='POST'?1:(e.execution?.retry?.maxAttempts||1);for(let i=0;i<tries;i++){try{return await request(tab,path,method,body);}catch(err){if(err.code!=='NETWORK_ERROR'||i===tries-1)throw err;await new Promise(r=>setTimeout(r,Math.min(10000,(e.execution?.retry?.backoffMs||500)*2**i)));}}},{saveSnapshot:(id,value)=>store.set('snapshot:'+id,value),loadSnapshot:id=>store.get('snapshot:'+id)});return api.run(s,e);
});
chrome.action.onClicked.addListener(()=>chrome.tabs.create({url:chrome.runtime.getURL('ui.html')}));
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(sender.id!==chrome.runtime.id||sender.url?.split(/[?#]/)[0]!==chrome.runtime.getURL('ui.html'))return;
 (async()=>{if(message.kind==='openSite'){const tabs=await chrome.tabs.query({url:'https://plan.fpgabbs.cn/*'});if(tabs.length)await chrome.tabs.update(tabs[0].id,{active:true});else await chrome.tabs.create({url:'https://plan.fpgabbs.cn/'});return {message:'请在网站完成登录，再点击检查登录状态'};}if(message.kind==='mcpConfig')return nativeInfo?{config:{mcpServers:{xutu:{command:nativeInfo.node,args:[nativeInfo.mcp]}}}}:{message:'先安装Windows宿主并连接本地CLI'};if(message.kind==='native'){connectNative();return {connected:!!nativeInfo,message:nativeInfo?'本地宿主已就绪':'正在连接；可稍后点击复制MCP配置检查'};}if(message.kind==='tabs')return (await chrome.tabs.query({url:'https://plan.fpgabbs.cn/*'})).map(t=>({id:t.id,title:t.title}));if(message.kind==='run')return executor.run(message.cli?parseCLI(message.cli):message.command);fail('INVALID_SCHEMA');})().then(reply,e=>reply({status:'failed',code:e.code||'INTERNAL_ERROR',message:e.message}));return true;
});
let native,nativeInfo;
function connectNative(){if(native)return;try{native=chrome.runtime.connectNative('cn.fpgabbs.xutu');native.onMessage.addListener(m=>{if(m.kind==='ready'){nativeInfo={node:m.node,mcp:m.mcp};return;}executor.run(m.command).then(result=>native?.postMessage({id:m.id,result}),e=>native?.postMessage({id:m.id,result:{status:'failed',code:e.code||'INTERNAL_ERROR'}}));});native.onDisconnect.addListener(()=>{native=null;nativeInfo=null;void chrome.runtime.lastError;});}catch{native=null;nativeInfo=null;}}
chrome.runtime.onStartup.addListener(connectNative);
