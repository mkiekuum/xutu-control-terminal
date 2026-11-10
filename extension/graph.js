import {clone,validatePlan} from './core.js';
function hasAlternate(edges,excluded){
 const edge=edges[excluded],seen=new Set([edge.from]),queue=[edge.from];
 for(let i=0;i<queue.length;i++)for(let j=0;j<edges.length;j++){const next=edges[j];if(j===excluded||next.from!==queue[i]||seen.has(next.to))continue;if(next.to===edge.to)return true;seen.add(next.to);queue.push(next.to);}return false;
}
function duration(e){const a=e.upper.split('-').map(Number),t=a.length===1?[a[0],a[0],a[0]]:a;return t[0]/6+t[1]*4/6+t[2]/6;}
export function auditGraph(plan){
 validatePlan(plan);const findings=[],incoming=id=>plan.edges.filter(e=>e.to===id),outgoing=id=>plan.edges.filter(e=>e.from===id);
 const starts=plan.nodes.filter(n=>!incoming(n.id).length).map(n=>n.id),ends=plan.nodes.filter(n=>!outgoing(n.id).length).map(n=>n.id);
 if(starts.length!==1||ends.length!==1)findings.push({code:'BOUNDARY_NODES',starts,ends,message:'质量建议：使用唯一开始与结束；多起止可用零耗时虚任务连接，不增加不存在的业务依赖。'});
 plan.edges.forEach((e,i)=>{const days=duration(e);if(e.dashed&&days!==0)findings.push({code:'DUMMY_HAS_DURATION',from:e.from,to:e.to,message:'虚任务应为零耗时；不会自动清空已有估时。'});if(days>14)findings.push({code:'LONG_TASK',from:e.from,to:e.to,days,message:'平均耗时超过14天，建议按可验收成果分解；不机械等分耗时。'});if(hasAlternate(plan.edges,i))findings.push({code:'TRANSITIVE_EDGE',from:e.from,to:e.to,safeToRemove:e.dashed&&days===0,message:e.dashed&&days===0?'已有替代路径，可移除这条零耗时虚依赖。':'已有替代路径，但此边可能是独立工作；需核对，不能自动删除。'});});
 for(const n of plan.nodes){const ins=incoming(n.id),outs=outgoing(n.id);if(ins.length===1&&outs.length===1&&!/验收|评审|交付|里程碑|发布|完成/.test(n.name)){const before=plan.nodes.find(x=>x.id===ins[0].from),after=plan.nodes.find(x=>x.id===outs[0].to);if(n.owner&&before?.owner===n.owner&&after?.owner===n.owner&&outgoing(before.id).length===1&&incoming(after.id).length===1)findings.push({code:'MERGE_CANDIDATE',nodeId:n.id,message:'同负责人且连续串行，可评估合并；保留独立验收点，不自动改编号。'});}}
 return {findings,numbering:{preserved:true,planNumber:plan.planNumber,nodeIds:plan.nodes.map(n=>n.id)},advisory:true,siteScore:'not_calculated'};
}
export function simplifyDummies(plan){
 const result=clone(plan);validatePlan(result);const removed=[];
 for(let i=result.edges.length-1;i>=0;i--){const e=result.edges[i];if(e.dashed&&duration(e)===0&&hasAlternate(result.edges,i)){removed.push({from:e.from,to:e.to});result.edges.splice(i,1);}}
 return {plan:result,removed,nodeIdsUnchanged:true,warning:'仅移除有替代路径的零耗时虚边；不自动合并工作、改变编号或修改用时。'};
}

// CPM expectation only, not a resource calendar or the website's displayed finish date.
export function expectedDuration(plan){
 validatePlan(plan);const times=new Map(plan.nodes.map(n=>[n.id,0])),remaining=new Map(plan.nodes.map(n=>[n.id,plan.edges.filter(e=>e.to===n.id).length]));const queue=plan.nodes.filter(n=>!remaining.get(n.id)).map(n=>n.id);
 for(let i=0;i<queue.length;i++)for(const edge of plan.edges.filter(e=>e.from===queue[i])){times.set(edge.to,Math.max(times.get(edge.to),times.get(edge.from)+duration(edge)));remaining.set(edge.to,remaining.get(edge.to)-1);if(!remaining.get(edge.to))queue.push(edge.to);}
 return Math.max(0,...times.values());
}
