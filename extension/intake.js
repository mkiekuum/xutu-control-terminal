import {fail,validDate,validate,clone} from './core.js';
import {digest,accountKey} from './local-store.js';
export const UNSET='__unset__';
export function classify(request='',command){
 const steps=command?.steps||[],create=steps.some(s=>s.op==='plan.create');
 const structural=steps.filter(s=>/^(node|edge|task)\./.test(s.op)&&s.op!=='node.renumber'&&s.op!=='node.reorder'&&!(s.op==='node.batchUpdate'&&s.params.updates.every(u=>Object.keys(u.set).every(k=>k==='name')))&&!(s.op==='node.update'&&Object.keys(s.params.set).every(k=>k==='name')));
 const large=steps.some(s=>s.op==='plan.replace'||(s.params?.nodes?.length||0)>=6)||structural.length>=4||structural.some(s=>(s.params?.updates?.length||0)>=6);
 const simple=/只|仅|标题|改名/.test(request)&&!/全部|复杂|重构/.test(request);
 return {complex:large||!simple&&/复杂|老板|多阶段|多节点|多团队|跨部门|全部|重构|并行|\d{2,}\s*个?节点/.test(request),create,simulation:/模拟|练习|演示|示例|作业/.test(request)};
}
export function makeQuestions(ledger){
 const f=ledger.facts,unknown=k=>!f[k]||f[k].status==='pending',questions=[];
 const add=(id,title,fields,choices=[])=>questions.push({id,title,fields:fields.filter(unknown),choices});
 if(ledger.intent==='create'){
  if(unknown('title')||unknown('number'))add('identity','计划叫什么、用哪个编号？可选建议名称或自填；编号执行前会查重。',['title','number'],ledger.titleSuggestions);
  if(unknown('startDate')||unknown('deadlineDate'))add('dates','何时开工？是否有硬截止？没有或暂不设置请明确选择，不能把预测日期当截止。',['startDate','deadlineDate'],['指定日期','明确暂不设置']);
  if(unknown('projectGroupId'))add('project','属于哪个有权访问的项目组？也可明确不分组。',['projectGroupId'],['从实际项目组选择','明确不分组']);
 }
 if(unknown('goal'))add('goal','最终交付和老板优先级是什么？有哪些业务限制和验收条件？',['goal'],['交付与验收优先','交期优先','成本优先']);
 if(unknown('resources'))add('resources','由谁分工、哪些设备可并行？哪些工期已知、哪些需先提出估计再核实？',['resources'],['提供实际人员与限制','先提方案，人员和估时另行核对']);
 if(unknown('expression'))add('expression','面向谁、表达多详细？名称保留还是通俗化，编号保留还是建议连续？',['expression'],['中性易懂，保留未要求改动部分','汇报用，简洁','执行用，详细']);
 // First round remains 3–6 meaningful questions; already explicit dates/groups are not asked again.
 return ledger.intent==='manage'&&!ledger.classification.complex?questions.filter(q=>q.id==='expression'):questions.slice(0,6);
}
function confirmed(value,source='user'){return {value,status:value===''?'explicitly-unset':'confirmed',source,at:new Date().toISOString()};}
export function prefill(request,groups){
 const facts={};const start=request.match(/开工(?:日期)?[：:\s]*(\d{4}-\d{2}-\d{2})/),end=request.match(/(?:硬截止|必须完成日期|截止日期)[：:\s]*(\d{4}-\d{2}-\d{2})/);
 if(start&&validDate(start[1]))facts.startDate=confirmed(start[1],'request');
 if(/(?:不设|没有|无)(?:必须完成日期|硬性?截止|截止日期)/.test(request))facts.deadlineDate=confirmed('','request');else if(end&&validDate(end[1]))facts.deadlineDate=confirmed(end[1],'request');
 if(/(?:暂不|不)设置?开工|开工(?:日期)?(?:暂不设置|留空)/.test(request))facts.startDate=confirmed('','request');
 const group=groups.find(g=>g.number&&request.includes('项目组 '+g.number)||g.id&&request.includes('项目组 '+g.id));if(group)facts.projectGroupId=confirmed(group.id,'request');
 if(/不分组|未分组/.test(request))facts.projectGroupId=confirmed('','request');
 const title=request.match(/(?:名称|标题)[：:]\s*[“"]([^”"\n]+)[”"]/);if(title)facts.title=confirmed(title[1],'request');
 const number=request.match(/计划编号[：:]\s*([\w-]+)/);if(number)facts.number=confirmed(number[1],'request');
 return facts;
}
export const proposalHash=command=>digest(command.steps);
export class IntakeEngine {
 constructor(store){this.store=store;}
 async inspect(ctx,p){
  if(!p.request?.trim())fail('REQUIRED_FIELD_UNKNOWN','先说明本次需求。');
  const key='intake-active:'+await accountKey(ctx.actor)+':'+ctx.tabId+':'+p.intent,prior=await this.store.get(key);
  if(prior){const saved=await this.store.get('intake:'+prior);if(saved?.request===p.request&&saved.targetId===(ctx.target?.id||null)&&saved.revision===(ctx.target?.version??null)){saved.groups=ctx.groups;await this.store.set('intake:'+saved.id,saved);return saved;}}
  const base=p.request.replace(/[\r\n]/g,' ').replace(/^(老板(?:叫|让)我|请|帮我|我要|我想|做一份|制定|新建|一份|一个|做)+/g,'').split(/[，。；]/)[0].replace(/计划$/,'').slice(0,24)||'业务',ledger={id:crypto.randomUUID(),actor:ctx.actor,origin:'https://plan.fpgabbs.cn',tabId:ctx.tabId,intent:p.intent,request:p.request,targetId:ctx.target?.id||null,revision:ctx.target?.version??null,classification:classify(p.request),facts:prefill(p.request,ctx.groups),titleSuggestions:[base+'计划',base+'实施方案',base+'交付计划'],groups:ctx.groups,owner:ctx.actor,createdAt:new Date().toISOString(),roundAnswered:false};
  ledger.required=ledger.intent==='create'||ledger.classification.complex;ledger.rememberedExpression=await this.store.get('expression:'+await accountKey(ctx.actor)+':'+p.intent)||'';
  ledger.questions=makeQuestions(ledger);ledger.firstRound=ledger.questions.map(q=>q.id);await this.store.set('intake:'+ledger.id,ledger);await this.store.set(key,ledger.id);return ledger;
 }
 async get(ctx,id){const ledger=await this.store.get('intake:'+id);if(!ledger||ledger.actor!==ctx.actor||ledger.tabId!==ctx.tabId)fail('INTAKE_CONTEXT_CHANGED','问卷不属于当前账号和网页。');if(ledger.intent==='manage'&&(ledger.targetId!==(ctx.target?.id||null)||ledger.revision!==(ctx.target?.version??null)))fail('INTAKE_CONTEXT_CHANGED','计划或版本已变化，请按最新内容重新核对问卷。');return ledger;}
 async answer(ctx,id,answers,rememberExpression=false){const l=await this.get(ctx,id);const fields=['title','number','startDate','deadlineDate','projectGroupId','goal','resources','expression'];for(const[k,raw]of Object.entries(answers)){
  if(!fields.includes(k)||typeof raw!=='string')fail('INVALID_SCHEMA','未知问卷字段');const value=raw===UNSET?'':raw.trim();
  if(['startDate','deadlineDate'].includes(k)&&!validDate(value))fail('INVALID_SCHEMA','请输入有效日期或明确暂不设置');
  if(k==='projectGroupId'&&value&&!ctx.groups.some(g=>g.id===value))fail('PROJECT_GROUP_UNAVAILABLE','项目组已不可用，请重新选择。');
  if(!value&&!['startDate','deadlineDate','projectGroupId'].includes(k))fail('REQUIRED_FIELD_UNKNOWN','该问题不能空白回答');
  if(raw===''&&['startDate','deadlineDate','projectGroupId'].includes(k))continue; // blank input is pending, never consent
  l.facts[k]=confirmed(value);
 }
 if(rememberExpression&&l.facts.expression)await this.store.set('expression:'+await accountKey(ctx.actor)+':'+l.intent,l.facts.expression.value);
 l.roundAnswered=l.firstRound.every(id=>l.questions.find(q=>q.id===id)?.fields.every(k=>l.facts[k]?.status!=='pending'&&l.facts[k]));delete l.approvedHash;await this.store.set('intake:'+id,l);return l;
 }
 async resetExpression(ctx,id){const l=await this.get(ctx,id);await this.store.remove('expression:'+await accountKey(ctx.actor)+':'+l.intent);delete l.facts.expression;l.rememberedExpression='';l.roundAnswered=false;delete l.approvedHash;await this.store.set('intake:'+id,l);return l;}
 async confirm(ctx,id,command){validate(command);const l=await this.get(ctx,id);if(!l.roundAnswered)fail('INTAKE_REQUIRED','请先完成首轮问答。');await this.checkFields(l,command,ctx);l.approvedHash=await proposalHash(command);l.approvedAt=new Date().toISOString();await this.store.set('intake:'+id,l);return l;}
 async checkFields(l,command,ctx){
  const creates=command.steps.filter(s=>s.op==='plan.create');if(creates.length>1)fail('INTAKE_ANSWER_CONFLICT','一份问卷只核实一个新计划；请分别建立问卷和创建批次。');
  if(creates.length&&l.intent!=='create'||!creates.length&&l.intent==='create')fail('INTAKE_ANSWER_CONFLICT','指令与新建/管理选择不一致。');
  for(const s of creates){const p=s.params||{};for(const k of ['title','number','startDate','deadlineDate']){if(!l.facts[k])fail('REQUIRED_FIELD_UNKNOWN','尚未核实：'+k);if((p[k]??'')!==l.facts[k].value)fail('INTAKE_ANSWER_CONFLICT','指令与已答内容不一致：'+k);}
   if(p.owner&&p.owner!==ctx.actor)fail('INTAKE_ANSWER_CONFLICT','本问卷默认计划负责人是当前账号；其他负责人请走已授权的独立流程。');
   if(!l.classification.simulation&&(p.edges||[]).some(e=>!e.dashed&&!e.executor)&&!/(暂不分配|草稿|不设置执行人)/.test(l.facts.resources?.value||''))fail('REQUIRED_FIELD_UNKNOWN','还有实际工作的执行人未明确；请核实分工，或明确本次仅为暂不分配的草稿。');
   const group=l.facts.projectGroupId?.value;if(group===undefined)fail('REQUIRED_FIELD_UNKNOWN','尚未选择项目组或明确不分组');
   const assign=command.steps.filter(x=>x.op==='project.assignPlan'&&x.params?.planIdFrom?.stepId===s.id);
   if(group&&!ctx.groups.some(g=>g.id===group))fail('PROJECT_GROUP_UNAVAILABLE','项目组权限已变化');
   if(group?(assign.length!==1||assign[0].params.groupId!==group):assign.length>0)fail('INTAKE_ANSWER_CONFLICT','新计划分组与问卷选择不一致');
  }
  if(l.intent==='manage')for(const s of command.steps.filter(s=>s.target)){if(s.target.id!==l.targetId||s.target.version!==undefined&&s.target.version!==l.revision)fail('INTAKE_CONTEXT_CHANGED','指令目标或版本与问卷不一致');}
 }
 async guard(command,ctx){
  const needs=command.steps.some(s=>s.op==='plan.create')||classify('',command).complex;
  if(!needs&&!command.intakeId)return;
  if(!command.intakeId)fail('INTAKE_REQUIRED','新建或复杂调整请先完成需求问卷；不能跳过问答直接执行。');
  const l=await this.get(ctx,command.intakeId);if(!l.roundAnswered)fail('INTAKE_REQUIRED','首轮问题尚未回答完，可先讨论草案。');
  await this.checkFields(l,command,ctx);
  if(l.approvedHash!==await proposalHash(command))fail('ESTIMATE_NOT_CONFIRMED','请先查看并确认这份指令的人员分工与具体估时；修改指令后需要重新核对。');
 }
}
