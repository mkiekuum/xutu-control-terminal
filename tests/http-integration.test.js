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
test('本地HTTP契约集成：并发409后独立回读且不覆盖远端字段',async()=>{
 const server=await contractServer();let edited=false;try{const api=new ApiAdapter(client(server,'TEST_OWNER',(path,method)=>{if(method==='POST'&&!edited){edited=true;server.remoteEdit({deadline:'2026-11-20'});}}));await assert.rejects(api.run(step,{...job,execution:{onConflict:'overwrite-if-authorized'}}),error=>{assert.equal(error.code,'VERSION_CONFLICT');assert.equal(error.diagnostic.latest.current.deadline,'2026-11-20');assert.equal(error.diagnostic.latestVersion,2);assert.equal(error.outcome,'not_executed');return true;});assert.equal(server.events.length,0);assert.equal(server.getRecord().current.title,'SYNTHETIC');}finally{await server.close();}
});

test('本地HTTP契约集成：批量改名与重编号经import一次提交，完整回读布局和引用',async()=>{
 const server=await contractServer();try{
 server.remoteEdit({nodes:[{id:'10',name:'开始',content:'型号10',owner:'TEST_OWNER'},{id:'20',name:'成果',content:'[[node:10]]',owner:'TEST_OWNER'}],edges:[{from:'10',to:'20',upper:'1-1-1',dashed:false,executor:'TEST_OWNER',completedAt:''}],positions:{10:{x:10,y:20},20:{x:30,y:40}}});
 const api=new ApiAdapter(client(server));let r=await api.run({id:'batch',op:'node.batchUpdate',target:{id:'SYNTHETIC_PLAN',version:2},params:{updates:[{id:'20',set:{name:'验收完成'}}]}},{...job,requestId:'http-batch'});assert.equal(r.afterVersion,3);
 r=await api.run({id:'renumber',op:'node.renumber',target:{id:'SYNTHETIC_PLAN',version:r.afterVersion},params:{mapping:[{from:'10',to:'1'},{from:'20',to:'2'}]}},{...job,requestId:'http-renumber'});assert.equal(server.events.length,2);assert(server.events.every(e=>e.path.endsWith('/import')));assert.deepEqual(r.data.current.positions,{1:{x:10,y:20},2:{x:30,y:40}});assert.equal(r.data.current.nodes[0].content,'型号10');assert.equal(r.data.current.nodes[1].content,'[[node:1]]');assert.equal(r.data.current.nodes[1].name,'验收完成');
 }finally{await server.close();}
});
