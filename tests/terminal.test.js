import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {prepareCommand,buildPrompt} from '../extension/terminal.js';
import {preferencesFor} from '../extension/preferences.js';
import {runCliDiagnostics} from '../extension/cli-diagnostics.js';

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
 const dom=new JSDOM(fs.readFileSync('extension/ui.html','utf8'),{url:'https://extension.test/ui.html'});
 globalThis.window=dom.window;globalThis.document=dom.window.document;
 const state={calls:[],copied:'',clipboardFails:false,contextFails:false,diagnostic:'success',actor:'USER_A',preferences:new Map()};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{if(state.clipboardFails)throw Error('denied');state.copied=text;}}}});
 globalThis.chrome={runtime:{id:'a'.repeat(32),sendMessage:async m=>{
  state.calls.push(structuredClone(m));
  if(m.kind==='preferences'){try{return await preferencesFor({get:async k=>state.preferences.get(k),set:async(k,v)=>state.preferences.set(k,v)},state.actor,m.scene,m.action,m.values,m.scope);}catch(e){return {status:'failed',message:e.message};}}
  if(m.kind==='tabs')return tabList;
  if(m.kind==='updates')return {status:'available',currentVersion:'2.3.0',latestVersion:'2.4.0',checkedAt:'2026-11-10T00:00:00Z'};
  if(m.kind==='cliTest')return {...await runCliDiagnostics({tabId:m.tabId,probeHost:async()=>{if(state.diagnostic==='host')throw {code:'HOST_NOT_FOUND',message:'C:/SECRET/token=secret'};return {pong:true};},query:async()=>state.diagnostic==='page'?{ok:false,code:'NOT_LOGGED_IN'}:{ok:true}}),privatePlan:'PRIVATE_PLAN',account:'PRIVATE_NAME',path:'C:/SECRET'};
  const op=m.command?.steps[0].op;if(op==='site.context'&&state.contextFails)return {status:'failed',message:'offline'};
  const data=op==='site.compatibility'?{status:'ok',extensionVersion:'2.3.0',checks:[],scope:'基础只读检查'}:op==='site.context'?{complete:true,plan:{id:'TEST',current:{nodes:[{id:'1',content:'完整上下文'}]}}}:{actor:'SYNTHETIC'};
  return {status:'success',summary:{success:1},steps:[{id:'a',status:'success',data}]};
 }}};
 await import('../extension/ui.js?'+caseName);for(let i=0;i<5;i++)await new Promise(setImmediate);
 return {dom,state,$:id=>document.getElementById(id)};
}
test('JSON终端与更新复制交互：无格式分支，管理提示词，去重与结果保留',async()=>{
 const {dom,state,$}=await openUi([{id:123,title:'序图',active:true}],'main');
 try{
  assert.equal($('targetRow').hidden,true);assert.equal($('moreDetails').open,false);assert.equal($('createPlan').getAttribute('aria-pressed'),'true');
  for(const id of ['mode','copyCli','native','extensionId','checkUpdates'])assert.equal($(id),null,id);
  assert.equal(document.querySelectorAll('textarea:not([readonly])').length,2);
  assert.equal(document.querySelectorAll('.cli textarea,.cli input,.cli select').length,0);assert($('moreDetails').contains($('testCli')));
  $('request').value='新建新品项目';await $('copyPrompt').onclick();assert(state.copied.includes('明确选择【新建】'));assert(state.copied.includes('用户本次需求：新建新品项目'));
  $('managePlan').onclick();$('request').value='删除一项并新增任务';await $('copyPrompt').onclick();assert(state.copied.includes('明确选择【管理】'));assert(state.copied.includes('完整上下文'));assert(state.copied.includes('用户本次需求：删除一项并新增任务'));
  $('editor').value=JSON.stringify({protocol:'xutu.command/v1',mode:'preview',steps:[{id:'a',op:'plan.list'}]});await $('execute').onclick();await $('execute').onclick();
  const runs=state.calls.filter(m=>m.command?.steps[0].op==='plan.list');assert.equal(runs.length,2);assert.equal(runs[0].command.requestId,runs[1].command.requestId);assert.equal(runs[0].command.mode,'execute');assert.equal($('resultDetails').hidden,false);
  $('createPlan').onclick();$('editor').value=JSON.stringify({protocol:'xutu.command/v1',steps:[{id:'s',op:'script.execute',params:{source:'document.title',world:'MAIN'}}]});await $('execute').onclick();assert(state.calls.some(m=>m.command?.steps[0].op==='script.execute'));
  const before=state.calls.length;$('editor').value='plan list';await $('execute').onclick();assert.equal(state.calls.length,before);assert($('message').textContent.includes('JSON'));
  assert(state.calls.some(m=>m.kind==='updates'));assert($('moreLabel').textContent.includes('有新版本'));await $('copyUpdate').onclick();assert(state.copied.includes('2.4.0'));assert(!state.copied.includes('完整上下文'));
  state.contextFails=true;await $('copyPrompt').onclick();assert(state.copied.includes('本次计划上下文读取失败'));assert(state.copied.includes('先给简短问卷'));
 }finally{dom.window.close();}
});
test('CLI测试逐段显示宿主失败、网页失败、成功，复制仅包含脱敏诊断',async()=>{
 const {dom,state,$}=await openUi([{id:123,title:'序图'}],'diag');
 try{
  assert($('copyDiagnostics').disabled);
  for(const phase of ['host','page','success']){
   state.diagnostic=phase;const scans=state.calls.filter(m=>m.kind==='tabs').length;
   await $('testCli').onclick();assert.equal(state.calls.filter(m=>m.kind==='tabs').length,scans);assert.equal(state.calls.at(-1).tabId,123);
   assert($('hostTest').textContent.includes(phase==='host'?'失败':'通过'));
   assert($('pageTest').textContent.includes(phase==='success'?'通过':phase==='page'?'失败':'未执行'));
   assert.equal($('cliStatus').textContent.includes('测试成功'),phase==='success');
   await $('copyDiagnostics').onclick();assert(state.copied.includes('插件版本'));assert(state.copied.includes('测试时间'));
   for(const secret of ['PRIVATE_PLAN','PRIVATE_NAME','SECRET','token','SYNTHETIC','"tabId":123'])assert(!state.copied.includes(secret),secret);
  }
  state.clipboardFails=true;await $('copyDiagnostics').onclick();assert.equal($('manualCopy').hidden,false);assert($('manualCopyText').value.includes('序图本地 CLI 诊断'));
 }finally{dom.window.close();}
});
test('多个标签页必须在主界面明确选择；CLI测试不会扫描或自行选择其他网页',async()=>{
 const {dom,state,$}=await openUi([{id:123,title:'一',active:true},{id:456,title:'二'}],'multiple');
 try{
  assert.equal($('targetRow').hidden,false);assert.equal($('tabs').value,'');assert(!state.calls.some(m=>m.kind==='run'));
  const scans=state.calls.filter(m=>m.kind==='tabs').length;await $('testCli').onclick();assert.equal(state.calls.at(-1).tabId,undefined);assert($('hostTest').textContent.includes('主界面选择'));assert.equal(state.calls.filter(m=>m.kind==='tabs').length,scans);
  $('tabs').value='456';await $('tabs').onchange();assert.equal($('tabs').value,'456');assert($('copyDiagnostics').disabled);
  const before=state.calls.filter(m=>m.kind==='tabs').length;await $('testCli').onclick();assert.equal(state.calls.at(-1).tabId,456);assert.equal(state.calls.filter(m=>m.kind==='tabs').length,before);assert($('cliStatus').textContent.includes('测试成功'));
 }finally{dom.window.close();}
});

test('偏好UI可查看、编辑、保存、重置；切换账号不复制前一人的选择',async()=>{
 const {dom,state,$}=await openUi([{id:123,title:'序图'}],'preferences');try{
 $('preferenceDetails').open=true;await $('preferenceDetails').ontoggle();await new Promise(r=>setTimeout(r,10));
 $('prefDetail').value='brief';await $('rememberPreferences').onclick();assert($('preferenceStatus').textContent.includes('已记住'));
 $('request').value='只调整名称';await $('copyPrompt').onclick();assert(state.copied.includes('"detail":"brief"'));
 state.actor='USER_B';await $('copyPrompt').onclick();assert.equal($('prefDetail').value,'neutral');assert(!state.copied.includes('"detail":"brief"'));
 state.actor='USER_A';await $('copyPrompt').onclick();assert.equal($('prefDetail').value,'brief');await $('resetPreferences').onclick();assert.equal($('prefDetail').value,'neutral');
 $('editor').value=JSON.stringify({protocol:'xutu.command/v1',requestId:'track-me',steps:[{id:'s',op:'node.batchUpdate',target:{id:'TEST',version:1},params:{updates:[{id:'1',set:{name:'成果'}}]}}]});$('editor').dispatchEvent(new window.Event('input'));assert($('changeSummary').textContent.includes('1个名称'));await $('execute').onclick();assert(state.calls.some(m=>m.command?.requestId==='track-me'));
 }finally{dom.window.close();}
});
