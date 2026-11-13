import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {prepareCommand,buildPrompt} from '../extension/terminal.js';

import {memory} from './v25-helpers.js';

test('界面只接收原始JSON和JSON代码块；CLI与独立JavaScript提示改用JSON',()=>{
 const json=JSON.stringify({protocol:'xutu.command/v1',requestId:'ai-id',mode:'preview',tabId:999,steps:[{id:'a',op:'plan.list'}]});
 for(const text of [json,'```json\n'+json+'\n```']){const c=prepareCommand(text,123,'local-job');assert.equal(c.mode,'preview');assert.equal(c.requestId,'ai-id');assert.equal(c.tabId,123);}
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

test('没有本地问卷偏好和方案确认，澄清交给AI，保留需求输入，移除使用帮助',()=>{const dom=new JSDOM(fs.readFileSync('extension/ui.html','utf8')),d=dom.window.document;for(const id of ['intakePanel','preferenceDetails','proposalPanel','confirmProposal'])assert.equal(d.getElementById(id),null);assert(d.getElementById('request'));assert.equal(d.getElementById('usageHelp'),null);const prompt=buildPrompt('复杂计划',null,123,{intent:'create'});assert(prompt.includes('AI聊天中完成'));assert(prompt.includes('不要要求用户填写插件问卷'));dom.window.close();});
