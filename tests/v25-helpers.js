import {nativePlan,fail,Executor} from '../extension/core.js';
import {ApiAdapter} from '../extension/api.js';
import {HistoryManager,isBusinessWrite} from '../extension/history.js';
export const memory=()=>{const m=new Map();return {get:async k=>structuredClone(m.get(k)),set:async(k,v)=>m.set(k,structuredClone(v)),remove:async k=>m.delete(k),m};};
export const envelope=(steps,extra={})=>({protocol:'xutu.command/v1',requestId:crypto.randomUUID(),steps,...extra});
export function site(){
 const records=new Map(),trash=new Map(),calls=[],groups=[{id:'G1',number:'PRJ-0097',name:'Synthetic group',owner:'USER_A'}];let actor='USER_A',denyGroup=false,beforePost;
 const add=(id)=>{const current=nativePlan({title:'Synthetic '+id,number:id,nodes:[{id:'1',name:'需求确定',content:'型号 A12、数量20、日期2026-11-12',ownerName:'USER_A'},{id:'2',name:'验收完成'}],edges:[{fromNodeId:'1',toNodeId:'2',estimateDays:{minimum:1,likely:2,maximum:3},executor:'USER_A'}]},actor);current.positions={'1':{x:1,y:2},'2':{x:3,y:4}};records.set(id,{id,revision:1,current,review:{status:'draft'},projectGroupId:''});};
 const request=async(path,method='GET',body)=>{
  calls.push({path,method,body:structuredClone(body)});
  if(path==='/api/session')return {actor,role:'user'};
  if(path==='/api/assignees')return ['USER_A','USER_B'];
  if(path==='/api/work-tasks'||path.endsWith('/forecast-log'))return [];
  if(path==='/api/trash')return structuredClone([...trash.values()]);
  if(path==='/api/project-groups'){if(method==='POST'){if(denyGroup)fail('PERMISSION_DENIED');if(body.action==='assign'){const r=records.get(body.planId);r.projectGroupId=body.groupId;}else groups.push({id:'G2',...body});}return structuredClone(groups);}
  if(path==='/api/plans'&&method==='GET')return [...records.values()].map(r=>({id:r.id,revision:r.revision,planNumber:r.current.planNumber,planOwner:r.current.planOwner,projectGroupId:r.projectGroupId}));
  if(path==='/api/plans'&&method==='POST'){await beforePost?.(path,body);if([...records.values()].some(r=>r.current.planNumber===body.current.planNumber))fail('PLAN_NUMBER_CONFLICT');records.set(body.id,{id:body.id,revision:1,current:structuredClone(body.current),review:{status:'draft'},projectGroupId:''});return {revision:1};}
  const [,id,action]=path.match(/^\/api\/plans\/([^/]+)(?:\/(.*))?$/)||[];if(!id)fail('UNSUPPORTED_BY_SITE',path);
  if(method==='GET'){if(trash.has(id))fail('TARGET_TRASHED');if(!records.has(id))fail('TARGET_NOT_FOUND');return structuredClone(records.get(id));}
  await beforePost?.(path,body);const r=records.get(id)||trash.get(id);if(!r)fail('TARGET_NOT_FOUND');if(r.current.planOwner!==actor)fail('PERMISSION_DENIED');if(body.baseRevision!==r.revision)fail('VERSION_CONFLICT');r.revision++;
  if(action==='trash'){records.delete(id);r.planOwner=r.current.planOwner;trash.set(id,r);}else if(action==='undelete'){trash.delete(id);records.set(id,r);}else if(['import','change'].includes(action))r.current=structuredClone(body.current);else if(action==='submit')r.review={status:'submitted'};else fail('UNSUPPORTED_BY_SITE');return {revision:r.revision};
 };
 return {records,trash,calls,groups,request,add,set actor(value){actor=value;},get actor(){return actor;},set denyGroup(value){denyGroup=value;},set beforePost(value){beforePost=value;}};
}
export function integrated(site,store=memory()){
 const history=new HistoryManager(store,site.request),api=new ApiAdapter(site.request),jobs=memory();
 const executor=new Executor(jobs,async(s,e,p)=>{const result=await api.run(await history.protectStep(s,p),e);await history.trackStep(result,p);return result;},{before:async e=>e.steps.some(isBusinessWrite)&&!['preview','validate'].includes(e.mode)?await history.prepare(site.actor,e):null,after:async(e,r,p)=>p?history.finish(site.actor,p,e,r):undefined});
 return {history,executor,store,jobs};
}
export const rename=(id,title,version)=>({id:'edit'+id,op:'plan.update',target:{id,...(version!==undefined?{version}:{})},params:{set:{title}}});
