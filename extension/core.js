import {checkSchema} from './validation.js';
export const VERSION='2.2.0';
export function fail(code,message=code){throw Object.assign(new Error(message),{code});}
export function assert(ok,message){if(!ok)fail('INVALID_SCHEMA',message);}
export const clone=x=>structuredClone(x);
export async function operationId(requestId,stepId,attempt=''){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([requestId,stepId,attempt])))).slice(0,16);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
 return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
export function equivalent(a,b){if(Object.is(a,b))return true;if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;if(Array.isArray(a))return a.length===b.length&&a.every((x,i)=>equivalent(x,b[i]));const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&equivalent(a[k],b[k]));}
export function clean(x){if(Array.isArray(x))return x.map(clean);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>!/(password|token|cookie|authorization|secret)/i.test(k)).map(([k,v])=>[k,clean(v)]));return x;}
export function validate(e){
 checkSchema({type:'object',properties:Object.fromEntries(['protocol','requestId','mode','tabId','execution','steps'].map(k=>[k,{}])),additionalProperties:false},e);
 if(e.tabId!==undefined)assert(Number.isInteger(e.tabId)&&e.tabId>0,'tabId 必须是正整数');
 assert(e&&e.protocol==='xutu.command/v1','protocol 必须为 xutu.command/v1');
 assert(typeof e.requestId==='string'&&/^[\w-]{1,120}$/.test(e.requestId),'requestId 只接受 1–120 位字母、数字、下划线、连字符');
 assert(!e.mode||['validate','preview','execute'].includes(e.mode),'mode 无效');
 assert(Array.isArray(e.steps)&&e.steps.length>0,'steps 不能为空');
 const ids=new Set();for(const s of e.steps){assert(s&&typeof s.id==='string'&&s.id&&!ids.has(s.id),'步骤 ID 重复或为空');assert(typeof s.op==='string'&&/^[a-z]+\.[a-zA-Z.]+$/.test(s.op),'op 无效');assert(!s.dependsOn||Array.isArray(s.dependsOn)&&s.dependsOn.every(id=>ids.has(id)),'依赖必须指向前面的步骤');ids.add(s.id);}
 const r=e.execution?.retry;if(r){assert(Number.isInteger(r.maxAttempts)&&r.maxAttempts>=1&&r.maxAttempts<=5,'maxAttempts 范围 1–5');assert(Number.isFinite(r.backoffMs)&&r.backoffMs>=0&&r.backoffMs<=5000,'backoffMs 范围 0–5000');}
 assert(!e.execution?.onConflict||['fail','refresh-retry','overwrite-if-authorized'].includes(e.execution.onConflict),'onConflict 无效');return e;
}
export function parseCLI(text){
 const tokens=text.match(/"(?:\\.|[^"\\])*"|'[^']*'|\S+/g)||[];
 const unquote=s=>s.startsWith('"')?JSON.parse(s):s.startsWith("'")?s.slice(1,-1):s;
 const a=tokens.map(unquote);if(a[0]==='xutu')a.shift();
 let op=a.shift();if(!op?.includes('.'))op+='.'+a.shift();
 const s={id:'s1',op,params:{},target:{}};let requestId=crypto.randomUUID(),mode='execute',tabId;
 while(a.length){const flag=a.shift(),v=a.shift();assert(v!==undefined,'参数缺值 '+flag);if(flag==='--id'||flag==='--number')s.target[flag.slice(2)]=v;else if(flag==='--params')s.params=JSON.parse(v);else if(flag==='--request-id')requestId=v;else if(flag==='--mode')mode=v;else if(flag==='--tab-id')tabId=Number(v);else if(flag==='--set'){let i=v.indexOf('=');assert(i>0,'--set 需要 字段=值');s.params.set??={};s.params.set[v.slice(0,i)]=v.slice(i+1);}else fail('INVALID_SCHEMA','未知参数 '+flag);}
 return validate({protocol:'xutu.command/v1',requestId,mode,...(tabId?{tabId}:{}),steps:[s]});
}
export function validatePlan(p){
 assert(p&&Array.isArray(p.nodes)&&Array.isArray(p.edges),'需要 nodes/edges');const ids=new Set();
 for(const n of p.nodes){assert(typeof n.id==='string'&&n.id.length>0&&n.id.length<=16&&!ids.has(n.id),'节点 ID 无效');assert(typeof n.name==='string'&&n.name.trim()&&n.name.length<=40,'节点名称无效');ids.add(n.id);}
 const out=new Map([...ids].map(id=>[id,[]])),degree=new Map([...ids].map(id=>[id,0])),pairs=new Set();
 for(const e of p.edges){assert(ids.has(e.from)&&ids.has(e.to)&&e.from!==e.to,'连线端点无效');let pair=JSON.stringify([e.from,e.to]);assert(!pairs.has(pair),'重复连线');pairs.add(pair);const parts=String(e.upper).trim().split('-');assert(parts.every(x=>/^\d+(?:\.\d+)?$/.test(x.trim())),'用时格式无效');const t=parts.map(Number);if(t.length===1)t.push(t[0],t[0]);assert(t.length===3&&t.every(n=>Number.isFinite(n)&&n>=0)&&t[0]<=t[1]&&t[1]<=t[2],'估时须为非负递增三元组');out.get(e.from).push(e.to);degree.set(e.to,degree.get(e.to)+1);}
 const q=[...ids].filter(id=>!degree.get(id));for(let i=0;i<q.length;i++)for(const id of out.get(q[i])){degree.set(id,degree.get(id)-1);if(!degree.get(id))q.push(id);}assert(q.length===ids.size,'依赖存在环');return p;
}
export function decimal(n){assert(typeof n==='number'&&Number.isFinite(n)&&n>=0,'时间必须是有限非负数字');const s=String(n);if(!/e/i.test(s))return s;const [c,e]=s.split('e'),digits=c.replace('.',''),point=(c.indexOf('.')<0?c.length:c.indexOf('.'))+Number(e);return point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point);}
export function edge(p){const t=p.estimateDays;assert(t&&t.minimum<=t.likely&&t.likely<=t.maximum,'estimateDays 无效');assert(!p.dashed||t.minimum===0&&t.likely===0&&t.maximum===0,'虚任务必须明确填写三个0；不会自动清空耗时');return {from:p.fromNodeId,to:p.toNodeId,upper:[t.minimum,t.likely,t.maximum].map(decimal).join('-'),lower:'',dashed:p.dashed===true,executor:p.executor||'',completedAt:p.actualCompleteDate||''};}
export function validDate(s){return s===''||typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
export function nativePlan(p,actor){assert(p.projectGroupId===undefined,'创建时请用独立 project.assignPlan 步骤分配项目组');assert(p.status===undefined||p.status==='draft','创建只允许 draft');assert(typeof p.number==='string'&&p.number,'number 必填');assert(typeof p.title==='string'&&p.title,'title 必填');assert(validDate(p.startDate||'')&&validDate(p.deadlineDate||''),'日期必须有效 YYYY-MM-DD');return validatePlan({version:2,title:p.title,planOwner:p.owner||actor,planNumber:p.number,start:p.startDate||'',deadline:p.deadlineDate||'',baseline:null,nodes:(p.nodes||[]).map(n=>({id:n.id,name:n.name,content:n.content||'',owner:n.ownerName||''})),edges:(p.edges||[]).map(edge),positions:{}});}
export class Executor{
 constructor(store,dispatch){this.store=store;this.dispatch=dispatch;this.queue=Promise.resolve();}
 run(e){const job=this.queue.then(()=>this.execute(e));this.queue=job.catch(()=>{});return job;}
 async execute(e){validate(e);const persist=!['validate','preview'].includes(e.mode),key='job:'+e.requestId,signature=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(e))))).map(n=>n.toString(16).padStart(2,'0')).join(''),old=persist?await this.store.get(key):null;if(old){assert(old.signature===signature,'requestId 已用于不同指令');if(old.result)return old.result;fail('NON_IDEMPOTENT_RETRY_BLOCKED','此前执行中断；先回读状态，不自动重复写入');}
 const result={protocol:'xutu.result/v1',requestId:e.requestId,startedAt:new Date().toISOString(),steps:[],summary:{success:0,failed:0,skipped:0},logId:e.requestId};
 if(e.mode!=='validate'&&e.mode!=='preview')await this.store.set(key,{signature});
 let stop=false;for(const s of e.steps){if(stop||s.dependsOn?.some(id=>result.steps.find(x=>x.id===id)?.status!=='success')){result.steps.push({id:s.id,status:'skipped'});result.summary.skipped++;continue;}
 try{const data=await this.dispatch(s,e);result.steps.push({id:s.id,status:'success',...data});result.summary.success++;}catch(err){result.steps.push({id:s.id,status:'failed',code:err.code||'INTERNAL_ERROR',message:err.message,serverVerified:false});result.summary.failed++;stop=!e.execution?.continueOnError;}}
 result.status=result.summary.failed?(result.summary.success?'partial_success':'failed'):'success';result.finishedAt=new Date().toISOString();
 if(e.mode!=='validate'&&e.mode!=='preview')await this.store.set(key,{signature,result:clean(result)});return result;
 }
}
