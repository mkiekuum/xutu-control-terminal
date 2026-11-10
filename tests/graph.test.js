import test from 'node:test';import assert from 'node:assert/strict';
import {auditGraph,simplifyDummies} from '../extension/graph.js';import {edge} from '../extension/core.js';
import {legacyToNative} from '../extension/converter.js';
const plan=()=>({planNumber:'KEEP-001',nodes:[{id:'A',name:'需求',owner:'TEST'},{id:'B',name:'设计',owner:'TEST'},{id:'C',name:'交付',owner:'TEST'}],edges:[{from:'A',to:'B',upper:'1-2-3',dashed:false},{from:'B',to:'C',upper:'2-3-4',dashed:false},{from:'A',to:'C',upper:'0-0-0',dashed:true}]});
test('A→B→C已建立时，只移除A→C零耗时虚边，编号和真实工作不变',()=>{
 const original=plan(),result=simplifyDummies(original);assert.deepEqual(result.removed,[{from:'A',to:'C'}]);assert.equal(result.plan.planNumber,'KEEP-001');assert.deepEqual(result.plan.nodes,original.nodes);assert.deepEqual(result.plan.edges,original.edges.slice(0,2));assert.equal(original.edges.length,3);
});
test('真实耗时A→C即使有替代路径，也不能自动删除',()=>{
 const p=plan();p.edges[2]={...p.edges[2],upper:'5-5-5',dashed:false};assert.equal(simplifyDummies(p).removed.length,0);assert.equal(auditGraph(p).findings.find(x=>x.code==='TRANSITIVE_EDGE').safeToRemove,false);
});
test('公共起止点所需零耗时边不被误删',()=>{
 const p={nodes:['0','A','B','Z'].map(id=>({id,name:id})),edges:[{from:'0',to:'A',upper:'0-0-0',dashed:true},{from:'0',to:'B',upper:'0-0-0',dashed:true},{from:'A',to:'Z',upper:'0-0-0',dashed:true},{from:'B',to:'Z',upper:'0-0-0',dashed:true}]};assert.equal(simplifyDummies(p).removed.length,0);
});
test('长任务建议和同负责人串行合并提示不改用时或编号，交付节点保留',()=>{
 const p=plan();p.edges.pop();p.edges[0].upper='15-16-17';const before=structuredClone(p),a=auditGraph(p);assert(a.findings.some(x=>x.code==='LONG_TASK'));assert(a.findings.some(x=>x.code==='MERGE_CANDIDATE'));assert.deepEqual(p,before);p.nodes[1].name='设计评审';assert(!auditGraph(p).findings.some(x=>x.code==='MERGE_CANDIDATE'));
});
test('新增虚任务不得隐含非零耗时，必须明确三个0',()=>{
 assert.throws(()=>edge({fromNodeId:'A',toNodeId:'B',dashed:true,estimateDays:{minimum:1,likely:1,maximum:1}}));
 assert.equal(edge({fromNodeId:'A',toNodeId:'B',dashed:true,estimateDays:{minimum:0,likely:0,maximum:0}}).upper,'0-0-0');
});
test('旧任务导入A→B→C时去除显式重复A→C依赖',()=>{
 const r=legacyToNative({title:'SYNTHETIC',number:'KEEP',unit:'day',workers:[],tasks:[{id:'a',name:'A',duration:1},{id:'b',name:'B',duration:1,dependsOn:['a']},{id:'c',name:'C',duration:1,dependsOn:['a','b']}]});
 assert(r.removedRedundantDependencies.some(e=>e.from==='aE'&&e.to==='cS'));assert(!r.plan.edges.some(e=>e.fromNodeId==='aE'&&e.toNodeId==='cS'));assert.equal(r.plan.number,'KEEP');
});
