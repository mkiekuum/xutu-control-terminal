import {ApiAdapter} from './api.js';
import {auditGraph} from './graph.js';
import {parameterSchemas} from './validation.js';
import {fail,VERSION} from './core.js';
import {websiteGuide} from './website-guide.js';
import {aiInstructions,buildIntake} from './ai-brief.js';
export async function collectContext(request,target){
 const session=await request('/api/session');if(!session.actor)fail('NOT_LOGGED_IN');
 const context={schema:'xutu.context/v1',extensionVersion:VERSION,capturedAt:new Date().toISOString(),clientTimeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||null,account:{actor:session.actor,role:session.role,mustChangePassword:!!session.mustChangePassword},target:null,plan:null,complete:false,warnings:[],commandContract:{protocol:'xutu.command/v1',parameters:Object.fromEntries(Object.entries(parameterSchemas).filter(([op])=>op!=='script.execute'&&op!=='history.list'))},rules:{unit:'days',virtualTasks:'zero duration',numbering:'preserve plan number and retained node IDs',dependencies:'avoid redundant transitive dummy edges',write:'read latest context before changing; target.version must equal revision',unavailable:['permanent deletion','full revision history','user/role management','appearance','AI API','MCP']}};
 context.websiteGuide=websiteGuide;
 if(!target?.id&&!target?.number){context.warnings.push('当前网页未选中计划；先选计划或传target.id/number。');context.aiGuidance={instructions:aiInstructions,intake:buildIntake(context)};return context;}
 const api=new ApiAdapter(request),id=await api.resolve(target),record=await request('/api/plans/'+encodeURIComponent(id));
 context.target={id,number:record.current.planNumber,owner:record.current.planOwner,version:record.revision};context.plan=record;
 const editable=session.role==='admin'||record.current.planOwner===session.actor;
 context.permissions={canRequestPlanEdit:editable&&!session.mustChangePassword,canRequestReview:session.role==='admin',canSubmitReview:editable&&!session.mustChangePassword,canApproveRejectReview:session.role==='admin'&&!session.mustChangePassword,serverAuthoritative:true};
 context.status={review:record.review||null,hasBaseline:!!record.current.baseline,completedEdges:record.current.edges.filter(e=>e.completedAt).length,totalEdges:record.current.edges.length,calculationNote:'原始完成日期和基线见plan；计数不是网站评分或工期。'};
 try{context.dependencyAudit=auditGraph(record.current);}catch(e){context.warnings.push('依赖检查失败：'+e.message);}
 const extra=await Promise.allSettled([request('/api/work-tasks'),request('/api/plans/'+encodeURIComponent(id)+'/forecast-log')]);
 if(extra[0].status==='fulfilled'){context.workTasks=extra[0].value.filter(t=>t.planId===id);if(context.workTasks.some(t=>t.revision!==record.revision))context.warnings.push('任务表版本与计划版本不同，修改前重新读取。');}else context.warnings.push('工作任务表读取失败，不能认定执行人权限或状态完整。');
 if(extra[1].status==='fulfilled')context.forecastHistory=extra[1].value;else context.warnings.push('预计完成日期记录读取失败。');
 const latest=await request('/api/plans/'+encodeURIComponent(id));if(latest.revision!==record.revision)context.warnings.push('读取过程中计划版本变化，修改前重新读取上下文。');
 context.complete=context.warnings.length===0;context.aiGuidance={instructions:aiInstructions,intake:buildIntake(context)};return context;
}
