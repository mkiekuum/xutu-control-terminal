import test from 'node:test';import assert from 'node:assert/strict';
import {RELEASE_PAGE,REPOSITORY} from '../extension/updates.js';
test('版本检查只接受插件UI消息、并发合并且不接受调用者指定下载地址',async()=>{
 let listener,requests=0;const id='a'.repeat(32),base='chrome-extension://'+id+'/';
 globalThis.chrome={runtime:{id,getURL:file=>base+file,onMessage:{addListener:fn=>listener=fn},onStartup:{addListener(){}},onInstalled:{addListener(){}}}};
 const original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  requests++;assert.equal(url,RELEASE_PAGE);assert.equal(options.credentials,'omit');
  await new Promise(resolve=>setTimeout(resolve,10));
  return {status:200,url:REPOSITORY+'/releases/tag/v2.3.0',body:null};
 };
 try{
  await import('../extension/background.js');
  let replied=false;assert.equal(listener({kind:'updates'},{id,url:'https://plan.fpgabbs.cn/'},()=>{replied=true;}),undefined);assert.equal(replied,false);assert.equal(requests,0);
  const call=()=>new Promise(resolve=>{assert.equal(listener({kind:'updates',url:'https://evil.test'},{id,url:base+'ui.html'},resolve),true);});
  const reports=await Promise.all([call(),call()]);assert.equal(requests,1);assert(reports.every(r=>r.status==='current'));
  const cached=await call();assert.equal(requests,1);assert.equal(cached.cached,true);
 }finally{globalThis.fetch=original;delete globalThis.chrome;}
});
