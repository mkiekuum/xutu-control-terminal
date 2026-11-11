import test from 'node:test';
import assert from 'node:assert/strict';
import {site,integrated,envelope} from './v25-helpers.js';
import {ApiAdapter} from '../extension/api.js';
import {validateStep} from '../extension/validation.js';
import {summarize,buildPrompt} from '../extension/terminal.js';
const batch=(changes,version=1)=>({id:'batch',op:'plan.batch',target:{id:'T',version},params:{changes}});
const rename={op:'node.batchUpdate',params:{updates:[{id:'1',set:{name:'Confirmed'}}]}};
const title={op:'plan.update',params:{set:{title:'Changed'}}};
test('单计划多修改只发一次真实POST并完整回读，其他业务字段保留',async()=>{
 const web=site();web.add('T');const original=structuredClone(web.records.get('T'));const result=await integrated(web).executor.run(envelope([batch([rename,title])]));
 assert.equal(result.status,'success');assert.equal(web.calls.filter(c=>c.method==='POST').length,1);assert.equal(web.records.get('T').revision,2);original.current.nodes[0].name='Confirmed';original.current.title='Changed';assert.deepEqual(web.records.get('T').current,original.current);assert.equal(result.steps[0].serverVerified,true);
});
test('后续子操作校验失败：前面的修改也不提交',async()=>{
 const web=site();web.add('T');const original=structuredClone(web.records.get('T'));const r=await integrated(web).executor.run(envelope([batch([rename,{op:'node.remove',params:{id:'1'}}])]));assert.equal(r.status,'failed');assert.equal(web.calls.filter(c=>c.method==='POST').length,0);assert.deepEqual(web.records.get('T'),original);
});
test('批量禁止嵌套、脚本、审核、额外target和空列表',()=>{
 for(const changes of [[],[{op:'script.execute',params:{source:'x'}}],[{op:'plan.batch',params:{changes:[rename]}}],[{op:'review.submit',params:{}}],[{...rename,target:{id:'OTHER'}}]])assert.throws(()=>validateStep(batch(changes)));
});
test('过期版本独立回读，最新日期人员工期不会被覆盖',async()=>{
 const web=site();web.add('T');web.records.get('T').revision=31;web.records.get('T').current.deadline='2026-11-13';const r=await integrated(web).executor.run(envelope([batch([rename],27)]));assert.equal(r.steps[0].code,'VERSION_CONFLICT');assert.equal(r.steps[0].diagnostic.latestVersion,31);assert.equal(web.calls.filter(c=>c.method==='POST').length,0);assert.match(summarize(r),/本次修改未执行/);
});
test('提交窗口并发冲突不重试、不覆盖；错误不伪称原子事务成功',async()=>{
 const web=site();web.add('T');web.beforePost=()=>{web.records.get('T').revision=2;web.records.get('T').current.deadline='2026-11-13';};const r=await integrated(web).executor.run(envelope([batch([rename,title])]));assert.equal(r.status,'failed');assert.equal(r.steps[0].diagnostic.latest.current.deadline,'2026-11-13');assert.equal(web.calls.filter(c=>c.method==='POST').length,1);assert.notEqual(web.records.get('T').current.title,'Changed');
});
test('重复点击、重放只写一次；不同请求但内容不变不新增版本',async()=>{
 const web=site();web.add('T');const run=integrated(web),command=envelope([batch([rename,title])]);const results=await Promise.all([run.executor.run(command),run.executor.run(command)]);assert.deepEqual(results[0],results[1]);assert.equal(web.calls.filter(c=>c.method==='POST').length,1);const r=await run.executor.run(envelope([batch([rename,title],2)]));assert(r.steps[0].noChange);assert.match(summarize(r),/未增加计划版本/);assert.equal(web.records.get('T').revision,2);
});
test('网站已收下但响应丢失：未知结果独立回读，不重放写入',async()=>{
 const web=site();web.add('T');const request=async(...args)=>{const r=await web.request(...args);if(args[1]==='POST')throw Object.assign(Error('lost response'),{code:'NETWORK_ERROR'});return r;};const api=new ApiAdapter(request);await assert.rejects(api.run(batch([rename,title]),envelope([])),e=>{assert.equal(e.outcome,'unconfirmed');assert.equal(e.diagnostic.latestVersion,2);return true;});assert.equal(web.calls.filter(c=>c.method==='POST').length,1);
});
test('预览与格式验证无POST；状态阶段来自真实请求进展',async()=>{
 const web=site();web.add('T');const phases=[],api=new ApiAdapter(web.request,{onPhase:p=>phases.push(p)});await api.run(batch([rename,title]),{...envelope([]),mode:'preview'});assert.equal(web.calls.filter(c=>c.method==='POST').length,0);phases.length=0;await api.run(batch([rename,title]),envelope([]));assert.deepEqual(phases,['checking','submitting','verifying']);
});
test('批量提交历史只有一个记录且可撤销，当前日期保持',async()=>{
 const web=site();web.add('T');const run=integrated(web),original=structuredClone(web.records.get('T').current);await run.executor.run(envelope([batch([rename,title])]));assert.equal((await run.history.state(web.actor)).entries.length,1);await run.history.restore(web.actor,'user',{},'undo-batch','undo');assert.deepEqual(web.records.get('T').current,original);
});
test('提示词不强制固定问卷、不以质量建议重写确认表格',()=>{
 const p=buildPrompt('只改标题',{},1);assert(!p.includes('必须3–6'));assert(!p.includes('复杂任务先问3–6'));assert(p.includes('用户已确认的表格优先'));assert(p.includes('plan.batch'));
});
import {compactPlanEdits} from '../extension/batch-input.js';
test('主界面安全合并单计划旧多步JSON，保留requestId，版本只增长一次',async()=>{
 const web=site();web.add('T');const input=envelope([{id:'a',op:rename.op,target:{id:'T',version:1},params:rename.params},{id:'b',op:title.op,target:{id:'T',versionFrom:'a'},dependsOn:['a'],params:title.params},{id:'read',op:'plan.get',target:{id:'T'},params:{}}]);const packed=compactPlanEdits(input);assert.equal(packed.requestId,input.requestId);assert.equal(packed.steps.length,1);assert.equal(input.steps.length,3);assert.equal((await integrated(web).executor.run(packed)).status,'success');assert.equal(web.calls.filter(c=>c.method==='POST').length,1);
});
test('跨计划、审核、允许部分继续或不明版本来源不自动合并',()=>{
 const first={id:'a',op:rename.op,target:{id:'T',version:1},params:rename.params};
 for(const second of [{id:'b',op:title.op,target:{id:'OTHER',version:1},params:title.params},{id:'b',op:'review.submit',target:{id:'T',versionFrom:'a'},params:{}},{id:'b',op:title.op,target:{id:'T'},params:title.params}]){const e=envelope([first,second]);assert.equal(compactPlanEdits(e),e);}
 const e=envelope([first,{...first,id:'b'}],{execution:{continueOnError:true}});assert.equal(compactPlanEdits(e),e);
});
