import {assert,clone,edge,validatePlan,fail} from './core.js';
// Decimal addition stays exact, even for sub-day estimates such as 0.1 + 0.2.
function triplet(e){const t=e.upper.split('-');return t.length===1?[t[0],t[0],t[0]]:t;}
export function sumDecimal(values){
 const scale=Math.max(...values.map(x=>(x.split('.')[1]||'').length));
 const total=values.reduce((sum,x)=>{const [a,b='']=x.split('.');return sum+BigInt(a+b.padEnd(scale,'0'));},0n).toString().padStart(scale+1,'0');
 return scale?(total.slice(0,-scale)+'.'+total.slice(-scale)).replace(/\.?0+$/,''):total;
}
function checkEditable(plan,edges){
 if(plan.baseline)fail('TASK_TRANSFORM_CONFLICT','已建立基线的计划须先通过网站允许的修订流程；不能静默清空审核或进度');
 assert(edges.every(e=>!e.completedAt),'已完成任务不能直接合并或拆分，以免丢失进度');
}
export function mergeTasks(plan,p){
 validatePlan(plan);const result=clone(plan),ids=p.nodeIds;
 assert(Array.isArray(ids)&&ids.length>=3&&new Set(ids).size===ids.length,'nodeIds须依次包含至少三个不重复的链节点');
 const nodes=ids.map(id=>result.nodes.find(n=>n.id===id));assert(nodes.every(Boolean),'合并节点不存在');
 const chain=ids.slice(1).map((id,i)=>result.edges.find(e=>e.from===ids[i]&&e.to===id));assert(chain.every(Boolean),'合并目标必须是依次相连的任务链');checkEditable(plan,chain);
 const middle=new Set(ids.slice(1,-1));
 for(const id of middle){assert(result.edges.filter(e=>e.to===id).length===1&&result.edges.filter(e=>e.from===id).length===1,'中间节点存在分支或外部依赖，不能直接折叠');const n=nodes.find(n=>n.id===id);assert(p.allowMilestones||!/验收|评审|交付|里程碑|发布|完成/.test(n.name),'包含独立里程碑；需显式allowMilestones:true');}
 assert(!result.edges.some(e=>e.from===ids[0]&&e.to===ids.at(-1)),'首尾已有直接连线，请先明确该连线是否应删除');
 const owners=new Set(nodes.slice(1).map(n=>n.owner||'')),executors=new Set(chain.map(e=>e.executor||''));
 assert(owners.size<=1||p.owner!==undefined,'负责人不同，需明确合并后的owner');assert(executors.size<=1||p.executor!==undefined,'执行人不同，需明确合并后的executor');
 const merged={...clone(chain.at(-1)),from:ids[0],to:ids.at(-1),upper:[0,1,2].map(i=>sumDecimal(chain.map(e=>triplet(e)[i]))).join('-'),dashed:chain.every(e=>e.dashed),completedAt:''};
 if(p.executor!==undefined)merged.executor=p.executor;
 const last=nodes.at(-1);last.content=p.content??nodes.slice(1).map(n=>n.name+(n.content?'：'+n.content:'')).join('\n');last.name=p.name;if(p.owner!==undefined)last.owner=p.owner;
 result.nodes=result.nodes.filter(n=>!middle.has(n.id));result.edges=result.edges.filter(e=>!chain.includes(e));result.edges.push(merged);
 for(const id of middle)if(result.positions)delete result.positions[id];validatePlan(result);
 return {plan:result,changes:{removedNodeIds:[...middle],retainedBoundaryIds:[ids[0],ids.at(-1)],estimateDays:merged.upper,numbering:'计划编号及未删除节点ID保留；网站按行显示序号可能变化'}};
}
export function splitTask(plan,p){
 validatePlan(plan);const result=clone(plan),source=result.edges.find(e=>e.from===p.fromNodeId&&e.to===p.toNodeId);assert(source,'待拆分连线不存在');checkEditable(plan,[source]);
 assert(p.nodes.length>=1&&p.segments.length===p.nodes.length+1,'N个新节点需要N+1段估时');
 assert(p.nodes.every(n=>!result.nodes.some(old=>old.id===n.id)),'新增节点编号与现有节点重复');
 const ids=[source.from,...p.nodes.map(n=>n.id),source.to];
 const pieces=p.segments.map((s,i)=>edge({...s,fromNodeId:ids[i],toNodeId:ids[i+1],executor:s.executor??source.executor,dashed:s.dashed??source.dashed}));
 const sums=[0,1,2].map(i=>sumDecimal(pieces.map(e=>triplet(e)[i])));
 assert(p.allowDurationChange||sums.every((x,i)=>Number(x)===Number(triplet(source)[i])),'拆分估时之和不等于原三点估时；调整工期需allowDurationChange:true');
 const index=result.nodes.findIndex(n=>n.id===source.to);result.nodes.splice(index,0,...p.nodes.map(n=>({id:n.id,name:n.name,content:n.content||'',owner:n.ownerName||''})));
 result.edges=result.edges.filter(e=>e!==source);result.edges.push(...pieces);validatePlan(result);
 return {plan:result,changes:{addedNodeIds:p.nodes.map(n=>n.id),retainedBoundaryIds:[source.from,source.to],beforeEstimate:source.upper,afterEstimate:sums.join('-')}};
}
