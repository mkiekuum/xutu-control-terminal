import {assert,clone,validatePlan} from './core.js';
import {auditGraph} from './graph.js';

// Pure proposal builder. Never guesses which existing edge represents a work item.
// The caller must map each outcome to its verified original work edge.
export function restoreOutcomeNetwork(original,{dependencies,workEdges,startId}){
 validatePlan(original);const ids=Object.keys(dependencies),known=new Set(original.nodes.map(n=>n.id));
 assert(known.has(startId)&&!ids.includes(startId),'需要已核实的独立起点');
 assert(ids.every(id=>known.has(id)),'成果编号必须已存在');
 assert(ids.every(id=>Array.isArray(dependencies[id])&&new Set(dependencies[id]).size===dependencies[id].length&&dependencies[id].every(p=>ids.includes(p)&&p!==id)),'成果依赖无效');
 const ancestors=id=>{const seen=new Set(),active=new Set();function visit(n){assert(!active.has(n),'成果依赖存在环');if(seen.has(n))return;active.add(n);for(const p of dependencies[n])visit(p);active.delete(n);seen.add(n);}visit(id);seen.delete(id);return seen;};
 for(const id of ids){ancestors(id);for(const p of dependencies[id])assert(!dependencies[id].some(other=>other!==p&&ancestors(other).has(p)),'输入包含传递性冗余直接依赖');}
 const used=new Set(),works={};for(const id of ids){const ref=workEdges[id];assert(ref,'缺少实际工作映射：'+id);const matches=original.edges.map((e,i)=>({e,i})).filter(({e})=>e.from===ref.from&&e.to===ref.to);assert(matches.length===1&&!matches[0].e.dashed,'实际工作映射必须唯一且为实线');const {e,i}=matches[0];assert(!used.has(i),'同一实际工作不能重复计时');used.add(i);works[id]=clone(e);}
 assert(original.edges.every((e,i)=>e.dashed||used.has(i)),'存在未映射实际工作，不能静默删除');
 assert(original.nodes.every(n=>n.id===startId||ids.includes(n.id)),'存在旧辅助节点，需先核实其用途和引用，不能自动删除');
 const plan=clone(original);plan.edges=[];const auxiliary=[];
 const dummy=(from,to)=>({from,to,upper:'0-0-0',lower:'',dashed:true,executor:'',completedAt:''});
 for(const id of ids){const deps=dependencies[id];let from=startId;if(deps.length===1)from=deps[0];else if(deps.length>1){let n=1;while(known.has('J'+n))n++;from='J'+n;known.add(from);auxiliary.push(from);plan.nodes.push({id:from,name:'辅助：前置条件汇合',content:'成果 '+deps.join('、')+' 均已完成后，开始通向成果 '+id+' 的工作。',owner:''});for(const p of deps)plan.edges.push(dummy(p,from));}plan.edges.push({...works[id],from,to:id});}
 validatePlan(plan);assert(!auditGraph(plan).findings.some(f=>f.code==='TRANSITIVE_EDGE'&&f.safeToRemove),'生成了冗余虚线');
 return {plan,auxiliary,resourceNote:'相同执行人需在实际排程中错开；业务网络不添加人员串行边。网络关键路径不是单人实际完成时间。',references:'原成果编号保持，原正文引用无需重编号；辅助节点使用未占用J编号。'};
}
