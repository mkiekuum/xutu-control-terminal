import test from 'node:test';import assert from 'node:assert/strict';
import {mergeTasks,splitTask,sumDecimal} from '../extension/task-transform.js';
import {ApiAdapter} from '../extension/api.js';
const plan=()=>({version:2,title:'合成测试',planNumber:'TEST-MERGE',planOwner:'OWNER',start:'',deadline:'',baseline:null,nodes:['1','2','3','4'].map(id=>({id,name:'阶段'+id,owner:'OWNER',content:'内容'+id})),edges:[{from:'1',to:'2',upper:'0.1-0.2-0.3',executor:'OWNER',dashed:false,completedAt:''},{from:'2',to:'3',upper:'0.2-0.3-0.4',executor:'OWNER',dashed:false,completedAt:''},{from:'3',to:'4',upper:'1-2-3',executor:'OWNER',dashed:false,completedAt:''}],positions:{'2':{x:20,y:30}}});
test('合并任务保留首尾及其他节点ID，精确加和估时，保留内容和后继',()=>{
 const p=plan(),before=structuredClone(p),r=mergeTasks(p,{nodeIds:['1','2','3'],name:'综合设计'});
 assert.equal(r.plan.edges.at(-1).upper,'0.3-0.5-0.7');assert.deepEqual(r.plan.nodes.map(n=>n.id),['1','3','4']);assert.equal(r.plan.planNumber,p.planNumber);assert.equal(r.plan.nodes[1].content,'阶段2：内容2\n阶段3：内容3');assert.equal(r.plan.edges[0].to,'4');assert(!r.plan.positions['2']);assert.deepEqual(p,before);
});
test('合并拒绝分支、已有直连、不同负责人、完成进度和基线，里程碑须显式授权',()=>{
 for(const mutate of [p=>p.edges.push({from:'2',to:'4',upper:'0',dashed:true}),p=>p.edges.push({from:'1',to:'3',upper:'0',dashed:true}),p=>p.nodes[1].owner='OTHER',p=>p.edges[0].completedAt='2026-11-10',p=>p.baseline={approved:true},p=>p.nodes[1].name='设计评审']){const p=plan();mutate(p);assert.throws(()=>mergeTasks(p,{nodeIds:['1','2','3'],name:'综合设计'}));}
 const p=plan();p.nodes[1].name='评审';assert(mergeTasks(p,{nodeIds:['1','2','3'],name:'综合设计',allowMilestones:true}));
});
test('拆分需要明确成果和各段估时，默认守恒，首尾和后继不变',()=>{
 const p=plan(),params={fromNodeId:'3',toNodeId:'4',nodes:[{id:'NEW',name:'可验收设计'}],segments:[{estimateDays:{minimum:0.5,likely:1,maximum:1.5}},{estimateDays:{minimum:0.5,likely:1,maximum:1.5}}]},r=splitTask(p,params);
 assert.deepEqual(r.plan.nodes.map(n=>n.id),['1','2','3','NEW','4']);assert.equal(r.changes.afterEstimate,'1-2-3');assert.equal(r.plan.edges.at(-1).to,'4');params.segments[0].estimateDays.maximum=2;assert.throws(()=>splitTask(p,params));assert(splitTask(p,{...params,allowDurationChange:true}));
});
test('十进制加法保留零、整数末尾零和极小数',()=>{assert.equal(sumDecimal(['0','0.0']),'0');assert.equal(sumDecimal(['10','20']),'30');assert.equal(sumDecimal(['0.000000001','0.000000002']),'0.000000003');});
test('合并实际走API版本控制与写入回读，预览不写入',async()=>{
 let record={id:'TEST',revision:1,current:plan()},posts=0;
 const api=new ApiAdapter(async(path,method,body)=>{if(path==='/api/session')return {actor:'OWNER',role:'user'};if(method==='POST'){posts++;assert.equal(body.baseRevision,record.revision);record={...record,revision:record.revision+1,current:structuredClone(body.current)};}return structuredClone(record);});
 const s={id:'merge',op:'task.merge',target:{id:'TEST'},params:{nodeIds:['1','2','3'],name:'综合设计'}};
 await api.run(s,{requestId:'test',mode:'preview'});assert.equal(posts,0);const r=await api.run(s,{requestId:'test',mode:'execute'});assert.equal(r.serverVerified,true);assert.equal(posts,1);assert.equal(record.current.nodes.length,3);
});
