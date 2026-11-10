import {fail,assert,clone,edge,nativePlan,validatePlan,validDate,equivalent,operationId} from './core.js';
import {validateStep} from './validation.js';
import {auditGraph,simplifyDummies,expectedDuration} from './graph.js';
import {mergeTasks,splitTask} from './task-transform.js';
import {editNodes,planDiff,requestedChanges} from './local-edits.js';
export const reads={'plan.list':'/api/plans','project.list':'/api/project-groups','group.list':'/api/visibility-groups','task.list':'/api/work-tasks','site.session':'/api/session','user.list':'/api/assignees'};
export const writes=['plan.create','plan.update','plan.replace','plan.copy','plan.archive','plan.delete','plan.restore','node.create','node.update','node.remove','node.reorder','edge.create','edge.update','edge.remove','schedule.updateInputs','progress.update','progress.complete','review.submit','review.approve','review.reject','history.restore','project.create','project.assignPlan','group.create','group.update','group.remove','group.assign'];
writes.push('plan.restoreSnapshot','node.batchUpdate','node.renumber');
writes.push('graph.simplify');
writes.push('task.merge','task.split');
writes.push('task.assign','task.updateStatus');
export class ApiAdapter{
 constructor(request,options={}){this.request=request;this.options=options;}
 async resolve(t={}){if(t.id)return t.id;assert(typeof t.number==='string','target.id 或 number 必填');const items=(await this.request('/api/plans')).filter(p=>p.planNumber===t.number&&(!t.owner||p.planOwner===t.owner));if(items.length!==1)fail(items.length?'TARGET_AMBIGUOUS':'TARGET_NOT_FOUND');return items[0].id;}
 async run(s,e){
  const trace={};try{return await this.runInternal(s,e,trace);}catch(error){
   if(writes.includes(s.op)){
    const conflict=error.code==='VERSION_CONFLICT';
    error.outcome=conflict||['PERMISSION_DENIED','NOT_LOGGED_IN','INVALID_SCHEMA','INVALID_SITE_DATA'].includes(error.code)||!trace.submitted?'not_executed':'unconfirmed';
    if(conflict||trace.submitted){
     try{const id=trace.id||await this.resolve(s.target);const latest=await this.request('/api/plans/'+encodeURIComponent(id));
      error.diagnostic={status:'read',latestVersion:latest.revision,latest,changedSinceRead:trace.before?planDiff(trace.before.current,latest.current):null,requestedFields:requestedChanges(s,latest.current),basisNote:trace.before?.revision===s.target?.version?'列出执行前读取与冲突后回读差异':'旧版本全文未提供，不能断言哪些字段发生冲突；列出拟改字段的最新值，请核对',choices:['保留网站最新内容，重新生成局部修改','核对冲突字段后提出新的明确修改'],automaticRetry:false};
     }catch(readError){error.diagnostic={status:'failed',code:readError.code||'READ_FAILED',automaticRetry:false};}
     if(conflict)error.message='网站上的计划刚刚发生了变化，本次修改未执行。'+(error.diagnostic.status==='read'?'已读取最新内容，请查看差异。':'最新内容暂未读到，请稍后只读查询。');
    }
   }throw error;
  }
 }
 async runInternal(s,e,trace){validateStep(s);const p=s.params||{},t=s.target||{},op=s.op;
 if(op==='plan.delete'&&p.permanent)fail('UNSUPPORTED_BY_SITE','已核实前端仅有 trash/undelete；未发现硬删接口');
 const isWrite=writes.includes(op);if(!isWrite&&!reads[op]&&!['plan.get','plan.export','node.list','edge.list','progress.read','review.status','history.list','graph.inspect'].includes(op))fail('UNSUPPORTED_BY_SITE','未核实此操作的真实站点契约');
 if(e.mode==='validate')return {data:{valid:true,contract:'frontend-observed',authorization:'not_checked'},serverVerified:false};
 const session=await this.request('/api/session');
 if(!session.actor)fail('NOT_LOGGED_IN');if(session.mustChangePassword)fail('PERMISSION_DENIED','请先在网站完成密码设置');
 if((op.startsWith('group.')||['review.approve','review.reject'].includes(op))&&session.role!=='admin')fail('PERMISSION_DENIED');
 if(reads[op])return {data:await this.request(reads[op]),serverVerified:true};
 if(['task.assign','task.updateStatus'].includes(op)){
 const planId=await this.resolve(t),items=await this.request('/api/work-tasks');
 const matches=items.filter(x=>x.planId===planId&&x.from===p.fromNodeId&&x.to===p.toNodeId);
 if(matches.length!==1)fail(matches.length?'TARGET_AMBIGUOUS':'TARGET_NOT_FOUND','工作任务表未找到唯一任务；任务可能尚不满足网站展示条件');
 const item=matches[0],assign=op==='task.assign',field=assign?'executor':'completedAt',value=assign?p.executor:p.actualCompleteDate;
 if(!(assign?item.canAssign:item.canComplete))fail('PERMISSION_DENIED');
 if(t.version!==undefined&&t.version!==item.revision)fail('VERSION_CONFLICT');
 if(!assign)assert(validDate(value),'完成日期无效');
 if(e.mode==='preview')return {data:{before:item[field],after:value,field},serverVerified:false};
 if(e.execution?.backup)fail('UNSUPPORTED_BY_SITE','工作任务表不支持快照恢复，未写入');
 trace.submitted=true;trace.id=planId;await this.request('/api/work-tasks/update','POST',{planId,index:item.index,from:item.from,to:item.to,field,value,baseRevision:item.revision,operation:await operationId(e.requestId,s.id)});
 const after=(await this.request('/api/work-tasks')).find(x=>x.planId===planId&&x.from===item.from&&x.to===item.to);
 if(!after||after[field]!==value)fail('SERVER_NOT_CONFIRMED');
 return {targetId:planId,beforeVersion:item.revision,afterVersion:after.revision,data:after,serverVerified:true};
 }
 let path,id,before,current,backupId,changes;
 if(op==='plan.create'){id=crypto.randomUUID();current=nativePlan(p,session.actor);path='/api/plans';}
 else if(op.startsWith('project.')||op.startsWith('group.')){
 if(e.execution?.backup)fail('UNSUPPORTED_BY_SITE','项目/权限配置快照恢复未核实，未执行写入');
 const endpoint=op.startsWith('project.')?'/api/project-groups':'/api/visibility-groups',actions={'project.create':'create','project.assignPlan':'assign','group.create':'create','group.update':'rename','group.remove':'delete','group.assign':'assign'};
 if(e.mode==='preview')return {data:{endpoint,action:actions[op],params:p},serverVerified:false};
 trace.submitted=true;await this.request(endpoint,'POST',{...p,action:actions[op]});
 const data=await this.request(endpoint),groups=Array.isArray(data)?data:data.groups||[];let verified=false;
 if(op==='project.create')verified=groups.filter(g=>g.number===p.number&&g.name===p.name&&g.owner===p.owner).length===1;
 if(op==='project.assignPlan'){const plans=await this.request('/api/plans');verified=plans.some(x=>x.id===p.planId&&(x.projectGroupId||'')===p.groupId);}
 if(op==='group.create')verified=groups.filter(g=>g.name===p.name).length===1;
 if(op==='group.update')verified=groups.some(g=>g.id===p.groupId&&g.name===p.name);
 if(op==='group.remove')verified=!groups.some(g=>g.id===p.groupId);
 if(op==='group.assign')verified=(data.people||[]).some(x=>x.name===p.name&&(x.groupId||'')===p.groupId);
 if(!verified)fail('SERVER_NOT_CONFIRMED','操作已提交，但列表回读未匹配预期字段');
 return {data,serverVerified:true};
 }else{
 if(op==='plan.restore'){
 assert(typeof t.id==='string'&&t.id,'恢复必须指定稳定 ID');const trash=await this.request('/api/trash'),entry=trash.find(x=>x.id===t.id);if(!entry)fail('TARGET_NOT_FOUND');if(session.role!=='admin'&&entry.planOwner!==session.actor)fail('PERMISSION_DENIED');if(e.mode==='preview')return {data:{operation:op,targetId:t.id,revision:entry.revision},serverVerified:false};trace.submitted=true;trace.id=t.id;const result=await this.request('/api/plans/'+encodeURIComponent(t.id)+'/undelete','POST',{baseRevision:entry.revision,operation:await operationId(e.requestId,s.id)});const after=await this.request('/api/plans/'+encodeURIComponent(t.id));if(after.revision!==result.revision)fail('SERVER_NOT_CONFIRMED');return {targetId:t.id,data:after,serverVerified:true};
 }
 id=await this.resolve(t);path='/api/plans/'+encodeURIComponent(id);before=await this.request(path);current=clone(before.current);
 if(['plan.get','plan.export'].includes(op))return {data:before,serverVerified:true};
 if(op==='graph.inspect')return {data:auditGraph(current),serverVerified:true};
 if(op==='node.list'||op==='edge.list')return {data:current[op==='node.list'?'nodes':'edges'],serverVerified:true};
 if(op==='progress.read'||op==='review.status')return {data:op==='review.status'?before.review:current.edges.map(x=>({from:x.from,to:x.to,completedAt:x.completedAt})),serverVerified:true};
 if(op==='history.list')fail('UNSUPPORTED_BY_SITE','当前前端已禁用逐次编辑历史读取；不能伪造历史');
 if(session.role!=='admin'&&current.planOwner!==session.actor)fail('PERMISSION_DENIED');
 trace.id=id;trace.before=clone(before);
 if(t.versionFrom!==undefined)fail('INVALID_SCHEMA','versionFrom 必须由执行器关联到已确认步骤');
 if(['node.batchUpdate','node.renumber'].includes(op))assert(Number.isInteger(t.version),'局部批量修改必须提供读取依据版本');
 if(t.version!==undefined&&t.version!==before.revision)fail('VERSION_CONFLICT');
 if(op==='graph.simplify')current=simplifyDummies(current).plan;
 if(op==='task.merge'||op==='task.split'){const transformed=(op==='task.merge'?mergeTasks:splitTask)(current,p);current=transformed.plan;changes={...transformed.changes,durationComparison:{beforeDays:expectedDuration(before.current),afterDays:expectedDuration(current),scope:'本地CPM期望工期，不含资源日历；网站日期以回读为准'}};}
 if(op==='plan.copy'){id=crypto.randomUUID();path='/api/plans';current={...current,planNumber:p.number,planOwner:p.owner||session.actor,title:p.title||current.title,baseline:null,edges:current.edges.map(x=>({...x,completedAt:''}))};assert(p.number,'副本需要新 number');}
 if(op==='plan.update'||op==='schedule.updateInputs'){const fields={title:'title',startDate:'start',deadlineDate:'deadline'};for(const [k,v]of Object.entries(p.set||{})){assert(fields[k]&&typeof v==='string','不允许修改字段 '+k);current[fields[k]]=v;}}
 if(op==='plan.replace'){assert(p.replace===true,'全量替换需要 replace:true');current=nativePlan({...p,number:current.planNumber,owner:current.planOwner},session.actor);}
 if(op==='plan.restoreSnapshot'){
 const snapshot=await this.options.loadSnapshot?.(p.backupId);assert(snapshot&&snapshot.targetId===id,'快照不存在或不属于目标计划');
 if(snapshot.actor!==session.actor)fail('PERMISSION_DENIED','不能恢复另一登录身份保存的快照');
 current=clone(snapshot.record.current);assert(current.planOwner===before.current.planOwner&&current.planNumber===before.current.planNumber,'快照身份字段与当前记录不一致');
 }
 if(['node.batchUpdate','node.renumber'].includes(op)){const transformed=editNodes(current,op,p);current=transformed.plan;changes=transformed.changes;}
 if(op.startsWith('node.')&&!['node.batchUpdate','node.renumber'].includes(op)){let index=current.nodes.findIndex(n=>n.id===p.id);if(op==='node.create'){current.nodes.push({id:p.id,name:p.name,content:p.content||'',owner:p.ownerName||''});}else if(op==='node.reorder'){assert(Array.isArray(p.ids)&&p.ids.length===current.nodes.length&&new Set(p.ids).size===p.ids.length&&p.ids.every(x=>current.nodes.some(n=>n.id===x)),'ids 必须是节点全集排列');current.nodes=p.ids.map(id=>current.nodes.find(n=>n.id===id));}else{assert(index>=0,'节点不存在');if(op==='node.remove'){assert(!current.edges.some(x=>x.from===p.id||x.to===p.id),'先删除关联连线');current.nodes.splice(index,1);}else{for(const [k,v]of Object.entries(p.set||{})){assert(['name','content','owner'].includes(k)&&typeof v==='string','节点字段无效');current.nodes[index][k]=v;}}}}
 if(op.startsWith('edge.')||op.startsWith('progress.')){let i=current.edges.findIndex(x=>x.from===p.fromNodeId&&x.to===p.toNodeId);if(op==='edge.create')current.edges.push(edge(p));else{assert(i>=0,'连线不存在');if(op==='edge.remove')current.edges.splice(i,1);else if(op.startsWith('progress.')){assert(typeof p.actualCompleteDate==='string','需要 actualCompleteDate');current.edges[i].completedAt=p.actualCompleteDate;}else{const x=current.edges[i];if(p.estimateDays)x.upper=edge({...p}).upper;if(p.dashed!==undefined){assert(typeof p.dashed==='boolean','dashed 必须 boolean');x.dashed=p.dashed;}if(p.executor!==undefined)x.executor=p.executor;}}}
 }
 if(op==='edge.update'){const changed=current.edges.find(x=>x.from===p.fromNodeId&&x.to===p.toNodeId);assert(!changed.dashed||changed.upper.split('-').every(x=>Number(x)===0),'虚任务必须是零耗时，请明确设置estimateDays三个0');}
 validatePlan(current);assert(validDate(current.start)&&validDate(current.deadline)&&current.edges.every(x=>validDate(x.completedAt||'')),'日期无效');if(e.mode==='preview')return {data:{before:before?.current||null,after:current,operation:op,rollback:'not_guaranteed',changes:changes||planDiff(before?.current,current)},serverVerified:false};
 if(e.execution?.backup&&before){if(!this.options.saveSnapshot)fail('UNSUPPORTED_BY_SITE','快照存储不可用，未写入');backupId=e.requestId+':'+s.id;await this.options.saveSnapshot(backupId,{actor:session.actor,targetId:before.id||id,record:before,createdAt:new Date().toISOString()});}
 const operation=await operationId(e.requestId,s.id);let body={baseRevision:before?.revision,current,operation};
 if(path==='/api/plans')body={id,current,...(op==='plan.copy'?{copySourceId:before.id}:{})};
 else if(['plan.archive','plan.delete','plan.restore','review.submit','review.approve','review.reject','history.restore'].includes(op)){path+={'plan.archive':'/trash','plan.delete':'/trash','plan.restore':'/undelete','review.submit':'/submit','review.approve':'/review','review.reject':'/review','history.restore':'/restore'}[op];body={baseRevision:before.revision,operation};if(op.startsWith('review.')&&op!=='review.submit'){body.decision=op.split('.')[1];body.note=p.note||'';if(body.decision==='reject')assert(body.note.trim(),'退回需要 note');}if(op==='history.restore'){assert(Number.isInteger(p.targetRevision),'targetRevision 必须整数');body.targetRevision=p.targetRevision;}}
 else path+=['plan.replace','plan.restoreSnapshot','task.split','node.reorder','node.batchUpdate','node.renumber'].includes(op)?'/import':'/change';
 trace.id=id;trace.submitted=true;const written=await this.request(path,'POST',body);
 if(op==='plan.archive'||op==='plan.delete'){const trash=await this.request('/api/trash');if(!trash.some(x=>x.id===id))fail('SERVER_NOT_CONFIRMED','垃圾桶回读未找到目标');return {targetId:id,serverVerified:true,...(backupId?{backupId}:{}),data:{recoverable:true}};}
 const after=await this.request('/api/plans/'+encodeURIComponent(id));if(after.revision!==written.revision)fail('SERVER_NOT_CONFIRMED','回读版本不一致');
 if(path.endsWith('/change')||path==='/api/plans'||path.endsWith('/import'))for(const k of ['title','planOwner','planNumber','start','deadline','nodes','edges','positions','baseline'])if(!equivalent(after.current[k],current[k]))fail('SERVER_NOT_CONFIRMED','回读字段不一致：'+k);
 return {targetId:id,serverVerified:true,...(backupId?{backupId}:{}),...(changes?{changes}:{}),beforeVersion:before?.revision,afterVersion:after.revision,data:after};
 }
}
