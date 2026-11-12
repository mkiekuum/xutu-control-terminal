// Shared runtime parameter contracts; also exported as JSON Schema.
const string={type:'string'}, nonempty={type:'string',minLength:1}, boolean={type:'boolean'};
const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
const estimate=object({minimum:{type:'number',minimum:0},likely:{type:'number',minimum:0},maximum:{type:'number',minimum:0}},['minimum','likely','maximum']);
const node=object({id:nonempty,name:nonempty,content:string,ownerName:string},['id','name']);
const edgeFields={fromNodeId:nonempty,toNodeId:nonempty,estimateDays:estimate,dashed:boolean,executor:string,actualCompleteDate:string};
const planFields={title:nonempty,number:nonempty,owner:nonempty,startDate:string,deadlineDate:string,status:{const:'draft'},nodes:{type:'array',items:node},edges:{type:'array',items:object(edgeFields,['fromNodeId','toNodeId','estimateDays'])}};
export const parameterSchemas={
 'plan.create':object(planFields,['title','number']),
 'plan.update':object({set:object({title:nonempty,startDate:string,deadlineDate:string})},['set']),
 'plan.replace':object({...planFields,replace:{const:true}},['title','nodes','edges','replace']),
 'plan.copy':object({number:nonempty,owner:nonempty,title:nonempty},['number']),
 'plan.delete':object({permanent:boolean}),
 'plan.restoreSnapshot':object({backupId:nonempty},['backupId']),
 'node.create':node,
 'node.update':object({id:nonempty,set:object({name:nonempty,content:string,owner:string})},['id','set']),
 'node.remove':object({id:nonempty},['id']),
 'node.batchUpdate':object({updates:{type:'array',items:object({id:nonempty,set:object({name:nonempty,content:string,owner:string})},['id','set'])}},['updates']),
 'node.renumber':object({mapping:{type:'array',items:object({from:nonempty,to:nonempty},['from','to'])},references:{type:'array',items:object({nodeId:nonempty,field:{enum:['name','content']},before:string,after:string},['nodeId','field','before','after'])}},['mapping']),
 'node.reorder':object({ids:{type:'array',items:nonempty,uniqueItems:true}},['ids']),
 'edge.create':object(edgeFields,['fromNodeId','toNodeId','estimateDays']),
 'edge.update':object(edgeFields,['fromNodeId','toNodeId']),
 'edge.remove':object({fromNodeId:nonempty,toNodeId:nonempty},['fromNodeId','toNodeId']),
 'task.merge':object({nodeIds:{type:'array',items:nonempty,uniqueItems:true},name:nonempty,content:string,owner:string,executor:string,allowMilestones:boolean},['nodeIds','name']),
 'task.split':object({fromNodeId:nonempty,toNodeId:nonempty,nodes:{type:'array',items:node},segments:{type:'array',items:object({estimateDays:estimate,executor:string,dashed:boolean},['estimateDays'])},allowDurationChange:boolean},['fromNodeId','toNodeId','nodes','segments']),
 'task.assign':object({fromNodeId:nonempty,toNodeId:nonempty,executor:string},['fromNodeId','toNodeId','executor']),
 'task.updateStatus':object({fromNodeId:nonempty,toNodeId:nonempty,actualCompleteDate:string},['fromNodeId','toNodeId','actualCompleteDate']),
 'progress.update':object({fromNodeId:nonempty,toNodeId:nonempty,actualCompleteDate:string},['fromNodeId','toNodeId','actualCompleteDate']),
 'review.reject':object({note:nonempty},['note']),
 'history.restore':object({targetRevision:{type:'integer',minimum:1}},['targetRevision']),
 'project.create':object({number:nonempty,name:nonempty,owner:nonempty},['number','name','owner']),
 'project.assignPlan':{...object({planId:nonempty,planIdFrom:object({stepId:nonempty,field:{const:'targetId'}},['stepId','field']),groupId:string},['groupId']),oneOf:[{required:['planId'],not:{required:['planIdFrom']}},{required:['planIdFrom'],not:{required:['planId']}}]},
 'group.create':object({name:nonempty},['name']),
 'group.update':object({groupId:nonempty,name:nonempty},['groupId','name']),
 'group.remove':object({groupId:nonempty},['groupId']),
 'group.assign':object({name:nonempty,groupId:string},['name','groupId']),
 'script.execute':object({source:nonempty,world:{enum:['MAIN','USER_SCRIPT']}},['source','world']),
 'system.logs':object({requestId:nonempty},['requestId']),
 'system.status':object({requestId:nonempty},['requestId']),
 'system.backup.get':object({backupId:nonempty},['backupId'])
};
parameterSchemas['schedule.updateInputs']=parameterSchemas['plan.update'];
parameterSchemas['progress.complete']=parameterSchemas['progress.update'];
for(const op of ['graph.inspect','graph.simplify','plan.list','plan.get','plan.export','plan.archive','plan.restore','node.list','edge.list','progress.read','review.status','review.submit','review.approve','history.list','project.list','group.list','task.list','user.list','site.session','system.version','system.health','system.capabilities','site.inspect','site.capabilities','site.context','site.tabs','site.compatibility'])parameterSchemas[op]=object({});
parameterSchemas['site.context']=object({projectGroups:{enum:['all','selected','omit']}});
for(const op of ['history.undo','history.redo'])parameterSchemas[op]=object({reviewToken:nonempty});
parameterSchemas['history.list']=object({});
parameterSchemas['history.pending']=object({});
parameterSchemas['history.preview']=object({direction:{enum:['undo','redo','point']},historyId:nonempty,point:{enum:['before','after']}},['direction']);
for(const op of ['history.diff','history.restorePoint'])parameterSchemas[op]=object({historyId:nonempty,point:{enum:['before','after']},...(op==='history.diff'?{compareId:nonempty}:{reviewToken:nonempty})},['historyId']);
parameterSchemas['history.resolvePending']=object({acknowledge:{const:true},reviewToken:nonempty},['acknowledge','reviewToken']);
parameterSchemas['site.html.begin']=object({kind:{enum:['raw','offline']}},['kind']);
parameterSchemas['site.html.chunk']=object({exportId:nonempty,offset:{type:'integer',minimum:0}},['exportId','offset']);
parameterSchemas['site.html.release']=object({exportId:nonempty},['exportId']);
parameterSchemas['task.merge'].description='仅支持按顺序列出的至少三个连续链节点；保留首尾、删除中间节点。中间节点必须各一入一出且无分支，首尾不能已有直接边；已有基线或链上完成进度不能直接合并。分支合并须明确映射、估时与外部依赖后使用 plan.batch，不可强行串联。';
export const batchOperations=['plan.update','schedule.updateInputs','node.create','node.update','node.batchUpdate','node.renumber','node.remove','node.reorder','edge.create','edge.update','edge.remove','graph.simplify','task.merge','task.split'];
parameterSchemas['plan.batch']=object({changes:{type:'array',minItems:1,maxItems:100,items:{oneOf:batchOperations.map(op=>object({op:{const:op},params:parameterSchemas[op]},['op','params']))}}},['changes']);
function invalid(path){throw Object.assign(Error('参数不符合约束：'+path),{code:'INVALID_SCHEMA'});}
export function checkSchema(schema,value,path='$'){
 if(schema.oneOf){const matches=schema.oneOf.filter(choice=>{try{checkSchema(choice,value,path);return true;}catch{return false;}});if(matches.length!==1)invalid(path);}
 if(schema.not){let match=true;try{checkSchema(schema.not,value,path);}catch{match=false;}if(match)invalid(path);}
 if(schema.required&&value&&typeof value==='object')for(const key of schema.required)if(!Object.hasOwn(value,key))invalid(path+'.'+key);
 if(schema.const!==undefined&&value!==schema.const)invalid(path);
 if(schema.enum&&!schema.enum.includes(value))invalid(path);
 if(schema.type){const actual=Array.isArray(value)?'array':value===null?'null':typeof value;if(schema.type==='integer'?!Number.isInteger(value):actual!==schema.type)invalid(path);}
 if(typeof value==='number'&&(!Number.isFinite(value)||schema.minimum!==undefined&&value<schema.minimum||schema.maximum!==undefined&&value>schema.maximum))invalid(path);
 if(schema.minLength!==undefined&&value.length<schema.minLength)invalid(path);
 if(schema.type==='object'){for(const key of schema.required||[])if(!Object.hasOwn(value,key))invalid(path+'.'+key);for(const[k,v]of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))invalid(path+'.'+k);if(schema.properties?.[k])checkSchema(schema.properties[k],v,path+'.'+k);else if(schema.additionalProperties===false)invalid(path+'.'+k);}}
 if(schema.type==='array'){if(schema.minItems!==undefined&&value.length<schema.minItems||schema.maxItems!==undefined&&value.length>schema.maxItems)invalid(path);if(schema.uniqueItems&&new Set(value.map(x=>JSON.stringify(x))).size!==value.length)invalid(path);if(schema.items)value.forEach((v,i)=>checkSchema(schema.items,v,path+'['+i+']'));}
 return value;
}
export function validateStep(s){
 if(s.target?.version!==undefined&&s.target?.versionFrom!==undefined)invalid('版本依据只能选择version或versionFrom之一');
 if(parameterSchemas[s.op])checkSchema(parameterSchemas[s.op],s.params||{},s.op);
 if(s.target!==undefined)checkSchema(object({id:nonempty,number:nonempty,owner:nonempty,version:{type:'integer',minimum:0},versionFrom:nonempty}),s.target,'target');
 if(/^(node|edge|progress|review|graph)\./.test(s.op)||['task.merge','task.split','task.assign','task.updateStatus','plan.batch','plan.get','plan.update','plan.replace','plan.copy','plan.export','plan.archive','plan.delete','plan.restore','plan.restoreSnapshot','schedule.updateInputs','history.restore'].includes(s.op)){
  if(!s.target?.id&&!s.target?.number)invalid('target.id 或 target.number');
 }
}
