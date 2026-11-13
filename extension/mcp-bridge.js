import {McpGate} from './mcp-policy.js';
export function relayUrl(value){const u=new URL(value);if(u.username||u.password||u.search||u.hash||u.pathname!=='/'||!(u.protocol==='http:'&&u.hostname==='127.0.0.1'))throw Error('仅使用 http://127.0.0.1 的本机服务根地址；跨电脑通过私有隧道');return u.origin;}
export function startMcpBridge({run,identity,storage,fetcher=fetch}){
 let activeConfig;const gate=new McpGate(c=>run(c,activeConfig),()=>identity(activeConfig),()=>Date.now(),{get:async id=>(await storage.get("mcpPreviews")).mcpPreviews?.[id],save:async(id,value)=>{const old=(await storage.get("mcpPreviews")).mcpPreviews||{};const entries=Object.entries(old).filter(([,v])=>v.expires>Date.now()).slice(-49);await storage.set({mcpPreviews:{...Object.fromEntries(entries),[id]:value}});},remove:async id=>{const old=(await storage.get("mcpPreviews")).mcpPreviews||{};delete old[id];await storage.set({mcpPreviews:old});}});let running=false;
 async function tick(){if(running)return;running=true;try{
  const {mcpConnection:c}=await storage.get('mcpConnection');if(!c?.enabled)return;activeConfig=c;const base=relayUrl(c.url),headers={'X-Xutu-Bridge-Id':c.bridgeId,Authorization:'Bearer '+c.token,'Content-Type':'application/json'};
  const r=await fetcher(base+'/bridge/next',{headers,signal:AbortSignal.timeout(15000),redirect:'error'});if(!r.ok)throw Error('连接失败 HTTP '+r.status);const job=await r.json();await storage.set({mcpBridgeStatus:{state:'connected',at:Date.now()}});if(!job)return;
  // The server never redelivers dispatched jobs. A worker crash remains unknown, not a retry.
  let result;try{const current=(await storage.get('mcpConnection')).mcpConnection;if(JSON.stringify(current)!==JSON.stringify(c))throw Error('连接设置已变化，未执行');result=await gate.handle(job);}catch(e){result={status:'failed',message:e.message};}
  const posted=await fetcher(base+'/bridge/result',{method:'POST',headers,body:JSON.stringify({id:job.id,result}),signal:AbortSignal.timeout(15000),redirect:'error'});if(!posted.ok)throw Error('结果尚未确认，请查询原请求');
  await storage.set({mcpBridgeStatus:{state:'connected',at:Date.now()}});
 }catch(e){await storage.set({mcpBridgeStatus:{state:'error',message:e.message,at:Date.now()}});}finally{running=false;}}
 return {tick,async reset(){gate.previews.clear();await storage.remove("mcpPreviews");}};
}
