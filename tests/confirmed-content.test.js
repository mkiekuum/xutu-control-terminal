import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyToNative} from '../extension/converter.js';
import {buildPrompt} from '../extension/terminal.js';
import {site,integrated,envelope} from './v25-helpers.js';

test('已确认名称和正文转换后逐字保留，包括换行、标点及空正文',()=>{
 const tasks=[{id:'a',name:'配置清单',content:'核对 A12、数量 20。\n保留原说明。',duration:2},{id:'b',name:'验收',content:'',duration:3,dependsOn:['a']}];
 const before=structuredClone(tasks),r=legacyToNative({title:'Synthetic',unit:'day',tasks});
 for(const task of tasks){const n=r.plan.nodes.find(n=>n.id===task.id+'E');assert.equal(n.name,task.name);assert.equal(n.content,task.content);}
 assert.deepEqual(tasks,before);
 assert(r.plan.nodes.filter(n=>n.id.endsWith('S')).every(n=>n.name.startsWith('辅助：')));
 assert(r.plan.edges.some(e=>e.fromNodeId==='aE'&&e.toNodeId==='bS'&&e.dashed));
 assert.deepEqual(r.plan.edges.filter(e=>!e.dashed).map(e=>e.estimateDays.likely),[2,3]);
});
test('node.batchUpdate文字修复经最新版本提交与回读，只改变name/content',async()=>{
 const web=site();web.add('T');const record=web.records.get('T');record.revision=31;record.current.deadline='2026-11-13';record.current.baseline={confirmedAt:'2026-11-01',forecastDate:'2026-11-12'};record.current.edges[0].completedAt='2026-11-11';record.review={status:'approved'};
 const before=structuredClone(record),text='确认的正文。\n不额外添加技术说明。';
 const command=envelope([{id:'text',op:'node.batchUpdate',target:{id:'T',version:31},params:{updates:[{id:'1',set:{name:'确认的名称',content:text}},{id:'2',set:{content:''}}]}}]);
 const result=await integrated(web).executor.run(command);
 assert.equal(result.status,'success');assert.equal(result.steps[0].serverVerified,true);
 const expected=structuredClone(before.current);expected.nodes[0].name='确认的名称';expected.nodes[0].content=text;expected.nodes[1].content='';
 assert.deepEqual(web.records.get('T').current,expected);assert.deepEqual(web.records.get('T').review,before.review);
 const writes=web.calls.filter(c=>c.method==='POST');assert.equal(writes.length,1);assert.equal(writes[0].body.baseRevision,31);
 assert(web.calls.slice(web.calls.indexOf(writes[0])+1).some(c=>c.path==='/api/plans/T'&&c.method==='GET'));
});
test('复制提示词要求忠于确认表格、局部文字修改和辅助禁令冲突澄清',()=>{
 const prompt=buildPrompt('恢复确认表格原文',{},1);
 for(const text of ['原样保留name/content','set只包含本次授权的name/content','写后回读逐字核对','不静默截断','不能擅自破坏依赖','确认表格原文缺失时先索取原文'])assert(prompt.includes(text),text);
});
