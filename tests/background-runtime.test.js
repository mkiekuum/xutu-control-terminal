import test from 'node:test';import assert from 'node:assert/strict';
test('后台CLI测试只使用传入网页，逐次ping/查询；JSON脚本授权与执行保持兼容',async()=>{
 const id='a'.repeat(32),base='chrome-extension://'+id+'/',store={};let listener,port,phase='missing',connects=0,pings=0,queries=0,scripts=0;
 globalThis.confirm=()=>{throw Error('不允许新增确认弹窗');};
 globalThis.chrome={runtime:{id,getURL:name=>base+name,onMessage:{addListener:f=>listener=f},onStartup:{addListener(){}},onInstalled:{addListener(){}},connectNative:()=>{
  connects++;let onMessage,onDisconnect;port={onMessage:{addListener:f=>onMessage=f},onDisconnect:{addListener:f=>onDisconnect=f},disconnect:()=>onDisconnect(),postMessage:m=>{
   assert.equal(m.kind,'diagnostic');if(m.action==='ping')pings++;else{queries++;assert.equal(m.action,'query');assert.equal(m.tabId,123);}
   queueMicrotask(()=>onMessage({kind:'diagnostic-result',id:m.id,result:m.action==='ping'?{pong:true}:phase==='pagefail'?{ok:false,code:'NOT_LOGGED_IN'}:{ok:true}}));
  }};
  queueMicrotask(()=>{if(phase==='missing'){chrome.runtime.lastError={message:'Specified native messaging host not found C:/PRIVATE'};onDisconnect();delete chrome.runtime.lastError;}else onMessage({kind:'ready',diagnostics:phase==='old'?0:1});});return port;
 }},tabs:{query:()=>{throw Error('诊断禁止扫描其他标签页');},get:async selected=>{assert.equal(selected,123);if(phase==='closed')throw Error('No tab with id');return {id:selected,url:'https://plan.fpgabbs.cn/'};}},storage:{local:{get:async key=>({[key]:store[key]}),set:async obj=>Object.assign(store,obj)}},userScripts:{execute:async options=>{scripts++;assert.equal(options.target.tabId,123);assert.equal(options.world,'MAIN');assert.equal(options.js[0].code,'document.title');return [{result:'synthetic'}];}}};
 try{
  const {executor}=await import('../extension/background.js');
  const call=m=>new Promise(resolve=>listener(m,{id,url:base+'ui.html'},resolve));
  const missingTarget=await call({kind:'cliTest'});assert.equal(connects,0);assert.equal(missingTarget.stages[0].code,'TARGET_REQUIRED');
  const missing=await call({kind:'cliTest',tabId:123});assert.equal(missing.stages[0].code,'HOST_NOT_FOUND');assert(!JSON.stringify(missing).includes('PRIVATE'));assert.equal(queries,0);
  phase='pagefail';const denied=await call({kind:'cliTest',tabId:123});assert.equal(denied.stages[0].status,'passed');assert.equal(denied.stages[1].code,'NOT_LOGGED_IN');assert.equal(denied.status,'failed');
  phase='pass';const passed=await call({kind:'cliTest',tabId:123});assert.equal(passed.status,'success');assert.equal(pings,2);assert.equal(queries,2);
  phase='closed';const closed=await call({kind:'cliTest',tabId:123});assert.equal(closed.stages[1].code,'TARGET_NOT_FOUND');assert.equal(queries,2);
  port.disconnect();phase='old';const old=await call({kind:'cliTest',tabId:123});assert.equal(old.stages[0].code,'HOST_TOO_OLD');port.disconnect();phase='pass';
  const command={protocol:'xutu.command/v1',requestId:'explicit-script',tabId:123,mode:'execute',steps:[{id:'js',op:'script.execute',params:{source:'document.title',world:'MAIN'}}]};
  const executed=await executor.run(command);assert.equal(executed.status,'success');assert.equal(scripts,1);
  const preview=await executor.run({...command,requestId:'preview-script',mode:'preview'});assert.equal(preview.status,'success');assert.equal(scripts,1);
  delete chrome.userScripts.execute;const blocked=await executor.run({...command,requestId:'disabled-script'});assert.equal(blocked.steps[0].code,'USER_SCRIPTS_DISABLED');assert.equal(scripts,1);
 }finally{delete globalThis.chrome;delete globalThis.confirm;}
});
