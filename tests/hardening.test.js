import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {Executor,nativePlan,validatePlan} from '../extension/core.js';
import {ApiAdapter} from '../extension/api.js';
import {validateStep,parameterSchemas} from '../extension/validation.js';
const envelope=(steps,extra={})=>({protocol:'xutu.command/v1',requestId:'hardening',steps,...extra});
const memory=()=>{const m=new Map();return {get:async k=>m.get(k),set:async(k,v)=>m.set(k,v)};};
test('写入参数拼写错误在任何网络调用前拒绝，validate模式也执行参数校验',async()=>{
 let calls=0;const api=new ApiAdapter(async()=>{calls++;});
 await assert.rejects(api.run({op:'plan.update',params:{set:{titel:'bad'}}},envelope([],{mode:'validate'})),{code:'INVALID_SCHEMA'});assert.equal(calls,0);
});
test('参数契约拒绝错误类型和原型字段',()=>{assert.throws(()=>validateStep({op:'edge.update',params:{fromNodeId:'1',toNodeId:'2',dashed:'false'}}));assert.throws(()=>validateStep({op:'plan.update',params:JSON.parse('{"set":{"__proto__":{}}}')}));assert(Object.keys(parameterSchemas).length>=40);});
test('旧站单值用时合法且不被重新格式化；空值拒绝',()=>{
 const p=nativePlan({title:'T',number:'N',nodes:[{id:'1',name:'A'},{id:'2',name:'B'}]},'TEST');
 p.edges=[{from:'1',to:'2',upper:'2.000',lower:''}];validatePlan(p);assert.equal(p.edges[0].upper,'2.000');p.edges[0].upper='';assert.throws(()=>validatePlan(p));
});
test('已执行作业仍允许同ID只读预览',async()=>{
 const ex=new Executor(memory(),async(s,e)=>({data:e.mode||'execute'})),e=envelope([{id:'a',op:'system.version'}]);await ex.run(e);const result=await ex.run({...e,mode:'preview'});assert.equal(result.steps[0].data,'preview');
});
test('可选备份先存储；可恢复原内容并保留最新版本控制',async()=>{
 const snapshots=new Map();let record={id:'T',revision:1,current:nativePlan({title:'OLD',number:'N'},'TEST')};let storedBeforePost=false;
 const api=new ApiAdapter(async(p,m,b)=>{if(p==='/api/session')return {actor:'TEST',role:'user'};if(m==='POST'){storedBeforePost=snapshots.size>0;assert.equal(b.baseRevision,record.revision);record={...record,revision:record.revision+1,current:b.current};}return structuredClone(record);},{saveSnapshot:async(id,v)=>snapshots.set(id,structuredClone(v)),loadSnapshot:async id=>snapshots.get(id)});
 const first=await api.run({id:'a',op:'plan.update',target:{id:'T'},params:{set:{title:'NEW'}}},envelope([],{execution:{backup:true}}));assert(storedBeforePost);assert.equal(first.backupId,'hardening:a');assert.equal(record.current.title,'NEW');
 const restored=await api.run({id:'b',op:'plan.restoreSnapshot',target:{id:'T'},params:{backupId:first.backupId}},envelope([]));assert.equal(restored.serverVerified,true);assert.equal(record.current.title,'OLD');assert.equal(record.revision,3);
});
test('备份存储失败阻止写入',async()=>{
 let writes=0;const api=new ApiAdapter(async(p,m)=>{if(m==='POST')writes++;return p==='/api/session'?{actor:'TEST'}:{id:'T',revision:1,current:nativePlan({title:'T',number:'N'},'TEST')};},{saveSnapshot:async()=>{throw Error('QUOTA');}});
 await assert.rejects(api.run({id:'a',op:'plan.update',target:{id:'T'},params:{set:{title:'N'}}},envelope([],{execution:{backup:true}})),/QUOTA/);assert.equal(writes,0);
});
test('项目分配必须回读计划对应项目字段，不以POST成功判定',async()=>{
 let assigned=false;const api=new ApiAdapter(async(p,m)=>{if(p==='/api/session')return {actor:'TEST'};if(m==='POST')return {};if(p==='/api/plans')return [{id:'P',projectGroupId:assigned?'G':'OTHER'}];return [];});
 const step={id:'a',op:'project.assignPlan',params:{planId:'P',groupId:'G'}};
 await assert.rejects(api.run(step,envelope([])),{code:'SERVER_NOT_CONFIRMED'});
 assigned=true;assert.equal((await api.run(step,envelope([]))).serverVerified,true);
});
