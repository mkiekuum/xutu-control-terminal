import test from 'node:test';import assert from 'node:assert/strict';import {IDBFactory} from 'fake-indexeddb';
import {LocalStore} from '../extension/local-store.js';import {HistoryManager,businessDiff} from '../extension/history.js';import {envelope,memory,site,integrated,rename} from './v25-helpers.js';
test('11批保留10，撤销3重做2、新分支淘汰redo；重启持久化、去重缓存不随淘汰删除',async()=>{
 const web=site();web.add('P');const idb=new IDBFactory(),store=new LocalStore(idb),{executor,history,jobs}=integrated(web,store);const original=structuredClone(web.records.get('P').current),commands=[];
 for(let i=1;i<=11;i++){const c=envelope([rename('P','T'+i)],{execution:{backup:false}});commands.push(c);const r=await executor.run(c);assert.equal(r.status,'success');assert(r.historySummary.recorded);}
 assert.equal((await history.list('USER_A')).count,10);assert.equal(jobs.m.size,11);assert.equal((await executor.run(commands[0])).status,'success');assert.equal(web.records.get('P').current.title,'T11');
 const restarted=new HistoryManager(new LocalStore(idb),web.request);assert.equal((await restarted.list('USER_A')).count,10);assert.equal((await restarted.list('USER_B')).count,0);
 for(let i=0;i<3;i++)assert.equal((await restarted.restore('USER_A','user',{},crypto.randomUUID(),'undo')).status,'success');assert.equal(web.records.get('P').current.title,'T8');
 for(let i=0;i<2;i++)assert.equal((await restarted.restore('USER_A','user',{},crypto.randomUUID(),'redo')).status,'success');assert.equal(web.records.get('P').current.title,'T10');await executor.run(envelope([rename('P','BRANCH')]));assert.equal((await history.list('USER_A')).cursor,10);await assert.rejects(history.restore('USER_A','user',{},crypto.randomUUID(),'redo'),{code:'HISTORY_EMPTY'});
 const final=web.records.get('P').current;assert.deepEqual({...final,title:original.title},original);
 const operations=web.calls.filter(c=>c.method==='POST'&&c.body.operation).map(c=>c.body.operation);assert.equal(new Set(operations).size,operations.length);
});
test('跨三个计划一批一个位置，执行前快照，撤销重做逐个回读；部分失败准确报告并只重试剩余',async()=>{
 const web=site();for(const id of ['A','B','C'])web.add(id);const {executor,history}=integrated(web);let first=true;web.beforePost=async()=>{const state=await history.state('USER_A');assert(state.pending);if(first){assert.equal(Object.keys(state.pending.before).length,3);first=false;}};
 const r=await executor.run(envelope(['A','B','C'].map(id=>rename(id,'new'+id))));assert(r.historySummary.recorded);assert.equal((await history.list('USER_A')).count,1);web.beforePost=null;
 const b=web.records.get('B');b.revision++;b.current.deadline='2026-11-13';const partial=await history.restore('USER_A','user',{},crypto.randomUUID(),'undo');assert.equal(partial.status,'partial_undo');assert.deepEqual(partial.remaining,['B']);assert.equal(web.records.get('B').current.deadline,'2026-11-13');assert.equal(web.records.get('A').current.title,'Synthetic A');const calls=web.calls.filter(c=>c.method==='POST').length;
 const retry=await history.restore('USER_A','user',{},crypto.randomUUID(),'undo');assert.equal(retry.status,'partial_undo');assert.equal(web.calls.filter(c=>c.method==='POST').length,calls);assert(retry.outcomes.some(x=>x.code==='UNDO_CONFLICT'));await history.resolvePending('USER_A');assert.equal((await history.list('USER_A')).partial,null);
});
test('只读、预览、全失败、无实质修改不占位置，snapshot写失败在任何POST前拒绝',async()=>{
 const web=site();web.add('P');const {executor,history}=integrated(web);
 await executor.run(envelope([{id:'r',op:'plan.get',target:{id:'P'}}]));await executor.run(envelope([rename('P','NO')],{mode:'preview'}));await executor.run(envelope([rename('P','BAD',99)]));await executor.run(envelope([rename('P','Synthetic P')]));assert.equal((await history.list('USER_A')).count,0);
 const broken=integrated(web,{get:async()=>undefined,set:async()=>{throw Object.assign(Error('quota'),{code:'HISTORY_STORAGE_FAILED'});}}),posts=web.calls.filter(c=>c.method==='POST').length;await assert.rejects(broken.executor.run(envelope([rename('P','NO')])),{code:'HISTORY_STORAGE_FAILED'});assert.equal(web.calls.filter(c=>c.method==='POST').length,posts);
});
test('新建/垃圾桶撤销重做保留ID，分组失败不伪装成功；审核域不越过恢复缺口',async()=>{
 const web=site(),{executor,history}=integrated(web);web.denyGroup=true;const r=await executor.run(envelope([{id:'c',op:'plan.create',params:{title:'T',number:'NEW'}},{id:'g',op:'project.assignPlan',dependsOn:['c'],params:{groupId:'G1',planIdFrom:{stepId:'c',field:'targetId'}}}]));assert.equal(r.status,'partial_success');const id=r.steps[0].targetId;assert.equal((await history.list('USER_A')).entries[0].reversibleState,'reversible');
 await history.restore('USER_A','user',{},crypto.randomUUID(),'undo');assert(web.trash.has(id));await history.restore('USER_A','user',{},crypto.randomUUID(),'redo');assert(web.records.has(id));
 await executor.run(envelope([{id:'d',op:'plan.delete',target:{id},params:{permanent:false}}]));await history.restore('USER_A','user',{},crypto.randomUUID(),'undo');assert(web.records.has(id));await executor.run(envelope([{id:'review',op:'review.submit',target:{id}}]));await assert.rejects(history.restore('USER_A','user',{},crypto.randomUUID(),'undo'),{code:'RESTORE_UNSUPPORTED'});
});
test('未知写入不重试，保留待核对记录；显式回读关闭缺口不重放原请求',async()=>{
 const web=site();web.add('P');const {executor,history}=integrated(web);web.beforePost=()=>{throw Object.assign(Error('timeout'),{code:'TIMEOUT_RESULT_UNKNOWN'});};const c=envelope([rename('P','UNKNOWN')]),r=await executor.run(c);assert.equal(r.steps[0].outcome,'unconfirmed');assert((await history.list('USER_A')).pending);const posts=web.calls.filter(c=>c.method==='POST').length;await executor.run(c);assert.equal(web.calls.filter(c=>c.method==='POST').length,posts);await assert.rejects(executor.run(envelope([rename('P','NO')])),{code:'HISTORY_SNAPSHOT_INCOMPLETE'});web.beforePost=null;await history.resolvePending('USER_A');assert.equal((await history.list('USER_A')).pending,null);assert.equal(web.calls.filter(c=>c.method==='POST').length,posts);
});
test('历史点支持字段级对比与跨记录恢复，后续并发日期不被覆盖',async()=>{
 const web=site();web.add('P');const {executor,history}=integrated(web);await executor.run(envelope([rename('P','FIRST')]));const point=(await history.list('USER_A')).entries[0].historyId;await executor.run(envelope([rename('P','SECOND')]));const diff=await history.diff('USER_A',{historyId:point});assert.deepEqual(diff.changes[0].diff,[{domain:'title',before:'SECOND',after:'FIRST'}]);await history.restore('USER_A','user',{historyId:point,point:'after'},crypto.randomUUID(),'point');assert.equal(web.records.get('P').current.title,'FIRST');web.records.get('P').revision++;web.records.get('P').current.start='2026-11-13';const conflict=await history.restore('USER_A','user',{},crypto.randomUUID(),'undo');assert.equal(conflict.status,'failed');assert.equal(conflict.outcomes[0].code,'UNDO_CONFLICT');assert.equal(web.records.get('P').current.start,'2026-11-13');
 const a=structuredClone(web.records.get('P').current),b=structuredClone(a);b.edges[0].upper='3-4-5';b.edges[0].executor='USER_B';b.edges[0].completedAt='2026-11-14';b.positions['1'].x=99;assert.deepEqual(businessDiff(a,b).map(x=>x.domain),['positions','edges']);
});

test('快照与写入之间他人修改导致冲突，历史不得把旧日期当撤销依据；多步使用真实回读版本',async()=>{
 const web=site();web.add('P');const store=memory(),baseSet=store.set;let mutate=true;store.set=async(k,v)=>{await baseSet(k,v);if(mutate&&v.pending?.before?.P){mutate=false;web.records.get('P').revision++;web.records.get('P').current.deadline='2026-11-13';}};const {executor,history}=integrated(web,store);
 const conflict=await executor.run(envelope([rename('P','NO')]));assert.equal(conflict.steps[0].code,'VERSION_CONFLICT');assert.equal(conflict.steps[0].diagnostic.latest.current.deadline,'2026-11-13');assert.equal(web.records.get('P').current.title,'Synthetic P');assert.equal((await history.list('USER_A')).count,0);
 const a=rename('P','ONE'),b=rename('P','TWO');b.id='second';const r=await executor.run(envelope([a,b]));assert.equal(r.status,'success');assert.deepEqual(r.steps.map(s=>[s.beforeVersion,s.afterVersion]),[[2,3],[3,4]]);await history.restore('USER_A','user',{},crypto.randomUUID(),'undo');assert.equal(web.records.get('P').current.deadline,'2026-11-13');assert.equal(web.records.get('P').current.title,'Synthetic P');
});

test('新建响应丢失仍保留已知目标ID用于独立核对，不用未知创建结果再次新建',async()=>{
 const web=site(),real=web.request;web.request=async(...args)=>{const result=await real(...args);if(args[0]==='/api/plans'&&args[1]==='POST')throw Object.assign(Error('response lost'),{code:'TIMEOUT_RESULT_UNKNOWN'});return result;};const {executor,history}=integrated(web),c=envelope([{id:'new',op:'plan.create',params:{title:'Synthetic',number:'NEW'}}]),r=await executor.run(c);assert.equal(r.steps[0].outcome,'unconfirmed');assert(r.steps[0].targetId);const state=await history.state('USER_A');assert(state.pending.before[r.steps[0].targetId]);assert.equal((await history.list('USER_A')).count,0);const resolved=await history.resolvePending('USER_A');assert.equal(resolved.latest[r.steps[0].targetId].kind,'active');await executor.run(c);assert.equal(web.records.size,1);
});

test('网站因普通编辑自动改变审核时标记不可逆，不能把只恢复内容谎称恢复审核',async()=>{
 const web=site();web.add('P');web.records.get('P').review={status:'approved'};const {executor,history}=integrated(web);web.beforePost=()=>{web.records.get('P').review={status:'draft'};};await executor.run(envelope([rename('P','change')]));assert.equal((await history.list('USER_A')).entries[0].reversibleState,'unsupported');await assert.rejects(history.restore('USER_A','user',{},crypto.randomUUID(),'undo'),{code:'RESTORE_UNSUPPORTED'});
});
