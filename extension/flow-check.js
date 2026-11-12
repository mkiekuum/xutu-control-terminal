import {validatePlan,equivalent} from './core.js';

const key=(a,b)=>JSON.stringify([a,b]);
const triplet=e=>{const t=String(e.upper).split('-').map(Number);return t.length===1?[t[0],t[0],t[0]]:t;};
const wanted=e=>[e.minimum,e.likely,e.maximum];
const positive=e=>triplet(e).some(n=>n>0);
function ancestors(nodes,edges){
 const incoming=new Map(nodes.map(n=>[n.id,[]]));
 for(const e of edges)incoming.get(e.to).push(e.from);
 const result=new Map();
 for(const n of nodes){const seen=new Set(),queue=[...incoming.get(n.id)];for(let i=0;i<queue.length;i++){const id=queue[i];if(seen.has(id))continue;seen.add(id);queue.push(...incoming.get(id));}result.set(n.id,seen);}
 return result;
}
const difference=(a,b)=>[...a].filter(x=>!b.has(x));

// This checks an explicit transcription supplied with a command, not image recognition
// or proof that an AI's transcription was approved by a human. It never mutates a plan.
export function inspectFlow(reference,plan){
 validatePlan(plan);
 const original={nodes:reference.nodes,edges:reference.dependencies.map(e=>({...e,upper:'0-0-0',dashed:true}))};
 validatePlan(original);
 const expected=new Map(reference.nodes.map(n=>[n.id,n])),actual=new Map(plan.nodes.map(n=>[n.id,n]));
 const sourcePairs=new Set(reference.dependencies.map(e=>key(e.from,e.to))),targetPairs=new Set(plan.edges.map(e=>key(e.from,e.to)));
 const sourceAncestors=ancestors(original.nodes,original.edges),targetAncestors=ancestors(plan.nodes,plan.edges);
 const diff={addedNodes:plan.nodes.filter(n=>!expected.has(n.id)).map(n=>n.id),removedNodes:reference.nodes.filter(n=>!actual.has(n.id)).map(n=>n.id),names:[],contents:[],addedArrows:difference(targetPairs,sourcePairs).map(JSON.parse),removedArrows:difference(sourcePairs,targetPairs).map(JSON.parse),predecessors:[],estimates:[]};
 for(const [id,n]of expected){const a=actual.get(id);if(!a)continue;
  if(n.name!==a.name)diff.names.push({id,before:n.name,after:a.name});
  if(n.content!==undefined&&n.content!==(a.content||''))diff.contents.push({id,before:n.content,after:a.content||''});
  const added=difference(targetAncestors.get(id),sourceAncestors.get(id)),removed=difference(sourceAncestors.get(id),targetAncestors.get(id));
  if(added.length||removed.length)diff.predecessors.push({id,added,removed});
 }
 const issues=[],add=(code,message,detail={})=>issues.push({code,message,...detail});
 const graphMatches=!Object.values(diff).some(v=>v.length);
 if(!graphMatches)add('DRAWING_MISMATCH','候选计划与所附确认图纸清单不同，未保存。请核对节点、文字、箭头与前置差异。');
 const workChecks=[],claimed=new Set(),workIds=new Set(),outcomes=new Set();
 if(reference.works!==undefined){
  for(const w of reference.works){
   const pair=key(w.fromNodeId,w.toNodeId),edge=plan.edges.find(e=>key(e.from,e.to)===pair),node=expected.get(w.toNodeId);
   const errors=[];let startValid=true,durationValid=true;
   if(workIds.has(w.id)||claimed.has(pair)||outcomes.has(w.toNodeId)){errors.push('同一工作、连线或成果被重复映射');durationValid=false;}
   workIds.add(w.id);claimed.add(pair);outcomes.add(w.toNodeId);
   if(!node||node.kind!=='outcome')errors.push('实际工作必须通向所附清单中的完成成果，不能把分类或开始事件当成成果');
   if(!edge){errors.push('对应的实际工作连线不存在');startValid=false;durationValid=false;}
   else{
    if(!positive(edge)||edge.dashed){errors.push('实际工作必须有真实正工期，不能借虚线隐藏工作');durationValid=false;}
    if(!equivalent(triplet(edge),wanted(w.estimateDays))){diff.estimates.push({workId:w.id,before:w.estimateDays,after:triplet(edge)});errors.push('估时与确认工作不一致，不能拆分、重填或静默换算');durationValid=false;}
    const required=sourceAncestors.get(w.toNodeId)||new Set(),available=new Set([w.fromNodeId,...(targetAncestors.get(w.fromNodeId)||[])]);
    const missing=difference(required,available);
    if(missing.length){errors.push('这些前置只约束成果完成，未约束工作开始：'+missing.join('、'));startValid=false;}
   }
   workChecks.push({id:w.id,from:w.fromNodeId,to:w.toNodeId,status:errors.length?'fail':'pass',startDependencies:startValid?'pass':'fail',duration:durationValid?'pass':'fail',errors});
  }
  const unclaimed=plan.edges.filter(e=>positive(e)&&!claimed.has(key(e.from,e.to))).map(e=>({from:e.from,to:e.to}));
  const unmapped=reference.nodes.filter(n=>n.kind==='outcome'&&!outcomes.has(n.id)).map(n=>n.id);
  if(unclaimed.length)add('UNMAPPED_WORK','有正工期连线未对应唯一确认工作，不能证明没有重复计时或虚构工作。',{edges:unclaimed});
  if(unmapped.length)add('UNMAPPED_OUTCOME','部分完成成果没有对应工作，不能证明工期完整。',{nodes:unmapped});
  if(workChecks.some(w=>w.status==='fail'))add('WORK_MAPPING_MISMATCH','工作映射未通过：请一次核对开工前置、工作含义和原估时。');
 }
 if(reference.works===undefined&&(plan.edges.some(positive)||reference.nodes.some(n=>n.kind==='outcome')))add('WORK_MAPPING_REQUIRED','尚未提供完整确认工作映射，只能对照图形；本次不能按计算准确的转换提交。');
 const calculation=reference.works===undefined?'unverified':issues.length?'fail':'pass';
 const coverageFailed=issues.some(i=>['UNMAPPED_WORK','UNMAPPED_OUTCOME'].includes(i.code));
 const dependencies=reference.works===undefined?'unverified':coverageFailed||diff.addedArrows.length||diff.removedArrows.length||diff.addedNodes.length||diff.removedNodes.length||workChecks.some(w=>w.startDependencies==='fail')?'fail':'pass';
 const duration=reference.works===undefined?'unverified':coverageFailed||workChecks.some(w=>w.duration==='fail')?'fail':'pass';
 return {schema:'xutu.flow-check/v1',format:'pass',drawing:graphMatches?'pass':'fail',dependencies,duration,business:'not_independently_verified',canSubmit:issues.length===0,diff,workChecks,issues,
  scope:'只比较指令所附清单及工作映射；不识别图片，不证明清单来源、用户授权或现实业务完整性。图形一致不代表排程正确；网站保存另行回读。',
  notice:issues.length?'图纸或工作映射不一致，未保存。':calculation==='unverified'?'所附图纸结构一致；未提供完整工作映射，工作开始约束与工期未核实。':'所附图纸及工作映射检查通过；业务含义仍以用户确认资料为准。'};
}

export function enforceFlow(reference,plan){
 const report=inspectFlow(reference,plan);
 if(!report.canSubmit)throw Object.assign(new Error(report.notice),{code:'FLOW_CHECK_FAILED',flowCheck:report});
 return report;
}

export function flowFeedback(result){
 const reports=(result?.steps||[]).map(s=>s.flowCheck||s.data?.flowCheck).filter(Boolean);
 if(!reports.length)return '';
 return reports.map(r=>r.notice).join('\n');
}
