import {prepareCommand,stableRequestId,summarize,commandSummary} from './terminal.js';
import {assembleExport} from './html-export.js';
import {UNSET} from './intake.js';
const labels={title:'计划名称',number:'计划编号',startDate:'开工日期',deadlineDate:'硬截止日期',projectGroupId:'项目组',goal:'交付、优先级与验收',resources:'人员、设备、工期依据',expression:'本次表达与修改偏好'};
const element=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
function checked(result){if(result?.status==='failed')throw Error(result.message||result.code);return result;}
export function proposalText(command){
 const lines=[commandSummary(command)];
 for(const s of command.steps){const p=s.params||{};
  if(s.op==='plan.create')lines.push('名称：'+p.title+'；编号：'+p.number,'开工：'+(p.startDate||'明确暂不设置')+'；硬截止：'+(p.deadlineDate||'明确暂不设置'),'计划负责人：'+(p.owner||'当前网站账号')+'（不等于所有工作执行人）');
  for(const n of p.nodes||[])lines.push('节点 '+n.id+' '+n.name+' · 负责人：'+(n.ownerName||'未分配')+' · '+(n.content||''));
  for(const e of p.edges||[])lines.push((e.dashed?'零耗时关系 ':'实际工作 ')+e.fromNodeId+' → '+e.toNodeId+'；三点估时：'+Object.values(e.estimateDays||{}).join(' / ')+' 天；执行人：'+(e.executor||'未分配'));
  if(p.estimateDays)lines.push('工作 '+p.fromNodeId+' → '+p.toNodeId+'：'+Object.values(p.estimateDays).join(' / ')+' 天；执行人：'+(p.executor||'沿用未改字段'));
  if(p.segments)lines.push('拆分各段：'+JSON.stringify(p.segments));
  if(s.op==='project.assignPlan')lines.push('分配到项目组：'+(p.groupId||'不分组'));
 }
 return lines.join('\n');
}
export function setupIntake(h){
 const {$,tabId,send,message,busy,intent}=h;let ledger=null,fields=new Map();
 const call=async(action,extra={})=>checked(await send({kind:'intake',action,tabId:tabId(),intent:intent(),intakeId:ledger?.id,...extra}));
 function reset(){ledger=null;fields.clear();$('intakePanel').hidden=true;$('proposalPanel').hidden=true;$('proposalStatus').textContent='';}
 function render(value){ledger=value;fields.clear();$('intakePanel').hidden=false;$('intakeState').textContent=value.roundAnswered?'答复已保存':value.required?'需核实后才能执行':'本次可选';$('intakeQuestions').replaceChildren();
  for(const q of value.questions){const section=element('fieldset'),legend=element('legend',q.title);section.append(legend);
   for(const name of q.fields){const label=element('label',labels[name]),input=element(name==='projectGroupId'?'select':['goal','resources','expression'].includes(name)?'textarea':'input');input.id='answer-'+name;input.setAttribute('aria-label',labels[name]);
    if(name==='projectGroupId'){for(const option of [{id:'',name:'请选择'}, {id:UNSET,name:'明确不分组'},...value.groups.map(g=>({id:g.id,name:(g.number||'')+' '+g.name}))]){const o=element('option',option.name);o.value=option.id;input.append(o);}}
    if(['startDate','deadlineDate'].includes(name))input.type='date';
    const fact=value.facts[name];input.value=fact?(fact.value===''&&name==='projectGroupId'?UNSET:fact.value):name==='expression'?value.rememberedExpression||'':'';
    if(name==='title'){const list=element('datalist');list.id='title-suggestions';for(const text of value.titleSuggestions)list.append(element('option',text));input.setAttribute('list',list.id);section.append(list);}
    if(input.tagName==='TEXTAREA'){input.rows=2;input.placeholder=name==='expression'?'如：给同事执行，适中，保留现有名称与编号':name==='resources'?'实际分工、可并行设备、已知工期；不清楚的内容先讨论':'业务目标、交付物、优先级、验收条件';}
    label.append(input);section.append(label);const entry={input};
    if(['startDate','deadlineDate'].includes(name)){const unset=element('input');unset.type='checkbox';unset.checked=fact?.status==='explicitly-unset';const l=element('label',' 明确暂不设置');l.prepend(unset);section.append(l);entry.unset=unset;}
    fields.set(name,entry);
   }
   $('intakeQuestions').append(section);
  }
  $('proposalPanel').hidden=!value.required;$('proposalStatus').textContent=value.approvedHash?'这份方案已核实；修改 JSON 后需重新核对。':'回答问题后粘贴 AI 的 JSON，再查看具体人员与估时。';
 }
 async function inspect(){if(!tabId())throw Error('请先在主界面选择序图网页。');const result=await call('inspect',{request:$('request').value});render(result);return result;}
 function bind(command){if(ledger?.required){if(ledger.request!==$('request').value||ledger.intent!==intent())throw Error('需求或用途已变化，请重新复制提示词并核实问卷。');command.intakeId=ledger.id;}return command;}
 $('request').addEventListener('input',reset);
 $('saveAnswers').onclick=()=>busy('saveAnswers',async()=>{const answers={};for(const[k,{input,unset}]of fields){if(unset?.checked)answers[k]=UNSET;else if(input.value.trim())answers[k]=input.value;}
  render(await call('answer',{answers,rememberExpression:$('rememberExpression').checked}));message(ledger.roundAnswered?'答复已保存。现在复制提示词给 AI，再粘贴它返回的 JSON。':'已保存部分答复，可继续讨论；缺项尚不能执行。');
 });
 $('resetExpression').onclick=()=>busy('resetExpression',async()=>{render(await call('resetExpression'));$('rememberExpression').checked=false;message('已清除此账号、此用途记住的表达习惯。');});
 $('editor').addEventListener('input',()=>{try{$('proposalText').textContent=proposalText(prepareCommand($('editor').value,tabId(),'proposal-preview'));$('proposalStatus').textContent='请核对这份 JSON 中的人员、日期与估时。';}catch{$('proposalText').textContent='粘贴完整 JSON 后显示人员与工期。';}});
 $('confirmProposal').onclick=()=>busy('confirmProposal',async()=>{if(!ledger)await inspect();const command=bind(prepareCommand($('editor').value,tabId(),await stableRequestId($('editor').value)));$('proposalText').textContent=proposalText(command);render(await call('confirm',{command}));message('这份方案已核实，可以执行。');});
 $('createGroup').onclick=()=>busy('createGroup',async()=>{const ctx=await h.readContext();if(!ctx.account?.actor)throw Error('请先登录并读取账号。');const command=h.envelope('project.create');command.steps[0].params={number:$('newGroupNumber').value.trim(),name:$('newGroupName').value.trim(),owner:ctx.account.actor};const result=await send({kind:'run',command});h.data(result);message('项目组已创建并回读确认。请在问卷中选择它。');await inspect();});
 return {inspect,reset,bind,adopt:value=>{if(value?.id&&value.facts&&value.request){h.chooseIntent(value.intent);$('request').value=value.request;render(value);}},get:()=>ledger};
}
export function setupHistory(h){
 const {$,send,busy,message,envelope,data}=h;let compared='';
 const command=(op,params={})=>{const c=envelope(op);c.steps[0].params=params;return c;};
 async function run(op,params){if(!h.tabId())throw Error('请先选择序图网页。');const result=await send({kind:'run',command:command(op,params)});$('output').textContent=JSON.stringify(result,null,2);$('resultDetails').hidden=false;message(summarize(result),result.status!=='success');return data(result);}
 const selection=()=>({historyId:$('historySelect').value,point:$('historyPoint').value});
 function reset(){compared='';$('historyBody').hidden=true;$('historyCount').textContent='';$('restorePoint').disabled=true;$('historyDiff').replaceChildren();}
 async function load(open=true){if(!h.tabId())throw Error('请先选择序图网页。');const report=data(await send({kind:'run',command:command('history.list')}));$('historyCount').textContent=report.count+'/10';$('undo').disabled=!report.cursor;$('redo').disabled=report.cursor>=report.count;$('resolveHistory').hidden=!report.pending&&!report.partial;$('historyNotice').textContent=report.pending?'有未确认结果：先核对网站现状，不要重复写入。':report.partial?'上次仅部分恢复；可继续同方向处理剩余目标，或核对后保留现状。':'本地记录占用约 '+Math.ceil(report.bytes/1024)+' KB。';$('historySelect').replaceChildren();$('compareHistory').replaceChildren(element('option','网站当前状态'));$('compareHistory').firstChild.value='';
  for(const e of report.entries){const title=new Date(e.time).toLocaleString()+' · '+e.operations.map(s=>({'plan.create':'新建计划','plan.update':'修改计划信息','node.batchUpdate':'批量修改节点','node.renumber':'调整编号','node.update':'修改节点','edge.update':'修改工作','plan.delete':'移入垃圾桶','plan.restore':'恢复计划'}[s.op]||s.op)).join('、');const option=element('option',e.index+'. '+(e.applied?'已应用':'已撤销')+' · '+(e.reversibleState==='reversible'?'可恢复':'不可完整恢复')+' · '+title);option.value=e.historyId;$('historySelect').append(option);const other=element('option',e.index+'. '+new Date(e.time).toLocaleString());other.value=e.historyId;$('compareHistory').append(other);}
  if(report.entries.length)$('historySelect').value=report.entries.at(-1).historyId;compared='';$('restorePoint').disabled=true;if(open)$('historyBody').hidden=false;return report;
 }
 $('loadHistory').onclick=()=>busy('loadHistory',()=>load());
 for(const id of ['undo','redo'])$(id).onclick=()=>busy(id,async()=>{try{await run('history.'+id);}finally{await load(false);}});
 function invalidComparison(){compared='';$('restorePoint').disabled=true;}
 for(const id of ['historySelect','historyPoint','compareHistory'])$(id).onchange=invalidComparison;
 $('comparePoint').onclick=()=>busy('comparePoint',async()=>{const params={...selection(),...($('compareHistory').value?{compareId:$('compareHistory').value}:{})},diff=await run('history.diff',params);$('historyDiff').replaceChildren();
  const names={title:'名称',planNumber:'编号',planOwner:'计划负责人',start:'开工',deadline:'硬截止',nodes:'节点',edges:'工作与依赖',baseline:'基线',positions:'布局'};
  for(const change of diff.changes){const box=element('section');box.append(element('h3','计划 '+change.targetId));if(change.unavailable){box.append(element('p',change.notice));$('historyDiff').append(box);continue;}box.append(element('p','来源：'+change.currentKind+' → 选中：'+change.selectedKind));
   for(const item of change.diff){const row=element('div');row.append(element('strong',(names[item.domain]||item.domain)+(item.id?' '+item.id:'')));for(const field of item.fields||[item])row.append(element('p',(field.field||'')+'：'+JSON.stringify(field.before)+' → '+JSON.stringify(field.after)));box.append(row);}
   if(!change.diff.length)box.append(element('p','普通计划字段无差异。'));box.append(element('p','审核：'+JSON.stringify(change.review)+'；项目组：'+JSON.stringify(change.projectGroup)));$('historyDiff').append(box);
  }
  if(diff.externalChanges.length)$('historyDiff').append(element('p','包含不可安全恢复域：'+diff.externalChanges.map(x=>x.op).join('、')));
  compared=JSON.stringify(selection());$('restorePoint').disabled=!!params.compareId||diff.reversibleState!=='reversible';
 });
 $('restorePoint').onclick=()=>busy('restorePoint',async()=>{if(compared!==JSON.stringify(selection()))throw Error('请先查看当前与选中状态的差异。');try{await run('history.restorePoint',selection());}finally{await load();}});
 $('resolveHistory').onclick=()=>busy('resolveHistory',async()=>{await run('history.resolvePending',{acknowledge:true});await load();});
 return {load,reset};
}
export function setupExport(h){
 const {$,send,busy,message,clipboard}=h;let raw='';
 function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/html;charset=utf-8'})),a=element('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 async function get(kind){const tab=h.tabId();if(!tab)throw Error('请先选择要导出的序图网页。');const call=(action,params)=>send({kind:'export',tabId:tab,action,params}).then(checked);$('exportStatus').textContent='正在采集并检查完整性…';const meta=await call('begin',{kind});try{const html=await assembleExport(meta,offset=>call('chunk',{exportId:meta.exportId,offset}));if(tab!==h.tabId())throw Error('目标网页变化，请重新导出。');$('exportStatus').textContent=meta.bytes+' 字节，完整性校验通过；缺失资源 '+meta.missingResources.length+' 项。';$('exportDetails').textContent=JSON.stringify(meta,null,2);return html;}finally{await call('release',{exportId:meta.exportId}).catch(()=>{});}}
 $('copyDom').onclick=()=>busy('copyDom',async()=>{raw=await get('raw');$('downloadDom').hidden=false;await clipboard(raw);message('完整网页 DOM 已复制，仅在本机处理。');});
 $('downloadDom').onclick=()=>{if(raw)download(raw,'xutu-raw-dom.html');};
 $('saveOffline').onclick=()=>busy('saveOffline',async()=>{download(await get('offline'),'xutu-offline-'+Date.now()+'.html');message('离线只读文件已交给浏览器保存；请保管其中的私密信息。');});
}
