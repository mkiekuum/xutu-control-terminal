import {assert,clone,validatePlan,equivalent} from './core.js';

// Local transforms over a freshly read native snapshot. No new server endpoint.
export function editNodes(plan,op,p){
 const result=clone(plan),changes={names:0,mapping:[],preserved:['planNumber','planOwner','dates','durations','people','dependencies','progress','baseline','layout']};
 if(op==='node.batchUpdate'){
  assert(p.updates.length>0&&new Set(p.updates.map(n=>n.id)).size===p.updates.length,'修改列表不能为空或重复');
  for(const update of p.updates){const node=result.nodes.find(n=>n.id===update.id);assert(node,'节点不存在：'+update.id);assert(Object.keys(update.set).length>0,'修改字段不能为空');for(const[k,v]of Object.entries(update.set)){if(k==='name'&&node[k]!==v)changes.names++;node[k]=v;}}
 }else{
  const map=new Map(p.mapping.map(m=>[m.from,m.to])),ids=new Set(result.nodes.map(n=>n.id));
  assert(map.size===p.mapping.length&&map.size>0,'编号映射不能为空或重复');
  for(const [from,to]of map){assert(ids.has(from),'旧编号不存在：'+from);assert(!['__proto__','constructor','prototype'].includes(to),'不安全编号');}
  assert(new Set(result.nodes.map(n=>map.get(n.id)||n.id)).size===ids.size,'新编号与保留编号冲突');
  // Baseline is historical date metadata in the observed model, not a second graph.
  assert(!result.baseline||Object.keys(result.baseline).every(k=>['confirmedAt','forecastDate'].includes(k)),'基线包含未核实的引用结构；未执行重编号');
  const rename=id=>map.get(id)||id;
  for(const node of result.nodes){node.id=rename(node.id);for(const field of ['name','content'])if(typeof node[field]==='string')node[field]=node[field].replace(/\[\[node:([^\]]+)\]\]/g,(all,id)=>map.has(id)?'[[node:'+rename(id)+']]':all);}
  for(const edge of result.edges){edge.from=rename(edge.from);edge.to=rename(edge.to);}
  assert(new Set(Object.keys(result.positions||{}).map(rename)).size===Object.keys(result.positions||{}).length,'布局键映射冲突，请先核对');
  result.positions=Object.fromEntries(Object.entries(result.positions||{}).map(([id,value])=>[rename(id),value]));
  // Natural language references require exact, explicitly authorized text edits; never replace bare numbers.
  for(const ref of p.references||[]){const node=result.nodes.find(n=>n.id===rename(ref.nodeId));assert(node&&node[ref.field]===ref.before,'引用原文已变化，请重新核对');node[ref.field]=ref.after;}
  changes.mapping=p.mapping;changes.references='连线、坐标及 [[node:编号]] 明确引用已同步；普通文字仅按 references 精确修改';
 }
 validatePlan(result);return {plan:result,changes};
}
export function planDiff(before,after){
 const fields=['title','start','deadline','planNumber','planOwner','baseline','positions'];
 const changedFields=fields.filter(k=>!equivalent(before?.[k],after?.[k]));
 const nodes=after?.nodes||[],old=before?.nodes||[];
 const names=nodes.filter(n=>old.some(o=>o.id===n.id&&o.name!==n.name)).length;
 return {changedFields,renamedNodes:names,nodesChanged:!equivalent(old,nodes),edgesChanged:!equivalent(before?.edges,after?.edges),layoutChanged:!equivalent(before?.positions,after?.positions)};
}

export function requestedChanges(step,plan){
 const p=step.params||{};
 if(['node.update','node.batchUpdate'].includes(step.op))return (p.updates||[{id:p.id,set:p.set}]).flatMap(u=>Object.entries(u.set||{}).map(([field,value])=>({nodeId:u.id,field,latest:plan.nodes.find(n=>n.id===u.id)?.[field],requested:value})));
 if(['plan.update','schedule.updateInputs'].includes(step.op))return Object.entries(p.set||{}).map(([field,value])=>({field,latest:plan[{startDate:'start',deadlineDate:'deadline'}[field]||field],requested:value}));
 return {operation:step.op,mapping:p.mapping||null};
}
