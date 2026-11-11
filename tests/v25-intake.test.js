import test from 'node:test';import assert from 'node:assert/strict';
import {IntakeEngine,UNSET,classify} from '../extension/intake.js';import {validateStep} from '../extension/validation.js';import {Executor} from '../extension/core.js';
import {memory,envelope,site} from './v25-helpers.js';import {ApiAdapter} from '../extension/api.js';import {buildPrompt} from '../extension/terminal.js';
const ctx={actor:'USER_A',tabId:123,groups:[{id:'G1',number:'PRJ-0097',name:'Synthetic'}],target:null};
const answers={title:'核心板配套计划',number:'TEST-25',startDate:UNSET,deadlineDate:UNSET,projectGroupId:UNSET,goal:'交付可验收的产品方案，交期优先，先验证资源',resources:'USER_A 单人执行，不制造并行；估时为待核实提案',expression:'默认易懂，适中，不改无关字段'};
const creation=(id)=>envelope([{id:'create',op:'plan.create',params:{title:answers.title,number:answers.number,nodes:[{id:'1',name:'需求确定'},{id:'2',name:'验收完成'}],edges:[{fromNodeId:'1',toNodeId:'2',estimateDays:{minimum:1,likely:2,maximum:3},executor:'USER_A'}]}}],{intakeId:id});
test('复杂新同事首轮3–6问，AI直给30节点也被门禁拒绝；保存回答及确认实际提案后允许',async()=>{
 const engine=new IntakeEngine(memory()),l=await engine.inspect(ctx,{intent:'create',request:'老板叫我做一份 FPGA 核心板配套底板产品需求计划，至少20节点，尽量并行。'});assert.equal(l.questions.length,6);assert(l.classification.complex);assert.deepEqual(l.questions.map(x=>x.id),['identity','dates','project','goal','resources','expression']);
 const noIntake=creation();delete noIntake.intakeId;noIntake.steps[0].params.nodes=Array.from({length:30},(_,i)=>({id:String(i),name:'成果'+i}));await assert.rejects(engine.guard(noIntake,ctx),{code:'INTAKE_REQUIRED'});
 await engine.answer(ctx,l.id,{title:answers.title});await assert.rejects(engine.guard(creation(l.id),ctx),{code:'INTAKE_REQUIRED'});await engine.answer(ctx,l.id,answers);const command=creation(l.id);await assert.rejects(engine.guard(command,ctx),{code:'ESTIMATE_NOT_CONFIRMED'});await engine.confirm(ctx,l.id,command);await engine.guard(command,ctx);command.steps[0].params.edges[0].estimateDays.likely=2.5;await assert.rejects(engine.guard(command,ctx),{code:'ESTIMATE_NOT_CONFIRMED'});
});
test('明确日期、无硬截止、真实项目组直接沿用，空文本不等于暂不设置',async()=>{
 const engine=new IntakeEngine(memory()),l=await engine.inspect(ctx,{intent:'create',request:'开工 2026-11-12，不设必须完成日期，项目组 PRJ-0097，负责人按当前账号。'});assert.equal(l.facts.startDate.value,'2026-11-12');assert.equal(l.facts.deadlineDate.value,'');assert.equal(l.facts.projectGroupId.value,'G1');assert(!l.questions.some(q=>['dates','project'].includes(q.id)));
 const blank=await engine.inspect(ctx,{intent:'create',request:'制定新计划'});const result=await engine.answer(ctx,blank.id,{startDate:'',deadlineDate:'',projectGroupId:''});assert.equal(result.facts.startDate,undefined);assert(!result.roundAnswered);await assert.rejects(engine.answer(ctx,blank.id,{startDate:'2026-02-31'}),{code:'INVALID_SCHEMA'});await assert.rejects(engine.answer(ctx,blank.id,{projectGroupId:'FAKE'}),{code:'PROJECT_GROUP_UNAVAILABLE'});
});
test('仅改标题保持简单流程；表达偏好在问卷中按账号和用途记忆、修改和重置',async()=>{
 const store=memory(),engine=new IntakeEngine(store),p={intent:'manage',request:'把 MB-0001 标题改为 X。'},c={...ctx,target:{id:'P',version:27}};const l=await engine.inspect(c,p);assert(!l.required);assert.deepEqual(l.questions.map(q=>q.id),['expression']);assert(!classify(p.request).complex);
 await engine.guard(envelope([{id:'rename',op:'plan.update',target:{id:'P',version:27},params:{set:{title:'X'}}}]),c);
 await engine.answer(c,l.id,{expression:'简洁，保留名称'},true);const other=await engine.inspect({...c,actor:'USER_B'},p);assert.equal(other.rememberedExpression,'');const create=await engine.inspect(ctx,{intent:'create',request:'新的目标'});assert.equal(create.rememberedExpression,'');await engine.answer(c,l.id,{expression:'详细，保留结构'},true);await engine.resetExpression(c,l.id);assert.equal((await engine.get(c,l.id)).rememberedExpression,'');
});
test('账号、标签、计划版本和项目组权限变化不能沿用台账；不能伪造完成标记',async()=>{
 const engine=new IntakeEngine(memory()),l=await engine.inspect(ctx,{intent:'create',request:'模拟计划'});await engine.answer(ctx,l.id,answers);await assert.rejects(engine.get({...ctx,actor:'USER_B'},l.id),{code:'INTAKE_CONTEXT_CHANGED'});await assert.rejects(engine.get({...ctx,tabId:456},l.id),{code:'INTAKE_CONTEXT_CHANGED'});
 const mctx={...ctx,target:{id:'P',version:27}},m=await engine.inspect(mctx,{intent:'manage',request:'复杂重构计划'});await assert.rejects(engine.get({...mctx,target:{id:'P',version:31}},m.id),{code:'INTAKE_CONTEXT_CHANGED'});
 const cmd=creation(l.id);await engine.answer(ctx,l.id,{projectGroupId:'G1'});cmd.steps.push({id:'group',op:'project.assignPlan',dependsOn:['create'],params:{planIdFrom:{stepId:'create',field:'targetId'},groupId:'G1'}});await assert.rejects(engine.confirm({...ctx,groups:[]},l.id,cmd),{code:'PROJECT_GROUP_UNAVAILABLE'});
 await assert.rejects(engine.confirm(ctx,l.id,{...cmd,intakeComplete:true}),{code:'INVALID_SCHEMA'});
});
test('名称日期与答复一致；真实缺执行人阻止、模拟可用角色，未确认不写',async()=>{
 const engine=new IntakeEngine(memory()),l=await engine.inspect(ctx,{intent:'create',request:'新建真实计划'});await engine.answer(ctx,l.id,answers);const command=creation(l.id);command.steps[0].params.deadlineDate='2026-12-01';await assert.rejects(engine.confirm(ctx,l.id,command),{code:'INTAKE_ANSWER_CONFLICT'});delete command.steps[0].params.deadlineDate;delete command.steps[0].params.edges[0].executor;await assert.rejects(engine.confirm(ctx,l.id,command),{code:'REQUIRED_FIELD_UNKNOWN'});await engine.answer(ctx,l.id,{resources:'本次暂不分配，先做草稿'});await engine.confirm(ctx,l.id,command);
});
test('创建后项目组使用已回读真实ID，分组失败准确部分成功；非法引用提交前拒绝',async()=>{
 const web=site(),api=new ApiAdapter(web.request),ex=new Executor(memory(),(s,e)=>api.run(s,e)),command=creation();delete command.intakeId;command.steps.push({id:'assign',op:'project.assignPlan',dependsOn:['create'],params:{planIdFrom:{stepId:'create',field:'targetId'},groupId:'G1'}});
 const r=await ex.run(command);assert.equal(r.status,'success');assert.equal(web.records.get(r.steps[0].targetId).projectGroupId,'G1');assert.equal(web.calls.find(c=>c.body?.action==='assign').body.planId,r.steps[0].targetId);
 web.denyGroup=true;const second=structuredClone(command);second.requestId=crypto.randomUUID();second.steps[0].params.number='TEST-OTHER';const fail=await ex.run(second);assert.equal(fail.status,'partial_success');assert(fail.steps[0].serverVerified);assert.equal(fail.steps[1].code,'PERMISSION_DENIED');
 assert.throws(()=>validateStep({op:'project.assignPlan',params:{groupId:'G1',planId:'A',planIdFrom:{stepId:'s',field:'targetId'}}}),{code:'INVALID_SCHEMA'});
});
test('提示词包含台账缺项、单一可复制JSON、默认owner与真实分工区别，保留脚本限制',()=>{
 const prompt=buildPrompt('复杂计划',null,123,{intent:'create',intakeLedger:{id:'LOCAL',roundAnswered:false,facts:{expression:{value:'中性易懂'}}}});for(const text of ['3–6','LOCAL','未答完只讨论','完整JSON代码块','deadline','executor','不要用script.execute绕过契约'])assert(prompt.includes(text),text);
});
