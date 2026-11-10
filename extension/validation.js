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
 'project.assignPlan':object({planId:nonempty,groupId:string},['planId','groupId']),
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
function invalid(path){throw Object.assign(Error('参数不符合约束：'+path),{code:'INVALID_SCHEMA'});}
export function checkSchema(schema,value,path='$'){
 if(schema.const!==undefined&&value!==schema.const)invalid(path);
 if(schema.enum&&!schema.enum.includes(value))invalid(path);
 if(schema.type){const actual=Array.isArray(value)?'array':value===null?'null':typeof value;if(schema.type==='integer'?!Number.isInteger(value):actual!==schema.type)invalid(path);}
 if(typeof value==='number'&&(!Number.isFinite(value)||schema.minimum!==undefined&&value<schema.minimum||schema.maximum!==undefined&&value>schema.maximum))invalid(path);
 if(schema.minLength!==undefined&&value.length<schema.minLength)invalid(path);
 if(schema.type==='object'){for(const key of schema.required||[])if(!Object.hasOwn(value,key))invalid(path+'.'+key);for(const[k,v]of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))invalid(path+'.'+k);if(schema.properties?.[k])checkSchema(schema.properties[k],v,path+'.'+k);else if(schema.additionalProperties===false)invalid(path+'.'+k);}}
 if(schema.type==='array'){if(schema.uniqueItems&&new Set(value.map(x=>JSON.stringify(x))).size!==value.length)invalid(path);if(schema.items)value.forEach((v,i)=>checkSchema(schema.items,v,path+'['+i+']'));}
 return value;
}
export function validateStep(s){
 if(s.target?.version!==undefined&&s.target?.versionFrom!==undefined)invalid('版本依据只能选择version或versionFrom之一');
 if(parameterSchemas[s.op])checkSchema(parameterSchemas[s.op],s.params||{},s.op);
 if(s.target!==undefined)checkSchema(object({id:nonempty,number:nonempty,owner:nonempty,version:{type:'integer',minimum:0},versionFrom:nonempty}),s.target,'target');
 if(/^(node|edge|progress|review|graph)\./.test(s.op)||['task.merge','task.split','task.assign','task.updateStatus','plan.get','plan.update','plan.replace','plan.copy','plan.export','plan.archive','plan.delete','plan.restore','plan.restoreSnapshot','schedule.updateInputs','history.restore'].includes(s.op)){
  if(!s.target?.id&&!s.target?.number)invalid('target.id 或 target.number');
 }
}
