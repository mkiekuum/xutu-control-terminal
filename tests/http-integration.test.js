import test from 'node:test';import assert from 'node:assert/strict';
import {contractServer} from './fixtures/contract-server.mjs';
import {ApiAdapter} from '../extension/api.js';
import {Executor} from '../extension/core.js';
function client(server,actor='TEST_OWNER',hook=()=>{}){
 return async(path,method='GET',body)=>{await hook(path,method,body);const response=await fetch(server.url+path,{method,headers:{'content-type':'application/json',...(actor?{'x-test-actor':actor}:{})},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw Object.assign(Error('HTTP '+response.status),{code:({401:'NOT_LOGGED_IN',403:'PERMISSION_DENIED',409:'VERSION_CONFLICT'})[response.status]||'SERVER_ERROR'});return data;};
}
const step={id:'update',op:'plan.update',target:{id:'SYNTHETIC_PLAN'},params:{set:{title:'UPDATED'}}};
const job={protocol:'xutu.command/v1',requestId:'http-integration',steps:[step]};
test('本地HTTP契约集成：写入后实际GET回读、同作业重放无重复POST',async()=>{
 const server=await contractServer();try{const api=new ApiAdapter(client(server)),data=new Map(),ex=new Executor({get:async k=>data.get(k),set:async(k,v)=>data.set(k,v)},(s,e)=>api.run(s,e));const first=await ex.run(job),second=await ex.run(job);assert.equal(first.steps[0].serverVerified,true);assert.deepEqual(first,second);assert.equal(server.events.length,1);assert.equal(server.getRecord().current.title,'UPDATED');}finally{await server.close();}
});
test('本地HTTP契约集成：真实401和403映射，不产生写入',async()=>{
 const server=await contractServer();try{await assert.rejects(new ApiAdapter(client(server,null)).run(step,job),{code:'NOT_LOGGED_IN'});await assert.rejects(client(server,'OTHER')('/api/plans/SYNTHETIC_PLAN/change','POST',{baseRevision:1}),{code:'PERMISSION_DENIED'});assert.equal(server.events.length,0);}finally{await server.close();}
});
test('本地HTTP契约集成：并发409后仅覆盖指定字段并保留远端其他字段',async()=>{
 const server=await contractServer();let edited=false;try{const api=new ApiAdapter(client(server,'TEST_OWNER',(path,method)=>{if(method==='POST'&&!edited){edited=true;server.remoteEdit({deadline:'2026-11-20'});}}));const r=await api.run(step,{...job,execution:{onConflict:'overwrite-if-authorized'}});assert.equal(r.serverVerified,true);assert.equal(r.data.current.title,'UPDATED');assert.equal(r.data.current.deadline,'2026-11-20');assert.equal(r.afterVersion,3);}finally{await server.close();}
});
