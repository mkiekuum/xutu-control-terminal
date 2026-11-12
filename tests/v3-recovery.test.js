import test from 'node:test';import assert from 'node:assert/strict';
import {site,integrated,envelope,rename,memory} from './v25-helpers.js';
import {HistoryManager} from '../extension/history.js';
import {mergeRecovery,verifySaved} from '../extension/recovery.js';
import {redact,helpPackage,captureSummary} from '../extension/assistance.js';
import {ApiAdapter} from '../extension/api.js';
import {JSDOM} from 'jsdom';
import {checkForUpdates,REPOSITORY} from '../extension/updates.js';

test('局部撤销重做保留他人日期、人员、进度、基线和布局；重启仍可恢复',async()=>{
 const web=site();web.add('P');const {executor,history,store}=integrated(web);
 await executor.run(envelope([{id:'edit',op:'node.batchUpdate',target:{id:'P',version:1},params:{updates:[{id:'1',set:{name:'新名'}}]}}]));
 const live=web.records.get('P');live.revision+=5;live.current.deadline='2026-12-12';live.current.nodes[0].owner='USER_B';live.current.edges[0].completedAt='2026-11-12';live.current.baseline={confirmedAt:'2026-11-12'};live.current.positions['1'].x=200;
 const expected=structuredClone(live.current);const restart=new HistoryManager(store,web.request);
 assert.equal((await restart.restore('USER_A','user',{},'undo-local','undo')).status,'success');expected.nodes[0].name='需求确定';assert.deepEqual(web.records.get('P').current,expected);
 assert.equal((await restart.restore('USER_A','user',{},'redo-local','redo')).status,'success');expected.nodes[0].name='新名';assert.deepEqual(web.records.get('P').current,expected);assert.equal((await history.list('USER_B')).count,0);
});
test('相同字段冲突三方差异、先不写、明确确认只覆盖已审阅字段；过期确认拒绝',async()=>{
 const web=site();web.add('P');const {executor,history}=integrated(web);await executor.run(envelope([rename('P','A')]));web.records.get('P').current.title='remote';web.records.get('P').revision++;
 const count=()=>web.calls.filter(c=>c.method==='POST').length,before=count();const denied=await history.restore('USER_A','user',{},'u','undo');assert.equal(denied.status,'failed');assert.equal(count(),before);
 const report=await history.preview('USER_A',{},'undo');assert.deepEqual(report.conflicts,[{path:'title',base:'A',current:'remote',wanted:'Synthetic P'}]);
 web.records.get('P').revision++;web.records.get('P').current.deadline='2026-12-01';await assert.rejects(history.restore('USER_A','user',{reviewToken:report.reviewToken},'old','undo'),{code:'HISTORY_REVIEW_REQUIRED'});
 const fresh=await history.preview('USER_A',{},'undo');assert.equal((await history.restore('USER_A','user',{reviewToken:fresh.reviewToken},'approved','undo')).status,'success');assert.equal(web.records.get('P').current.title,'Synthetic P');assert.equal(web.records.get('P').current.deadline,'2026-12-01');
});
test('确认历史点可跨多个批次，自己的恢复不会被误判成并发冲突',async()=>{
 const web=site();web.add('P');const {executor,history}=integrated(web);for(const title of ['A','B','C'])await executor.run(envelope([rename('P',title)]));const first=(await history.list('USER_A')).entries[0].historyId,p={historyId:first,point:'before'},review=await history.preview('USER_A',p,'point');
 assert.equal((await history.restore('USER_A','user',{...p,reviewToken:review.reviewToken},'point','point')).status,'success');assert.equal(web.records.get('P').current.title,'Synthetic P');assert.equal((await history.list('USER_A')).cursor,0);
});
test('结构恢复不机械拼接新的关联边、进度或基线',()=>{
 const web=site();web.add('P');const before=structuredClone(web.records.get('P').current),after=structuredClone(before);after.nodes.push({id:'3',name:'新增',content:'',owner:''});
 const live=structuredClone(after);live.edges.push({from:'2',to:'3',upper:'2',dashed:false,executor:'USER_B',completedAt:''});assert.throws(()=>mergeRecovery(after,before,live),{code:'RESTORE_UNSUPPORTED'});
 live.edges.pop();live.baseline={confirmedAt:'now'};assert.throws(()=>mergeRecovery(after,before,live),{code:'RESTORE_UNSUPPORTED'});
});
test('恢复失败部分报告；原请求状态未知保留WAL，核对后才能解除且不补造历史',async()=>{
 const web=site();for(const id of ['A','B','C'])web.add(id);const {executor,history}=integrated(web);await executor.run(envelope(['A','B','C'].map(id=>rename(id,'edited'))));
 web.beforePost=(path)=>{if(path.includes('/B/'))throw Object.assign(Error('lost'),{code:'TIMEOUT_RESULT_UNKNOWN'});};const r=await history.restore('USER_A','user',{},'restore-lost','undo');assert.equal(r.status,'partial_undo');assert(r.outcomes.some(x=>x.outcome==='unconfirmed'));assert.equal(web.records.get('A').current.title,'Synthetic A');assert.equal(web.records.get('C').current.title,'edited');
 const report=await history.diagnosePending('USER_A');assert.equal(report.requestId,'restore-lost');assert(report.changes.length);await assert.rejects(history.resolvePending('USER_A'),{code:'HISTORY_REVIEW_REQUIRED'});
 const posts=web.calls.filter(c=>c.method==='POST').length;await history.resolvePending('USER_A',{reviewToken:report.reviewToken});assert.equal(web.calls.filter(c=>c.method==='POST').length,posts);assert.equal((await history.list('USER_A')).canUndo,false);
});
test('恢复提交窗口的版本冲突独立回读，不重试',async()=>{
 const web=site();web.add('P');const {executor,history}=integrated(web);await executor.run(envelope([rename('P','edited')]));web.beforePost=()=>{web.records.get('P').revision++;web.records.get('P').current.deadline='2026-12-20';};const r=await history.restore('USER_A','user',{},'race','undo');assert.equal(r.status,'failed');assert.equal(r.outcomes[0].code,'VERSION_CONFLICT');assert.equal(r.outcomes[0].latest.record.current.deadline,'2026-12-20');assert.equal(web.calls.filter(c=>c.method==='POST').length,2);
});
test('业务与布局分别验证；编号映射的显式布局仍严格核验',async()=>{
 const web=site();web.add('P');const original=web.request;web.request=async(...args)=>{const value=await original(...args);if(args[1]==='POST')web.records.get('P').current.positions={};return value;};
 const api=new ApiAdapter(web.request),r=await api.run(rename('P','Saved',1),envelope([]));assert(r.serverVerified&&r.verification.businessVerified);assert.equal(r.verification.layoutVerified,false);assert(r.verification.warning);
 web.records.get('P').current.positions={'1':{x:1,y:2}};await assert.rejects(api.run({id:'r',op:'node.renumber',target:{id:'P',version:2},params:{mapping:[{from:'1',to:'7'}]}},envelope([])),{code:'SERVER_NOT_CONFIRMED'});
 const expected=web.records.get('P').current,wrong=structuredClone(expected);wrong.title='wrong';assert.throws(()=>verifySaved(expected,wrong),{code:'SERVER_NOT_CONFIRMED'});
});
test('删除节点清理坐标，业务成功不因服务端坐标规范化失去历史',async()=>{
 const web=site();web.add('P');const {executor,history}=integrated(web);const r=await executor.run(envelope([{id:'b',op:'plan.batch',target:{id:'P',version:1},params:{changes:[{op:'edge.remove',params:{fromNodeId:'1',toNodeId:'2'}},{op:'node.remove',params:{id:'2'}}]}}]));assert.equal(r.status,'success');assert(!web.records.get('P').current.positions['2']);assert(r.historySummary.recorded);await history.restore('USER_A','user',{},'undo-delete','undo');assert(web.records.get('P').current.positions['2']);
});
test('普通plan.get可作为versionFrom；跨计划或预览不能伪造确认版本',async()=>{
 const web=site();web.add('P');web.add('Q');const {executor}=integrated(web);const edit=rename('P','changed');edit.target.versionFrom='get';edit.dependsOn=['get'];const r=await executor.run(envelope([{id:'get',op:'plan.get',target:{id:'P'}},edit]));assert.equal(r.status,'success');assert.equal(r.steps[0].afterVersion,1);assert.equal(r.steps[1].beforeVersion,1);
 edit.target.id='Q';const bad=await executor.run(envelope([{id:'get',op:'plan.get',target:{id:'P'}},edit]));assert.equal(bad.steps[1].code,'INVALID_SCHEMA');
});
test('待核对报告关联原请求，读失败或无目标时不允许清除标记',async()=>{
 const store=memory(),web=site();web.add('P');const history=new HistoryManager(store,web.request,{lookupRequest:async()=>({result:{status:'failed',requestId:'original'}})});await history.save('USER_A',{entries:[],cursor:0,expected:{},pending:{requestId:'original',before:{P:await history.read('P')}}});const report=await history.diagnosePending('USER_A');assert.equal(report.requestRecord.requestId,'original');assert(report.canResolve);
 const state=await history.state('USER_A');state.pending={requestId:'unknown-script'};await history.save('USER_A',state);assert.equal((await history.diagnosePending('USER_A')).canResolve,false);
});
test('页面摘要排除脚本/表单秘密、声明范围和截断；求助文本过滤秘密而保留必要差异',()=>{
 const dom=new JSDOM('<body><h1>计划</h1><script>SECRET_SCRIPT</script><input value="FORM_SECRET"><textarea>TEXT_SECRET</textarea><p>'+('摘要'.repeat(14000))+'</p></body>',{url:'https://plan.fpgabbs.cn/?token=url-secret',runScripts:'outside-only'});const report=dom.window.eval('('+captureSummary.toString()+')()');assert(report.truncated);assert.equal(report.copiedCharacters,24000);assert(!JSON.stringify(report).includes('SECRET'));assert(!report.url.includes('token'));
 const safe=redact({cookie:'cookie-secret',nested:{password:'pw'},message:'Bearer abcdef token=xyz secret=secretvalue ghp_abcdefgh',plan:'计划A'});assert(!JSON.stringify(safe).includes('abcdef'));assert(!JSON.stringify(safe).includes('secretvalue'));assert.equal(safe.plan,'计划A');const help=helpPackage({requestId:'original',message:'timeout',diagnostic:{latest:{title:'合成计划'}}},null);assert(help.includes('system.status'));assert(help.includes('original'));assert(help.includes('合成计划'));dom.window.close();
});
test('更新内容仅展示文字，来自已验证正式发布页，不执行HTML',async()=>{
 const r=await checkForUpdates({currentVersion:'2.5.2',fetchImpl:async(url,o)=>({status:200,url:REPOSITORY+'/releases/tag/v3.0.0',text:async()=>'<div class="markdown-body"><h2>撤销改进</h2><script>BAD()</script><p>保留日期</p></div>',body:null})});assert.equal(r.status,'available');assert(r.notes.includes('撤销改进'));assert(!r.notes.includes('BAD'));assert(!r.notes.includes('<'));
});
test('发布正文超时不将已核实的版本误报为更新失败',async()=>{
 const r=await checkForUpdates({timeoutMs:100,currentVersion:'2.5.2',fetchImpl:async(url,o)=>o.method==='HEAD'?{status:200,url:REPOSITORY+'/releases/tag/v3.0.0',body:null}:new Promise(()=>{})});assert.equal(r.status,'available');assert.equal(r.latestVersion,'3.0.0');assert(!r.notes);
});
test('嵌入JSON的密码与令牌字符串也需脱敏；普通文字撤销保留网站自动布局',async()=>{
 assert(!redact('error: {"password":"private-password","token":"private-token"}').includes('private-'));
 const web=site();web.add('P');const original=web.request;web.request=async(...args)=>{const r=await original(...args);if(args[1]==='POST')web.records.get('P').current.positions['1'].x=777;return r;};const {executor,history}=integrated(web);const result=await executor.run(envelope([rename('P','edited')]));assert(result.historySummary.recorded);await history.restore('USER_A','user',{},'preserve-layout','undo');assert.equal(web.records.get('P').current.title,'Synthetic P');assert.equal(web.records.get('P').current.positions['1'].x,777);
});
