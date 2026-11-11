import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {prepareCommand,buildPrompt} from '../extension/terminal.js';
import {IntakeEngine} from '../extension/intake.js';
import {memory} from './v25-helpers.js';

test('界面只接收原始JSON和JSON代码块；CLI与独立JavaScript提示改用JSON',()=>{
 const json=JSON.stringify({protocol:'xutu.command/v1',requestId:'ai-id',mode:'preview',tabId:999,steps:[{id:'a',op:'plan.list'}]});
 for(const text of [json,'```json\n'+json+'\n```']){const c=prepareCommand(text,123,'local-job');assert.equal(c.mode,'execute');assert.equal(c.requestId,'ai-id');assert.equal(c.tabId,123);}
 for(const text of ['plan list','xutu context','alert(1)','```javascript\nalert(1)\n```','{foo:1}'])assert.throws(()=>prepareCommand(text,123,'bad'),/JSON/);
 assert.throws(()=>prepareCommand(JSON.stringify({protocol:'xutu.command/v1',steps:[{id:'a',op:'theme.reset'}]}),123,'removed'),/已移除/);
});
test('新建与管理仅指导提示词，JSON script.execute和现有业务命令保留',()=>{
 const ctx={complete:true,target:{id:'OLD'},plan:{current:{title:'旧计划',start:'2020-01-01',nodes:[]}}};
 const created=buildPrompt('规划新品',ctx,123,{intent:'create'});assert(created.includes('明确选择【新建】'));assert(created.includes('"dates":null'));assert(created.includes('旧计划'));
 const managed=buildPrompt('删除一项并新增任务',ctx,123,{intent:'manage'});assert(managed.includes('明确选择【管理】'));assert(managed.includes('新增/删除任务'));assert(managed.includes('2020-01-01'));assert(!managed.includes('需求是否针对当前选中计划'));
 for(const step of [{id:'js',op:'script.execute',params:{source:'document.title',world:'MAIN'}},{id:'n',op:'node.remove',target:{id:'TEST',version:1},params:{id:'2'}}]){
  const c=prepareCommand(JSON.stringify({protocol:'xutu.command/v1',steps:[step]}),123,'json');assert.deepEqual(c.steps[0],step);
 }
});
test('完整计划进入提示词且脚本限制仍保留',()=>{
 const context={id:'TEST',current:{title:'合成计划',nodes:[{id:'1',content:'完整任务正文'}]}};
 const prompt=buildPrompt('合并工作',context,123);assert(prompt.includes(JSON.stringify(context)));assert(prompt.includes('task.merge'));assert(prompt.includes('不要用script.execute绕过契约'));assert(!prompt.includes('"script.execute":'));assert(!prompt.includes('"theme.reset"'));
});

async function openUi(tabList,caseName){
 const dom=new JSDOM(fs.readFileSync('extension/ui.html','utf8'),{url:'https://extension.test/ui.html'});globalThis.window=dom.window;globalThis.document=dom.window.document;const engine=new IntakeEngine(memory()),state={calls:[],copied:'',clipboardFails:false,actor:'USER_A'};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{if(state.clipboardFails)throw Error('denied');state.copied=text;}}}});
 globalThis.chrome={runtime:{id:'a'.repeat(32),sendMessage:async m=>{state.calls.push(structuredClone(m));const ctx={actor:state.actor,tabId:m.tabId,groups:[{id:'G1',name:'Group',number:'G1'}],target:null};
 if(m.kind==='intake'){try{if(m.action==='inspect')return engine.inspect(ctx,m);if(m.action==='answer')return engine.answer(ctx,m.intakeId,m.answers,m.rememberExpression);if(m.action==='resetExpression')return engine.resetExpression(ctx,m.intakeId);if(m.action==='confirm')return engine.confirm(ctx,m.intakeId,m.command);}catch(e){return {status:'failed',message:e.message};}}
 if(m.kind==='tabs')return tabList;if(m.kind==='updates')return {status:'available',currentVersion:'2.5.0',latestVersion:'2.5.1',checkedAt:'2026-11-11T00:00:00Z'};
 const op=m.command?.steps[0].op;const data=op==='history.list'?{count:0,cursor:0,bytes:0,entries:[]}:op==='site.compatibility'?{status:'ok',extensionVersion:'2.5.0',checks:[],scope:'基础只读检查'}:op==='site.context'?{account:{actor:state.actor},complete:true,plan:{id:'TEST',current:{nodes:[{id:'1',content:'完整上下文'}]}}}:{actor:state.actor};return {status:'success',steps:[{id:'a',status:'success',data}]};
 }}};await import('../extension/ui.js?'+caseName);for(let i=0;i<5;i++)await new Promise(setImmediate);return {dom,state,$:id=>document.getElementById(id)};
}
test('主界面有需求、JSON与帮助，无CLI；问卷实际保存并复制，确认提案，账号切换不继承偏好',async()=>{
 const {dom,state,$}=await openUi([{id:123,title:'序图'}],'v25-main');try{
 for(const id of ['mode','copyCli','native','testCli','copyDiagnostics','preferenceDetails','checkUpdates'])assert.equal($(id),null,id);assert(!$('moreDetails').contains($('usageHelp')));assert.equal(document.querySelectorAll('textarea:not([readonly])').length,2);
 $('request').value='模拟复杂计划20节点';await $('copyPrompt').onclick();assert.equal($('intakePanel').hidden,false);assert.equal(document.querySelectorAll('#intakeQuestions fieldset').length,6);assert(state.copied.includes('未答完只讨论'));assert(state.copied.includes('用户本次需求：模拟复杂计划20节点'));
 for(const [k,v] of Object.entries({title:'合成计划',number:'TEST',goal:'产品交付和验收',resources:'模拟角色，工期建议',expression:'简洁，保留编号'}))$('answer-'+k).value=v;
 for(const input of document.querySelectorAll('#intakeQuestions input[type=checkbox]'))input.checked=true;$('answer-projectGroupId').value='__unset__';$('rememberExpression').checked=true;await $('saveAnswers').onclick();assert($('intakeState').textContent.includes('已保存'));await $('copyPrompt').onclick();assert(state.copied.includes('简洁，保留编号'));
 $('editor').value=JSON.stringify({protocol:'xutu.command/v1',requestId:'track',steps:[{id:'c',op:'plan.create',params:{title:'合成计划',number:'TEST'}}]});$('editor').dispatchEvent(new window.Event('input'));assert($('proposalText').textContent.includes('当前网站账号'));await $('confirmProposal').onclick();assert($('proposalStatus').textContent.includes('已核实'));await $('execute').onclick();const run=state.calls.find(m=>m.command?.requestId==='track');assert(run.command.intakeId);assert.equal($('resultDetails').hidden,false);
 state.actor='USER_B';await $('copyPrompt').onclick();assert.equal($('answer-expression').value,'');assert(!state.copied.includes('简洁，保留编号'));state.actor='USER_A';await $('copyPrompt').onclick();await $('resetExpression').onclick();assert.equal($('answer-expression').value,'');
 state.clipboardFails=true;await $('copyPrompt').onclick();assert(!$('manualCopy').hidden);assert($('manualCopyText').value.includes('用户本次需求'));state.clipboardFails=false;
 $('managePlan').onclick();$('request').value='只改名称';await $('copyPrompt').onclick();assert(state.copied.includes('明确选择【管理】'));assert(state.copied.includes('完整上下文'));assert($('proposalPanel').hidden);
 const before=state.calls.length;$('editor').value='xutu plan list';await $('execute').onclick();assert.equal(state.calls.length,before);assert($('message').textContent.includes('JSON'));await $('copyUpdate').onclick();assert(state.copied.includes('2.5.1'));assert(!state.copied.includes('完整上下文'));
 }finally{dom.window.close();}
});
test('多标签未选目标时问卷/历史/导出不自行扫描其他网页；JSON重复提交requestId不改变',async()=>{
 const {dom,state,$}=await openUi([{id:123,title:'一'},{id:456,title:'二'}],'v25-multiple');try{
 assert(!$('targetRow').hidden);assert.equal($('tabs').value,'');$('request').value='新计划';await $('copyPrompt').onclick();assert(!state.calls.some(m=>m.kind==='intake'));await $('loadHistory').onclick();assert($('message').textContent.includes('选择'));await $('copyDom').onclick();assert($('message').textContent.includes('选择'));
 $('tabs').value='456';await $('tabs').onchange();$('editor').value=JSON.stringify({protocol:'xutu.command/v1',steps:[{id:'a',op:'plan.list'}]});await $('execute').onclick();await $('execute').onclick();const runs=state.calls.filter(m=>m.command?.steps[0].op==='plan.list');assert.equal(runs.length,2);assert.equal(runs[0].command.requestId,runs[1].command.requestId);assert.equal(runs[0].command.tabId,456);
 }finally{dom.window.close();}
});
