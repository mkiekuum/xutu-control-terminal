import {parameterSchemas,batchOperations} from './validation.js';

export function needsProjectGroups(request){
 const relevant=request.replace(/(?:不(?:要|用|需)?|无需)(?:修改|调整|改变|更改|改|设置|读取)?(?:任何|现有|当前)?(?:项目组|分组)(?:信息|设置)?/g,'').replace(/(?:项目组|分组)(?:保持不变|保持原样|不变|不动)/g,'');
 return /项目组|分组|所属项目|归属项目|归入|划入|project\.(?:list|assignPlan|create)|\bPRJ-\d+/i.test(relevant);
}
export function projectGroupMode(request,intent){return needsProjectGroups(request)?'all':intent==='create'?'omit':'selected';}

// Copying a prompt may receive an older full context. Apply the same disclosure boundary here.
export function scopePromptContext(context,request,intent){
 if(!context)return null;
 const result=Object.fromEntries(Object.entries(context).filter(([key])=>!['websiteGuide','commandContract','aiGuidance','preferences'].includes(key)));
 if(!Object.hasOwn(result,'projectGroups'))return result;
 const mode=projectGroupMode(request,intent),groups=result.projectGroups,groupId=context.plan?.projectGroupId;
 if(mode!=='all')result.projectGroups=Array.isArray(groups)?groups.filter(g=>mode==='selected'&&g.id===groupId):null;
 result.projectGroupScope={mode,notice:mode==='all'?'本次需求涉及项目组；清单仅是已读取的可见范围，操作仍由服务器授权。':'完整项目组清单未附带，不表示没有其他项目组。需要另选分组时先用 project.list 核实，不能猜名称或ID。'};
 return result;
}

export function promptContracts(){
 const contracts=Object.fromEntries(Object.entries(parameterSchemas).filter(([op])=>op!=='script.execute'));
 // The same actual schemas stay present once. References resolve within this commands object.
 contracts['plan.batch']={...contracts['plan.batch'],properties:{flowCheck:{$ref:'#/plan.create/properties/flowCheck'},changes:{...contracts['plan.batch'].properties.changes,items:{oneOf:batchOperations.map(op=>({type:'object',properties:{op:{const:op},params:{$ref:'#/'+op}},required:['op','params'],additionalProperties:false}))}}}};
 return contracts;
}
