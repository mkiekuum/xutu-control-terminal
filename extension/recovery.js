import {clone,equivalent,validatePlan,fail} from './core.js';

// Apply only the delta base -> wanted to the current server document.
// Arrays representing graph entities are keyed, never merged by array index.
export function mergeRecovery(base,wanted,latest,{acceptConflicts=false}={}){
 const conflicts=[],changes=[];
 function merge(a,b,c,path){
  if(equivalent(a,b))return clone(c);
  if(equivalent(c,b))return clone(c);
  const objects=[a,b,c].every(x=>x&&typeof x==='object'&&!Array.isArray(x));
  if(objects){const out=clone(c);for(const key of new Set([...Object.keys(a),...Object.keys(b)])){const value=merge(a[key],b[key],c[key],path.concat(key));if(value===undefined)delete out[key];else out[key]=value;}return out;}
  const entry={path:path.join('.'),base:a??null,current:c??null,wanted:b??null};
  if(!equivalent(c,a))conflicts.push(entry);
  changes.push(entry);return !equivalent(c,a)&&!acceptConflicts?clone(c):clone(b);
 }
 const out=clone(latest);
 for(const key of new Set([...Object.keys(base),...Object.keys(wanted)])){
  if(['nodes','edges'].includes(key))continue;
  const value=merge(base[key],wanted[key],latest[key],[key]);if(value===undefined)delete out[key];else out[key]=value;
 }
 let structural=false;
 for(const domain of ['nodes','edges']){
  const id=x=>domain==='nodes'?x.id:JSON.stringify([x.from,x.to]);
  const a=new Map(base[domain].map(x=>[id(x),x])),b=new Map(wanted[domain].map(x=>[id(x),x])),c=new Map(latest[domain].map(x=>[id(x),x]));
  const originalIds=base[domain].map(id),wantedIds=wanted[domain].map(id);
  if([...new Set([...a.keys(),...b.keys()])].some(k=>a.has(k)!==b.has(k)))structural=true;
  for(const key of new Set([...a.keys(),...b.keys()])){const value=merge(a.get(key),b.get(key),c.get(key),[domain,key]);if(value===undefined)c.delete(key);else c.set(key,value);}
  // Only explicit display reorder touches ordering; independent additions retain their order.
  const reordered=originalIds.length===wantedIds.length&&originalIds.every(k=>b.has(k))&&!equivalent(originalIds,wantedIds);
  if(reordered){const live=latest[domain].map(id).filter(k=>a.has(k));if(!equivalent(live,originalIds)&&!equivalent(live,wantedIds))conflicts.push({path:domain+'.order',base:originalIds,current:live,wanted:wantedIds});}
  const order=reordered?wantedIds:[...latest[domain].map(id),...wantedIds];out[domain]=[...new Set(order)].filter(k=>c.has(k)).map(k=>c.get(k));
 }
 // Structural undo must not silently invalidate new incident work, progress or a baseline.
 if(structural){
  if(!equivalent(base.baseline,latest.baseline)||latest.edges.some(e=>e.completedAt&&!equivalent(base.edges.find(x=>x.from===e.from&&x.to===e.to),e)))fail('RESTORE_UNSUPPORTED','结构恢复涉及新的基线或已完成工作，请保留现状并重新制定局部修改。');
  const changedNodes=new Set([...base.nodes,...wanted.nodes].filter(n=>!base.nodes.some(a=>a.id===n.id)||!wanted.nodes.some(b=>b.id===n.id)).map(n=>n.id));
  for(const e of latest.edges)if((changedNodes.has(e.from)||changedNodes.has(e.to))&&!base.edges.some(a=>equivalent(a,e)))fail('RESTORE_UNSUPPORTED','相关节点已有新增或变更的连线，不能自动拼接结构。');
 }
 if(!conflicts.length||acceptConflicts)validatePlan(out);
 return {current:out,conflicts,changes,structural,layoutChanged:!equivalent(latest.positions,out.positions)};
}

export function verifySaved(expected,actual,{strictLayout=false}={}){
 const fields=['title','planOwner','planNumber','start','deadline','nodes','edges','baseline'];
 const mismatches=fields.filter(k=>!equivalent(expected[k],actual[k]));
 if(mismatches.length)fail('SERVER_NOT_CONFIRMED','业务字段回读不一致：'+mismatches.join('、'));
 const layoutVerified=equivalent(expected.positions,actual.positions);
 if(strictLayout&&!layoutVerified)throw Object.assign(Error('业务字段已回读确认，但本次明确调整的布局尚未确认：positions'),{code:'SERVER_NOT_CONFIRMED',verification:{businessVerified:true,layoutVerified:false}});
 return {businessVerified:true,layoutVerified,...(!layoutVerified?{warning:'业务已保存并回读确认；网站调整了布局坐标，布局与提交值不同。'}:{})};
}
