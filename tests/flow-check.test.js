import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectFlow,flowFeedback} from '../extension/flow-check.js';
import {buildPrompt,summarize,prepareCommand} from '../extension/terminal.js';
import {validateStep,parameterSchemas} from '../extension/validation.js';
import {site,integrated,envelope} from './v25-helpers.js';
import {ApiAdapter} from '../extension/api.js';
import {flowRules} from '../extension/ai-brief.js';
import {promptContracts} from '../extension/prompt-context.js';
import Ajv from 'ajv';

const estimate=n=>({minimum:n,likely:n,maximum:n});
const edge=(from,to,n=0)=>({from,to,upper:`${n}-${n}-${n}`,lower:'',dashed:n===0,executor:'',completedAt:''});
const work=(from,to,n)=>({id:'work-'+to,fromNodeId:from,toNodeId:to,estimateDays:estimate(n)});
const reference=()=>({nodes:[{id:'S',name:'Start',kind:'event'},{id:'A',name:'Outcome A',content:'Approved text',kind:'outcome'}],dependencies:[{from:'S',to:'A'}],works:[work('S','A',3)]});
const plan=r=>({nodes:r.nodes.map(({kind,...n})=>({...n,content:n.content||''})),edges:r.dependencies.map(e=>edge(e.from,e.to)),start:'',deadline:''});
const fixture=()=>{const r=reference(),p=plan(r);p.edges[0]=edge('S','A',3);return {r,p};};
// Sanitized topology from the confirmed drawing; business text and account data are not published.
const ids=['1','2','8','9','10','11','12','15','16','17','18','22','21','20','23','24','25'];
const arrows=[[1,2],[2,8],[8,9],[9,23],[1,10],[10,11],[11,12],[12,15],[15,23],[1,16],[16,17],[17,18],[18,21],[1,22],[22,21],[21,20],[20,23],[23,24],[24,25]];
const confirmed=()=>({nodes:ids.map(id=>({id,name:'Confirmed '+id,kind:['2','10','16'].includes(id)?'category':id==='1'?'event':'outcome'})),dependencies:arrows.map(([a,b])=>({from:String(a),to:String(b)}))});

test('17 nodes/19 direct arrows preserved; missing work evidence is never a calculation pass',()=>{
 const r=confirmed(),p=plan(r),before=structuredClone(p),report=inspectFlow(r,p);
 assert.equal(report.drawing,'pass');assert.equal(report.dependencies,'unverified');assert.equal(report.duration,'unverified');assert.equal(report.canSubmit,false);assert.deepEqual(p,before);
 assert.deepEqual(r.nodes.filter(n=>n.kind==='category').map(n=>n.id),['2','10','16']);
});
test('reject extra 26–29, renamed helper and removed original category without mutating graph',()=>{
 for(const id of ['26','27','28','29']){const r=confirmed(),p=plan(r);p.nodes.push({id,name:'Not called a helper'});const report=inspectFlow(r,p);assert.deepEqual(report.diff.addedNodes,[id]);assert.equal(report.canSubmit,false);}
 const r=confirmed(),p=plan(r);p.nodes=p.nodes.filter(n=>n.id!=='10');p.edges=p.edges.filter(e=>e.from!=='10'&&e.to!=='10');assert.deepEqual(inspectFlow(r,p).diff.removedNodes,['10']);
});
test('reject serializing independent branches and rerouting separate inputs to an earlier outcome',()=>{
 for(const [from,to]of [['22','16'],['18','22'],['9','20'],['15','20']]){
  const r=confirmed(),p=plan(r);p.edges.push(edge(from,to));const report=inspectFlow(r,p);assert.equal(report.drawing,'fail');assert(report.diff.addedArrows.some(e=>e[0]===from&&e[1]===to));assert(report.diff.predecessors.length);
 }
 const r=confirmed(),p=plan(r);p.edges=p.edges.filter(e=>!(e.from==='22'&&e.to==='21'));p.edges.push(edge('22','20'));const d=inspectFlow(r,p).diff;assert.deepEqual(d.removedArrows,[['22','21']]);assert.deepEqual(d.addedArrows,[['22','20']]);
});
test('counts and reachability do not hide changes to direct arrows or approved wording',()=>{
 const r=confirmed(),p=plan(r);p.edges=p.edges.filter(e=>!(e.from==='21'&&e.to==='20'));p.edges.push(edge('21','23'));p.nodes.find(n=>n.id==='20').name='Unapproved expanded title';
 const d=inspectFlow(r,p).diff;assert.equal(d.addedArrows.length,1);assert.equal(d.removedArrows.length,1);assert.equal(d.names.length,1);
 const {r:r2,p:p2}=fixture();p2.nodes[1].content='Added technical prose';assert.equal(inspectFlow(r2,p2).diff.contents.length,1);
});
test('single predecessor and single counted work pass; business authenticity remains outside scope',()=>{
 const {r,p}=fixture(),report=inspectFlow(r,p);assert(report.canSubmit);assert.equal(report.dependencies,'pass');assert.equal(report.duration,'pass');assert.equal(report.business,'not_independently_verified');
});
test('finish-only merge is not start dependency even when graph matches and estimates unchanged',()=>{
 const r={nodes:[{id:'S',name:'S',kind:'event'},...['A','B','C'].map(id=>({id,name:id,kind:'outcome'}))],dependencies:[{from:'S',to:'A'},{from:'S',to:'B'},{from:'A',to:'C'},{from:'B',to:'C'}],works:[work('S','A',2),work('S','B',10),work('A','C',3)]};
 const p=plan(r);p.edges=[edge('S','A',2),edge('S','B',10),edge('A','C',3),edge('B','C')];const report=inspectFlow(r,p);
 assert.equal(report.drawing,'pass');assert.equal(report.duration,'pass');assert.equal(report.dependencies,'fail');assert.equal(report.canSubmit,false);assert.match(report.workChecks[2].errors.join(' '),/未约束工作开始：B/);
 p.edges[3]=edge('B','C',3);assert(inspectFlow(r,p).issues.some(i=>i.code==='UNMAPPED_WORK'));
 r.works.push({...work('B','C',3),id:'second-name-for-same-work'});assert(inspectFlow(r,p).workChecks.some(w=>w.errors.some(e=>e.includes('重复映射'))));
});
test('arbitrary duration split does not pass merely because total is unchanged',()=>{
 const r={nodes:[{id:'S',name:'S',kind:'event'},...['A','B'].map(id=>({id,name:id,kind:'outcome'}))],dependencies:[{from:'S',to:'A'},{from:'A',to:'B'}],works:[work('S','A',2),work('A','B',4)]};const p=plan(r);p.edges=[edge('S','A',3),edge('A','B',3)];const report=inspectFlow(r,p);assert.equal(report.duration,'fail');assert.equal(report.diff.estimates.length,2);
});
test('category nodes remain zero-time events; unlisted work cannot masquerade as category work',()=>{
 const r={nodes:[{id:'S',name:'S',kind:'event'},{id:'K',name:'Approved category',kind:'category'},{id:'A',name:'A',kind:'outcome'}],dependencies:[{from:'S',to:'K'},{from:'K',to:'A'}],works:[work('K','A',3)]};const p=plan(r);p.edges[1]=edge('K','A',3);assert(inspectFlow(r,p).canSubmit);
 p.edges[0]=edge('S','K',1);assert(!inspectFlow(r,p).canSubmit);r.works.push(work('S','K',1));assert(inspectFlow(r,p).workChecks.some(w=>w.errors.some(e=>e.includes('分类'))));
});
test('final batch guard prevents all writes; structured diff survives executor and readable UI',async()=>{
 const web=site();web.add('T');const original=structuredClone(web.records.get('T'));const r={nodes:original.current.nodes.map((n,i)=>({...n,kind:i?'outcome':'event'})).map(({owner,...n})=>n),dependencies:[{from:'1',to:'2'}],works:[{id:'w',fromNodeId:'1',toNodeId:'2',estimateDays:{minimum:1,likely:2,maximum:3}}]};
 const step={id:'edit',op:'plan.batch',target:{id:'T',version:1},params:{flowCheck:r,changes:[{op:'node.update',params:{id:'1',set:{name:'Wrong'}}}]}};
 const result=await integrated(web).executor.run(envelope([step]));assert.equal(result.steps[0].code,'FLOW_CHECK_FAILED');assert.equal(result.steps[0].outcome,'not_executed');assert.equal(web.calls.filter(c=>c.method==='POST').length,0);assert.deepEqual(web.records.get('T'),original);assert.match(summarize(result),/未保存/);assert.match(flowFeedback(result),/不一致/);assert.equal(result.steps[0].flowCheck.diff.names.length,1);
});
test('approved name change uses latest version, one POST, preserved dates/status/layout and request replay',async()=>{
 const web=site();web.add('T');const original=structuredClone(web.records.get('T'));original.current.start='2026-11-13';web.records.get('T').current.start=original.current.start;
 const r={nodes:original.current.nodes.map((n,i)=>({id:n.id,name:i?n.name:'Approved',content:n.content||'',kind:i?'outcome':'event'})),dependencies:[{from:'1',to:'2'}],works:[{id:'w',fromNodeId:'1',toNodeId:'2',estimateDays:{minimum:1,likely:2,maximum:3}}]};
 const c=envelope([{id:'edit',op:'plan.batch',target:{id:'T',version:1},params:{flowCheck:r,changes:[{op:'node.update',params:{id:'1',set:{name:'Approved'}}}]}}]),run=integrated(web);const result=await run.executor.run(c);assert.equal(result.status,'success');assert.equal(result.steps[0].flowCheck.drawing,'pass');assert.equal(result.steps[0].serverVerified,true);assert.deepEqual(await run.executor.run(c),result);assert.equal(web.calls.filter(c=>c.method==='POST').length,1);original.current.nodes[0].name='Approved';assert.deepEqual(web.records.get('T').current,original.current);assert.deepEqual(web.records.get('T').review,original.review);assert(!JSON.stringify(web.calls.find(c=>c.method==='POST').body).includes('flowCheck'));
});
test('create supports guard, previews mismatch without writing and legacy commands remain usable',async()=>{
 const web=site(),{r}=fixture(),params={title:'Synthetic',number:'FLOW',nodes:r.nodes.map(({kind,...n})=>n),edges:[{fromNodeId:'S',toNodeId:'A',estimateDays:estimate(3)}],flowCheck:r},api=new ApiAdapter(web.request);
 const step={id:'new',op:'plan.create',params};const good=await api.run(step,envelope([]));assert(good.serverVerified);assert(good.flowCheck.canSubmit);
 params.nodes[1].name='Wrong';const preview=await api.run(step,{...envelope([]),mode:'preview'});assert.equal(preview.data.flowCheck.canSubmit,false);assert.equal(web.calls.filter(c=>c.method==='POST').length,1);
 await assert.rejects(api.run(step,envelope([])),{code:'FLOW_CHECK_FAILED'});delete params.flowCheck;params.number='LEGACY';assert((await api.run(step,envelope([]))).serverVerified);
});
test('source graph must be valid and runtime/schema/prompt agree on optional flow contract',()=>{
 const {r,p}=fixture();r.dependencies.push({from:'A',to:'S'});assert.throws(()=>inspectFlow(r,p));
 const {r:valid}=fixture(),step={id:'b',op:'plan.batch',target:{id:'T',version:1},params:{flowCheck:valid,changes:[{op:'node.update',params:{id:'A',set:{name:'Outcome A'}}}]}};
 validateStep(step);const ajv=new Ajv({strict:false}),contracts=promptContracts(),check=ajv.compile({...contracts,'$ref':'#/plan.batch'});assert(check(step.params));assert(parameterSchemas['plan.create'].properties.flowCheck);step.params.flowCheck.autoAddNodes=true;assert.throws(()=>validateStep(step));assert.equal(check(step.params),false);
});
test('prompt targets scope, import versus calculation, confirmed text, no forced helpers or fixed questions',()=>{
 const prompt=buildPrompt('只改名称，不新增节点，不用编制',null,1,{intent:'manage'});
 for(const text of ['拆分原工期','格式合法、图形一致、依赖正确、工期正确','禁止新增时不新增','不把三路输入','分类节点','一次列明冲突','params.flowCheck'])assert(flowRules.includes(text)||prompt.includes(text),text);
 assert(!prompt.includes('多前置先用必要的零耗时虚线汇合'));assert(prompt.includes('不规定题数'));assert(prompt.includes('用户已排除的用词'));assert(prompt.includes('不能为通过检查把 flowCheck 反向改成错误候选图'));
});

test('JSON preview/validate survive UI parsing and cannot save, including destructive operations',async()=>{
 for(const mode of ['preview','validate']){
  const web=site();web.add('T');const c=prepareCommand(JSON.stringify(envelope([{id:'d',op:'plan.delete',target:{id:'T',version:1},params:{}}],{mode})),1,'ignored');
  assert.equal(c.mode,mode);await integrated(web).executor.run(c);assert.equal(web.calls.filter(c=>c.method==='POST').length,0);assert(web.records.has('T'));
 }
});

test('flow guard never refreshes stale basis or conceals readback failure',async()=>{
 const web=site();web.add('T');const record=web.records.get('T'),r={nodes:record.current.nodes.map((n,i)=>({id:n.id,name:n.name,kind:i?'outcome':'event'})),dependencies:[{from:'1',to:'2'}],works:[{id:'w',fromNodeId:'1',toNodeId:'2',estimateDays:{minimum:1,likely:2,maximum:3}}]},step={id:'b',op:'plan.batch',target:{id:'T',version:1},params:{flowCheck:r,changes:[{op:'plan.update',params:{set:{title:'Changed'}}}]}};
 record.revision=2;record.current.deadline='2026-12-20';const result=await integrated(web).executor.run(envelope([step]));assert.equal(result.steps[0].code,'VERSION_CONFLICT');assert.equal(result.steps[0].diagnostic.latest.current.deadline,'2026-12-20');assert.equal(web.calls.filter(c=>c.method==='POST').length,0);
 step.target.version=2;let submitted=false;const api=new ApiAdapter(async(...args)=>{const result=await web.request(...args);if(args[1]==='POST')submitted=true;else if(submitted&&args[0]==='/api/plans/T')result.current.title='Different server value';return result;});
 await assert.rejects(api.run(step,envelope([])),error=>error.code==='SERVER_NOT_CONFIRMED'&&error.outcome==='unconfirmed');assert.equal(web.calls.filter(c=>c.method==='POST').length,1);
});
