import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreOutcomeNetwork} from '../extension/outcome-network.js';
import {auditGraph} from '../extension/graph.js';
import {buildPrompt} from '../extension/terminal.js';

// Synthetic work data only; dependency fixture reproduces the reported topology.
const dependencies={'1':[],'2':[],'3':[],'4':['1','3'],'5':['4'],'6':['4'],'7':['1','2','3'],'8':['5','7'],'9':['1'],'10':['6','8'],'11':['9','10'],'12':['11'],'13':['12'],'14':['13'],'15':['14'],'16':['15']};
function fixture(){
 const ids=['0',...Object.keys(dependencies)];
 const original={version:2,title:'Synthetic',planNumber:'SYNTHETIC',planOwner:'USER_A',start:'2026-11-01',deadline:'2027-12-31',baseline:{date:'2026-11-01'},positions:{'1':{x:20,y:30}},nodes:ids.map(id=>({id,name:'成果'+id,owner:'USER_A',content:'原正文 [[node:1]]，型号 A12'})),edges:ids.slice(1).map((id,i)=>({from:ids[i],to:id,upper:i===0?'1440':`${i+1}-${i+2}-${i+3}`,lower:'原工作说明'+id,executor:'USER_A',dashed:false,completedAt:i===0?'2026-11-02':''}))};
 const options={dependencies:structuredClone(dependencies),workEdges:Object.fromEntries(original.edges.map(e=>[e.to,{from:e.from,to:e.to}])),startId:'0'};
 return {original,options};
}
function ancestors(id,parents){const found=new Set();function visit(n){for(const p of parents(n)){if(!found.has(p)){found.add(p);visit(p);}}}visit(id);return [...found].sort();}
test('成果网络的真实连线与全部前置闭包一致，不依赖正文说明',()=>{
 const {original,options}=fixture(),{plan}=restoreOutcomeNetwork(original,options);
 for(const id of Object.keys(dependencies)){
  const actual=ancestors(id,n=>plan.edges.filter(e=>e.to===n).map(e=>e.from)).filter(n=>Object.hasOwn(dependencies,n));
  assert.deepEqual(actual,ancestors(id,n=>dependencies[n]),id);
 }
 assert.equal(plan.edges.filter(e=>e.from==='0').length,3);
 assert.equal(plan.edges.filter(e=>e.from==='4'&&!e.dashed).length,2);
});
test('仅改边端点和增加汇合节点，原节点、引用、日期、位置和工期逐字保留',()=>{
 const {original,options}=fixture(),before=structuredClone(original),{plan,auxiliary}=restoreOutcomeNetwork(original,options);
 assert.deepEqual(original,before);
 assert.deepEqual(plan.nodes.slice(0,original.nodes.length),original.nodes);
 for(const key of Object.keys(original).filter(k=>!['nodes','edges'].includes(k)))assert.deepEqual(plan[key],original[key],key);
 assert.equal(auxiliary.length,5);
 for(const work of original.edges){const repaired=plan.edges.filter(e=>!e.dashed&&e.to===work.to);assert.equal(repaired.length,1);assert.deepEqual({...repaired[0],from:work.from},work);}
 assert.equal(plan.edges.find(e=>e.to==='1').upper,'1440');
});
test('每项实际工作只计一次，虚线全零、无环且无冗余虚线',()=>{
 const {original,options}=fixture(),{plan}=restoreOutcomeNetwork(original,options);
 assert.equal(plan.edges.filter(e=>!e.dashed).length,16);
 assert(plan.edges.filter(e=>e.dashed).every(e=>e.upper==='0-0-0'));
 assert(!auditGraph(plan).findings.some(f=>f.code==='TRANSITIVE_EDGE'&&f.safeToRemove));
 for(const n of plan.nodes)assert(!ancestors(n.id,id=>plan.edges.filter(e=>e.to===id).map(e=>e.from)).includes(n.id));
});
test('同一执行人不机械串行，资源说明不把关键路径当单人完成时间',()=>{
 const {original,options}=fixture(),single=restoreOutcomeNetwork(original,options);
 original.edges.forEach((e,i)=>e.executor='USER_'+i);
 const multi=restoreOutcomeNetwork(original,options);
 assert.deepEqual(single.plan.edges.map(({from,to,dashed})=>({from,to,dashed})),multi.plan.edges.map(({from,to,dashed})=>({from,to,dashed})));
 assert.match(single.resourceNote,/不是单人实际完成时间/);
});
test('拒绝循环、冗余前置和重复工作映射，不猜工期归属',()=>{
 for(const mutate of [o=>o.dependencies['1']=['16'],o=>o.dependencies['5']=['4','1'],o=>o.workEdges['2']=o.workEdges['1'],o=>delete o.workEdges['3']]){
  const {original,options}=fixture();mutate(options);assert.throws(()=>restoreOutcomeNetwork(original,options));
 }
});
test('无法解释的旧辅助节点或额外真实工作必须核实，不能静默删除',()=>{
 const {original,options}=fixture();original.nodes.push({id:'OLD',name:'旧辅助'});assert.throws(()=>restoreOutcomeNetwork(original,options),/旧辅助/);
 original.nodes.pop();original.edges.push({from:'0',to:'2',upper:'10',dashed:false});assert.throws(()=>restoreOutcomeNetwork(original,options),/未映射实际工作/);
});
test('实际复制给外部AI的提示词明确区分资源、业务依赖与估时',()=>{
 const prompt=buildPrompt('修复业务网络',{},1);
 for(const text of ['不能因为执行人相同','绝不能代替真实连线','每项实际工作的原估时只计一次','不静默换算单位','关键路径工期不能宣称为单人实际完成时间'])assert(prompt.includes(text),text);
});
