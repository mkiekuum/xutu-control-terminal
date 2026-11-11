import {batchOperations,validateStep} from './validation.js';
// Only normalize a single-plan, all-or-stop editing envelope; retain request identity.
export function compactPlanEdits(command){
 if(command.execution?.continueOnError||command.steps.length<2)return command;
 const steps=command.steps,first=steps[0],target=first.target;
 if(!target?.id||!Number.isInteger(target.version)||target.versionFrom!==undefined)return command;
 const edits=steps.at(-1).op==='plan.get'?steps.slice(0,-1):steps;
 if(edits.length<2||edits.length>100)return command;
 if(steps.some(s=>s.target?.id!==target.id||s.target?.owner!==target.owner||s.target?.number!==target.number))return command;
 for(const [i,s] of edits.entries()){
  if(!batchOperations.includes(s.op))return command;
  validateStep(s);
  if(i&&!(s.target.version===target.version&&s.target.versionFrom===undefined||s.target.version===undefined&&s.target.versionFrom===edits[i-1].id))return command;
  if(s.dependsOn?.some(id=>!edits.slice(0,i).some(x=>x.id===id)))return command;
 }
 return {...command,steps:[{id:first.id,op:'plan.batch',target:{...target},params:{changes:edits.map(({op,params})=>({op,params:params||{}}))}}]};
}
