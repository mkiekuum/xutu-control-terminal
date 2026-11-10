import test from 'node:test';import assert from 'node:assert/strict';
import {buildIntake} from '../extension/ai-brief.js';import {buildPrompt,prepareCommand} from '../extension/terminal.js';
test('缺少人员日期时保留未知状态，不擅自补今天或当前账号',()=>{
 const context={complete:true,account:{actor:'USER_A'},plan:{current:{planOwner:'OWNER_B',start:'',deadline:'',nodes:[{id:'1',owner:''}],edges:[{from:'1',to:'2',executor:'',dashed:false,completedAt:''},{from:'2',to:'3',executor:'',dashed:true,completedAt:''}]}}};
 const intake=buildIntake(context);assert.equal(intake.dates.startDate,'');assert.deepEqual(intake.missing.nodeOwners,['1']);assert.deepEqual(intake.missing.workExecutors,[{from:'1',to:'2'}]);assert.equal(intake.missing.planOwner,false);assert.equal(context.plan.current.edges[0].executor,'');
});
test('提示词先问相关缺项，保留已确认留空，要求聊天JSON代码块而非文件',()=>{
 const prompt=buildPrompt('制定计划',{complete:false,plan:null,warnings:['partial']},1);
 for(const text of ['先给简短问卷，不输出可执行JSON','不重复提问','只改标题时无需追问','暂不设置/留空','计划负责人','实际完成日期','不自动授权覆盖','聊天正文直接输出一个完整的json代码块','不要生成JSON文件','不要拆成多个','不盲目换requestId'])assert(prompt.includes(text),text);
 assert(!prompt.includes('按用户需求输出可直接执行的 xutu.command/v1 JSON，只输出'));assert.equal(buildIntake(null).missing,null);
});
test('多个账号的提示词不写死名字，完整保留审核、日期和基线信息',()=>{
 for(const person of ['ALPHA','BETA']){const context={account:{actor:person},complete:true,plan:{current:{planOwner:person,start:'2027-01-01',deadline:'2027-02-01',nodes:[],edges:[{from:'1',to:'2',completedAt:'2027-01-03'}],baseline:{confirmedAt:'2026-12-31T08:00:00Z'}}},status:{review:{status:'approved',reviewedAt:'2026-12-31T08:00:00Z'}},forecastHistory:[{date:'2027-01-08'}]};const prompt=buildPrompt('改标题',context,1);assert(prompt.includes(JSON.stringify(context)));assert(prompt.includes(person));assert(!prompt.includes(person==='ALPHA'?'BETA':'ALPHA'));}
});
test('可粘贴带说明的单一JSON代码块；多块、附件链接和问卷明确拒绝',()=>{
 const json=JSON.stringify({protocol:'xutu.command/v1',steps:[{id:'r',op:'plan.list'}]});
 assert.equal(prepareCommand('下面是只读指令：\n```json\n'+json+'\n```\n复制即可。',1,'copy').steps[0].op,'plan.list');
 const embedded=JSON.stringify({protocol:'xutu.command/v1',steps:[{id:'r',op:'node.update',target:{id:'TEST'},params:{id:'1',set:{content:'说明中的```json\n示例\n```不能作为外层指令'}}}]});assert.equal(prepareCommand(embedded,1,'embedded').steps[0].op,'node.update');
 for(const text of ['[下载](sandbox:/plan.json)','请先回答负责人是谁？','```json\n'+json+'\n```\n```json\n'+json+'\n```'])assert.throws(()=>prepareCommand(text,1,'bad'));
});
