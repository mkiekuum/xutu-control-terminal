import {mergeRecovery,verifySaved} from './recovery.js';
import {fail,clone,equivalent,operationId,clean} from './core.js';
import {accountKey,digest} from './local-store.js';
import {writes,ApiAdapter} from './api.js';
export const isBusinessWrite=s=>writes.includes(s.op)||s.op==='script.execute';
const supported=s=>!s.op.startsWith('review.')&&!s.op.startsWith('group.')&&!s.op.startsWith('project.')&&!['task.assign','task.updateStatus','history.restore','script.execute'].includes(s.op);
const model=s=>s?.record?.current||null;
export function businessDiff(a,b){
 const out=[];for(const field of ['title','planNumber','planOwner','start','deadline','baseline','positions'])if(!equivalent(a?.[field],b?.[field]))out.push({domain:field,before:a?.[field]??null,after:b?.[field]??null});
 for(const domain of ['nodes','edges']){const key=x=>domain==='nodes'?x.id:x.from+'→'+x.to,old=new Map((a?.[domain]||[]).map(x=>[key(x),x])),next=new Map((b?.[domain]||[]).map(x=>[key(x),x]));for(const id of new Set([...old.keys(),...next.keys()])){const left=old.get(id),right=next.get(id);if(equivalent(left,right))continue;out.push({domain,id,fields:[...new Set([...Object.keys(left||{}),...Object.keys(right||{})])].filter(k=>!equivalent(left?.[k],right?.[k])).map(field=>({field,before:left?.[field]??null,after:right?.[field]??null}))});}}
 return out;
}
function sameBusiness(a,b){return a?.kind===b?.kind&&equivalent(model(a),model(b))&&equivalent(a?.record?.review,b?.record?.review)&&equivalent(a?.record?.projectGroupId,b?.record?.projectGroupId);}
function sameState(a,b){return a?.kind===b?.kind&&a?.revision===b?.revision&&equivalent(model(a),model(b))&&equivalent(a?.record?.review,b?.record?.review)&&equivalent(a?.record?.projectGroupId,b?.record?.projectGroupId);}
export class HistoryManager {
 constructor(store,request,options={}){this.store=store;this.request=request;this.options=options;}
 async key(actor){return 'history:'+await accountKey(actor);}
 async state(actor){return await this.store.get(await this.key(actor))||{schema:1,entries:[],cursor:0,expected:{},pending:null};}
 async save(actor,state){await this.store.set(await this.key(actor),state);}
 async protectStep(step,prepared){
  if(!prepared||!isBusinessWrite(step)||!step.target||step.op==='plan.copy')return step;
  const id=await new ApiAdapter(this.request).resolve(step.target),basis=prepared.latest?.[id]||prepared.before[id];
  if(!basis||basis.revision===null)return step;
  const guarded=clone(step);guarded.target={...guarded.target,id};if(guarded.target.version===undefined)guarded.target.version=basis.revision;
  return guarded;
 }
 async trackStep(result,prepared){if(prepared&&result.serverVerified&&result.targetId){prepared.latest??={};try{prepared.latest[result.targetId]={revision:result.afterVersion??(await this.read(result.targetId)).revision};}catch(error){error.outcome='unconfirmed';throw error;}}}
 async read(id){try{const record=await this.request('/api/plans/'+encodeURIComponent(id));return {kind:'active',revision:record.revision,record};}catch(e){if(!['TARGET_TRASHED','TARGET_NOT_FOUND'].includes(e.code))throw e;const entry=(await this.request('/api/trash')).find(x=>x.id===id);return entry?{kind:'trash',revision:entry.revision,record:entry}:{kind:'absent',revision:null,record:null};}}
 async prepare(actor,command){
  const state=await this.state(actor);if(state.pending||state.partial)fail('HISTORY_SNAPSHOT_INCOMPLETE','前一批次有未确认的历史，请先查看历史中的待核对状态，不自动重放。');
  const before={},unsupported=[],external={};const api=new ApiAdapter(this.request);
  for(const s of command.steps.filter(isBusinessWrite)){
   if(!supported(s))unsupported.push({id:s.id,op:s.op,reason:s.op==='script.execute'?'任意脚本副作用不可完整捕获':'该域没有已核实的安全恢复契约'});
   if(s.op!=='plan.copy'&&(s.target?.id||s.target?.number)){const id=await api.resolve(s.target);if(!before[id])before[id]=await this.read(id);}
   if(s.op==='project.assignPlan'&&s.params?.planId&&!before[s.params.planId])before[s.params.planId]=await this.read(s.params.planId);
   const endpoint=s.op.startsWith('project.')?'/api/project-groups':s.op.startsWith('group.')?'/api/visibility-groups':s.op.startsWith('task.')&&['task.assign','task.updateStatus'].includes(s.op)?'/api/work-tasks':null;
   if(endpoint&&!external[endpoint])external[endpoint]=await this.request(endpoint);
  }
  const prepared={historyId:crypto.randomUUID(),requestId:command.requestId,actor,origin:'https://plan.fpgabbs.cn',startedAt:new Date().toISOString(),commandHash:await digest(command),before,unsupported,external,operations:command.steps.map(s=>({id:s.id,op:s.op}))};
  state.pending=prepared;await this.save(actor,state);return prepared;
 }
 async finish(actor,prepared,command,result){
  if(!prepared)return;
  const state=await this.state(actor),after={},before=clone(prepared.before),errors=[];
  for(const step of result.steps){if(step.targetId&&!before[step.targetId]&&command.steps.some(s=>s.id===step.id&&['plan.create','plan.copy'].includes(s.op)))before[step.targetId]={kind:'absent',revision:null,record:null};}
  let verified=false;
  for(const id of Object.keys(before)){try{after[id]=await this.read(id);if(!sameBusiness(before[id],after[id])&&result.steps.some(s=>s.serverVerified&&(s.targetId===id||command.steps.find(x=>x.id===s.id)?.params?.planId===id)))verified=true;}catch(e){errors.push({id,code:e.code||'READ_FAILED'});}}
  const externalAfter={};for(const path of Object.keys(prepared.external))try{externalAfter[path]=await this.request(path);if(!equivalent(prepared.external[path],externalAfter[path])&&result.steps.some(s=>s.serverVerified))verified=true;}catch(e){errors.push({path,code:e.code||'READ_FAILED'});}
  for(const id of Object.keys(before)){if(after[id]&&sameBusiness(before[id],after[id])&&!result.steps.some(s=>s.outcome==='unconfirmed')){delete before[id];delete after[id];continue;}const last=[...result.steps].reverse().find(s=>s.targetId===id&&s.serverVerified&&s.afterVersion!==undefined);if(last&&after[id]?.revision!==last.afterVersion)errors.push({id,code:'AFTER_STATE_CHANGED'});}
  const unsafe=prepared.unsupported.filter(u=>result.steps.some(s=>s.id===u.id&&(s.status==='success'||s.outcome==='unconfirmed')));
  for(const id of Object.keys(before))if(before[id].kind==='active'&&after[id]?.kind==='active'&&(!equivalent(before[id].record.review,after[id].record.review)||!equivalent(before[id].record.projectGroupId,after[id].record.projectGroupId)))unsafe.push({id,op:'automatic.review-or-project-change',reason:'普通编辑同时改变了审核或分组，尚无安全逆向契约'});
  const unknown=result.steps.some(s=>s.outcome==='unconfirmed');
  const entry={...prepared,unsupported:unsafe,before,after,externalAfter,endedAt:new Date().toISOString(),steps:clean(result.steps.map(({id,status,code,outcome,serverVerified,targetId})=>({id,status,code,outcome,serverVerified,targetId}))),errors,reversibleState:unsafe.length||unknown||errors.length?'unsupported':'reversible'};
  if(verified&&!errors.length){state.entries=state.entries.slice(0,state.cursor);state.entries.push(entry);if(state.entries.length>10)state.entries.shift();state.cursor=state.entries.length;for(const[id,value]of Object.entries(after))state.expected[id]=value;}
  const retained=new Set(state.entries.flatMap(e=>Object.keys(e.after)));for(const id of Object.keys(state.expected))if(!retained.has(id))delete state.expected[id];
  // Keep an unresolved batch visible, but not as a fake successful undo slot.
  state.pending=unknown||errors.length?{...entry,unconfirmed:true}:null;
  await this.save(actor,state);return {recorded:verified&&!errors.length,historyId:verified&&!errors.length?entry.historyId:null,count:state.entries.length,cursor:state.cursor,reversibleState:entry.reversibleState,unconfirmed:!!state.pending};
 }
 async list(actor){const s=await this.state(actor);return {count:s.entries.length,limit:10,cursor:s.cursor,bytes:new TextEncoder().encode(JSON.stringify(s)).length,partial:s.partial||null,pending:s.pending?{requestId:s.pending.requestId,startedAt:s.pending.startedAt,unconfirmed:true}:null,canUndo:!s.pending&&!s.partial&&s.cursor>0&&s.entries[s.cursor-1]?.reversibleState==='reversible',canRedo:!s.pending&&!s.partial&&s.cursor<s.entries.length&&s.entries[s.cursor]?.reversibleState==='reversible',entries:s.entries.map((e,i)=>({historyId:e.historyId,index:i+1,requestId:e.requestId,time:e.endedAt,operations:e.operations,targets:Object.keys(e.before),reversibleState:e.reversibleState,applied:i<s.cursor,errors:e.errors,unsupported:e.unsupported})),scope:'本机扩展历史，不是网站服务器全部历史'};}
 async diff(actor,p){const state=await this.state(actor),entry=state.entries.find(e=>e.historyId===p.historyId);if(!entry)fail('HISTORY_EMPTY','历史记录不存在或已淘汰');const other=p.compareId?state.entries.find(e=>e.historyId===p.compareId):null;if(p.compareId&&!other)fail('HISTORY_EMPTY');const selected=entry[p.point||'after'],ids=new Set([...Object.keys(selected),...Object.keys(other?.after||{})]),changes=[];for(const id of ids){const target=selected[id];if(!target||other&&!other.after?.[id]){changes.push({targetId:id,unavailable:true,notice:'所选两批没有共同记录此计划，无法推断该时点状态；不表示计划不存在。',diff:[]});continue;}const current=other?.after?.[id]||await this.read(id);changes.push({targetId:id,currentKind:current.kind,selectedKind:target?.kind,diff:businessDiff(model(current),model(target)),review:{current:current.record?.review,selected:target?.record?.review},projectGroup:{current:current.record?.projectGroupId,selected:target?.record?.projectGroupId}});}return {changes,reversibleState:entry.reversibleState,externalChanges:entry.unsupported};}

 async diagnosePending(actor){
  const state=await this.state(actor),pending=state.pending||state.partial;
  if(!pending)return {pending:false,notice:'没有待核对批次'};
  const ids=new Set([...Object.keys(pending.before||{}),...Object.keys(pending.after||{}),pending.targetId,...(pending.outcomes||[]).map(x=>x.targetId)].filter(Boolean)),latest={},changes=[];
  for(const id of ids){latest[id]=await this.read(id);changes.push({targetId:id,beforeToCurrent:businessDiff(model(pending.before?.[id]),model(latest[id])),capturedAfterToCurrent:pending.after?.[id]?businessDiff(model(pending.after[id]),model(latest[id])):null});}
  const record=await this.options.lookupRequest?.(pending.requestId)||null;
  const report={pending:true,requestId:pending.requestId,latest,changes,requestRecord:record?.result||{status:record?'unconfirmed':'not_found'},canResolve:ids.size>0,notice:'只读核对：解除后保留网站现状，不补造快照、不恢复撤销能力、不重发原请求。'};
  report.reviewToken=await digest({pending,latest});return report;
 }
 async resolvePending(actor,p={}){
  const report=await this.diagnosePending(actor);if(!report.pending)return {status:'success',notice:report.notice};
  if(!report.canResolve||p.reviewToken!==report.reviewToken)fail('HISTORY_REVIEW_REQUIRED','请先读取待核对批次的差异；网站内容变化后需要重新核对。');
  const state=await this.state(actor),ids=Object.keys(report.latest);
  state.lastUnconfirmed={requestId:report.requestId,readAt:new Date().toISOString(),targets:ids,notice:report.notice};
  for(const entry of state.entries)if(Object.keys(entry.before).some(id=>ids.includes(id)))entry.reversibleState='unsupported';
  state.pending=null;delete state.partial;Object.assign(state.expected,report.latest);await this.save(actor,state);
  return {status:'success',notice:'已保留网站现状并关闭待核对标记；受影响的旧记录不能再自动恢复。原请求记录保持。',latest:report.latest};
 }
 path(state,p,direction){
  let destination=direction==='undo'?state.cursor-1:state.cursor+1;
  if(direction==='point'){const index=state.entries.findIndex(e=>e.historyId===p.historyId);if(index<0)fail('HISTORY_EMPTY');destination=index+(p.point==='before'?0:1);}
  if(destination<0||destination>state.entries.length||destination===state.cursor)fail('HISTORY_EMPTY','没有可撤销或重做的记录');
  const undo=destination<state.cursor,indices=undo?Array.from({length:state.cursor-destination},(_,n)=>state.cursor-1-n):Array.from({length:destination-state.cursor},(_,n)=>state.cursor+n);
  if(indices.some(i=>state.entries[i].reversibleState!=='reversible'))fail('RESTORE_UNSUPPORTED','路径包含不可安全恢复的审核、分组、脚本或未确认操作，不能跨过缺口。');
  return {destination,undo,indices};
 }
 candidate(entry,id,current,undo,accept=false){
  const base=entry[undo?'after':'before'][id],wanted=entry[undo?'before':'after'][id];
  if(base.kind==='active'&&wanted.kind==='active'&&current.kind==='active'){
   if(!equivalent(current.record.review,base.record.review)||!equivalent(current.record.projectGroupId,base.record.projectGroupId))fail('RESTORE_UNSUPPORTED','审核或项目组已改变，当前没有安全逆向契约。');
   const desired=clone(wanted.record.current);
   const layoutIntent=!equivalent(base.record.current.nodes.map(n=>n.id).sort(),desired.nodes.map(n=>n.id).sort())||entry.operations.some(s=>['plan.replace','plan.restoreSnapshot'].includes(s.op));
   if(!layoutIntent)desired.positions=clone(base.record.current.positions);
   const merged=mergeRecovery(base.record.current,desired,current.record.current,{acceptConflicts:accept});
   return {wanted:{...clone(current),record:{...clone(current.record),current:merged.current}},...merged};
  }
  // A creation undone into trash is the same lifecycle basis for a later redo.
  const compatible=base.kind===current.kind||base.kind==='absent'&&current.kind==='trash';
  const lifecycleBasis=base.record?base:wanted;
  if(!compatible||lifecycleBasis.record&&(!equivalent(model(lifecycleBasis),model(current))||!equivalent(lifecycleBasis.record.review,current.record.review)||!equivalent(lifecycleBasis.record.projectGroupId,current.record.projectGroupId)))fail('RESTORE_UNSUPPORTED','计划已被其他人修改或状态变化，不能整计划删除或恢复。');
  return {wanted,conflicts:[],changes:businessDiff(model(current),model(wanted)),structural:true,lifecycle:true,layoutChanged:false};
 }
 async preview(actor,p,direction){
  const state=await this.state(actor);if(state.pending)fail('HISTORY_SNAPSHOT_INCOMPLETE','有待核对的批次，请先核对原请求。');
  const {indices,undo,destination}=this.path(state,p,direction),latest={},virtual={},changes=[],errors=[];
  for(const index of indices){const entry=state.entries[index];for(const id of Object.keys(entry.before)){
   if(state.partial?.outcomes?.some(o=>o.parent===entry.historyId&&o.targetId===id&&o.status==='success'))continue;
   if(!latest[id])latest[id]=await this.read(id);const current=virtual[id]||latest[id];
   try{const c=this.candidate(entry,id,current,undo,true);changes.push({historyId:entry.historyId,targetId:id,diff:businessDiff(model(current),model(c.wanted)),conflicts:c.conflicts,lifecycle:!!c.lifecycle});virtual[id]=c.wanted;}
   catch(e){errors.push({targetId:id,code:e.code,message:e.message});}
  }}
  return {direction,destination,changes,errors,basis:latest,canRestore:!errors.length,conflicts:changes.flatMap(c=>c.conflicts),reviewToken:await digest({cursor:state.cursor,entries:indices.map(i=>state.entries[i].historyId),latest}),notice:'仅恢复所选路径实际涉及的字段；无关远端修改保留。跨批次/跨计划逐项提交，可能部分成功。'};
 }
 async restore(actor,role,p,requestId,direction){
  const preview=await this.preview(actor,p,direction);
  const accepted=p.reviewToken===preview.reviewToken;
  if(p.reviewToken&&!accepted)fail('HISTORY_REVIEW_REQUIRED','网站内容已变化，请重新查看差异。');
  if(preview.errors.length)fail(preview.errors[0].code,preview.errors[0].message);
  if(preview.conflicts.length&&!accepted)return {status:'failed',outcomes:[{status:'failed',code:direction==='redo'?'REDO_CONFLICT':'UNDO_CONFLICT',message:'相同字段被其他修改影响，请查看三方差异后选择。',diff:preview.conflicts}],preview};
  const state=await this.state(actor),{indices,undo}=this.path(state,p,direction);
  if(state.partial&&state.partial.direction!==direction)fail('HISTORY_SNAPSHOT_INCOMPLETE','部分恢复尚未处理，请继续同方向或核对后保留现状。');
  const outcomes=state.partial?.outcomes.filter(x=>x.status==='success')||[];
  for(const index of indices){const entry=state.entries[index];let failed=false;
   for(const id of Object.keys(entry.before)){
    if(outcomes.some(o=>o.parent===entry.historyId&&o.targetId===id&&o.status==='success'))continue;
    try{
     const current=await this.read(id),c=this.candidate(entry,id,current,undo,accepted),wanted=c.wanted;
     // A reviewed conflict may only be applied to the exact version reviewed above.
     if(accepted&&!sameState(current,preview.basis[id]))fail('HISTORY_REVIEW_REQUIRED','网站内容已变化，请重新查看差异。');
     if(c.conflicts.length&&!accepted)throw Object.assign(Error('相同字段发生变化，未覆盖。'),{code:undo?'UNDO_CONFLICT':'REDO_CONFLICT',diff:c.conflicts});
     const owner=current.record?.current?.planOwner||current.record?.planOwner||wanted.record?.current?.planOwner;if(role!=='admin'&&owner!==actor)fail('PERMISSION_DENIED');
     if(current.kind==='active'&&wanted.kind==='active'&&equivalent(model(current),model(wanted))){outcomes.push({targetId:id,parent:entry.historyId,status:'success',serverVerified:true,noChange:true});continue;}
     state.pending={requestId,parent:entry.historyId,targetId:id,before:{[id]:current},startedAt:new Date().toISOString(),recovery:true};await this.save(actor,state);
     const path='/api/plans/'+encodeURIComponent(id),operation=await operationId(requestId,index+':'+id);let written;
     if(wanted.kind!=='active'&&current.kind==='active')written=await this.request(path+'/trash','POST',{baseRevision:current.revision,operation});
     else if(wanted.kind==='active'&&current.kind==='trash'){
      const list=await this.request('/api/plans');if(list.some(x=>x.id!==id&&x.planNumber===wanted.record.current.planNumber))fail('UNDO_CONFLICT','相同编号已被占用');
      written=await this.request(path+'/undelete','POST',{baseRevision:current.revision,operation});
     }else if(wanted.kind==='active'&&current.kind==='active')written=await this.request(path+'/import','POST',{baseRevision:current.revision,current:wanted.record.current,operation});
     else fail('RESTORE_UNSUPPORTED','目标已缺失或没有可用恢复接口');
     const after=await this.read(id);if(after.kind!==(wanted.kind==='absent'?'trash':wanted.kind)||after.revision!==written.revision)fail('SERVER_NOT_CONFIRMED','恢复后的状态或版本尚未确认');
     let verification;if(wanted.kind==='active'){
      verification=verifySaved(wanted.record.current,after.record.current,{strictLayout:c.layoutChanged});
      if(!equivalent(after.record.review,wanted.record.review)||!equivalent(after.record.projectGroupId,wanted.record.projectGroupId))fail('SERVER_NOT_CONFIRMED','恢复后的审核或项目组发生变化');
     }
     preview.basis[id]=after;state.expected[id]=after;state.pending=null;outcomes.push({targetId:id,status:'success',serverVerified:true,parent:entry.historyId,verification});await this.save(actor,state);
    }catch(e){failed=true;let latest;try{latest=await this.read(id);}catch{}outcomes.push({targetId:id,status:'failed',code:e.code||'RESTORE_FAILED',message:e.message,diff:e.diff,verification:e.verification,latest,parent:entry.historyId,outcome:state.pending&&!['VERSION_CONFLICT','PERMISSION_DENIED','HISTORY_CONTEXT_MISMATCH','HISTORY_REVIEW_REQUIRED'].includes(e.code)?'unconfirmed':'not_executed'});if(['UNDO_CONFLICT','REDO_CONFLICT','PERMISSION_DENIED','RESTORE_UNSUPPORTED','VERSION_CONFLICT','HISTORY_CONTEXT_MISMATCH','HISTORY_REVIEW_REQUIRED'].includes(e.code))state.pending=null;if(state.pending)break;}
   }
   if(failed){state.partial={requestId,direction,outcomes:outcomes.filter(x=>x.status==='success')};await this.save(actor,state);return {status:outcomes.some(x=>x.status==='success')?(undo?'partial_undo':'partial_redo'):'failed',outcomes,cursor:state.cursor,notice:'已成功目标保留；未确认结果需核对，不自动重发。'};}
   state.cursor+=undo?-1:1;delete state.partial;await this.save(actor,state);
  }
  return {status:'success',outcomes,cursor:state.cursor};
 }
}
