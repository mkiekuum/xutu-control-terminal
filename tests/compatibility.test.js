import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {collectCompatibility,formatCompatibility,probeNativeCompatibility} from '../extension/compatibility.js';
const good=()=>({inspect:async()=>({origin:'https://plan.fpgabbs.cn',anchors:Object.fromEntries(['planOwner','planNumber','title','new','nodeSubmit','edgeSubmit','rows'].map(id=>[id,1])),activeTarget:{number:'PRIVATE_PLAN'}}),session:async()=>({actor:'PRIVATE_PERSON',role:'user',token:'PRIVATE_TOKEN'}),plans:async()=>[{id:'PRIVATE_ID',revision:1,title:'PRIVATE_TITLE'}],probe:async()=>({calculation:true,samplePassed:true,scoring:true,progress:true}),userScripts:async()=>true,nativeConnected:true});
test('兼容报告只读通过且不泄露账号、计划或凭据',async()=>{
 const report=await collectCompatibility(good());assert.equal(report.status,'ok');assert.equal(report.checks.length,10);
 for(const value of [JSON.stringify(report),formatCompatibility(report)])assert(!value.includes('PRIVATE_'));
 assert(formatCompatibility(report).includes('基础只读检查通过'));assert(formatCompatibility(report).includes('不是全站兼容'));
});
test('未登录、读取失败、重复锚点和计算变化分别报告，不能误报兼容',async()=>{
 const input=good();input.session=()=>{throw Error('PRIVATE_ERROR');};input.plans=async()=>({items:[]});input.probe=async()=>({calculation:true,samplePassed:false,scoring:false,progress:false});input.inspect=async()=>({origin:'https://plan.fpgabbs.cn',anchors:{title:2}});
 const report=await collectCompatibility(input);assert.equal(report.status,'limited');for(const id of ['session','readApi','target','calculation','scoring'])assert.equal(report.checks.find(c=>c.id===id).status,'warning');assert(!JSON.stringify(report).includes('PRIVATE_ERROR'));
 input.inspect=async()=>{throw Error('disconnected');};assert.equal((await collectCompatibility(input)).status,'unavailable');
});
test('用户脚本为可选项，不会把正常JSON终端误判为不兼容',async()=>{
 const report=await collectCompatibility({...good(),nativeConnected:false,userScripts:async()=>{throw Error('permission');}});assert.equal(report.status,'ok');assert.equal(report.checks.find(c=>c.id==='javascript').status,'optional');assert(!report.checks.some(c=>c.id==='native'));
});
test('MAIN世界合成探针调用原生函数且不操作真实计划',()=>{
 let calls=0;const result=vm.runInNewContext('('+probeNativeCompatibility.toString()+')()', {scorePlan(){},PlanProgress:{completionRate(){}},validatePlan(p){calls++;assert.equal(p.edges.length,1);assert.equal(p.edges[0].upper,'1-1-1');assert.equal(p.planOwner,'');return {total:1,schedule:[{te:0}]};}});
 assert.equal(calls,1);assert.equal(result.samplePassed,true);
 assert.equal(vm.runInNewContext('('+probeNativeCompatibility.toString()+')()',{}).calculation,false);
});
