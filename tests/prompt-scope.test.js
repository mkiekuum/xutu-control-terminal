import test from 'node:test';import assert from 'node:assert/strict';import Ajv from 'ajv/dist/2020.js';
import {collectContext} from '../extension/context.js';
import {projectGroupMode,scopePromptContext,promptContracts} from '../extension/prompt-context.js';
import {buildPrompt} from '../extension/terminal.js';
import {parameterSchemas,validateStep} from '../extension/validation.js';
import {aiInstructions,drawingRules} from '../extension/ai-brief.js';
import {websiteGuide} from '../extension/website-guide.js';
import {collectCompatibility} from '../extension/compatibility.js';

const groups=[{id:'G1',name:'相关合成项目',owner:'OWNER'},{id:'G2',name:'无关合成项目',owner:'OTHER'}];
const record={id:'P',revision:9,projectGroupId:'G1',review:{status:'submitted'},current:{title:'计划',planNumber:'SYNTH',planOwner:'OWNER',start:'2026-11-11',deadline:'2026-11-20',baseline:{confirmed:true},positions:{1:{x:2,y:3}},nodes:[{id:'1',name:'原名称',content:'原正文',owner:'OWNER'}],edges:[]}};
function fixture({groupId='G1',groupError=false}={}){const paths=[],plan={...structuredClone(record),projectGroupId:groupId};return {paths,plan,request:async path=>{paths.push(path);if(path==='/api/session')return {actor:'OWNER',role:'user'};if(path==='/api/project-groups'){if(groupError)throw Error('unavailable');return structuredClone(groups);}if(path==='/api/work-tasks'||path.endsWith('/forecast-log'))return [];return structuredClone(plan);}};}

test('普通微调只附当前关联组；不改完整计划、审核、日期或布局',async()=>{
 const f=fixture(),context=await collectContext(f.request,{id:'P'},{projectGroups:'selected'});assert(context.complete);assert.deepEqual(context.projectGroups,[groups[0]]);assert.deepEqual(context.plan,f.plan);
 const prompt=buildPrompt('只微调名称',context,1,{intent:'manage'});assert(prompt.includes('相关合成项目'));assert(!prompt.includes('无关合成项目'));assert(prompt.includes(JSON.stringify(f.plan)));assert(prompt.includes('不表示没有其他项目组'));
});
test('无关联组的微调与不涉及分组的新建不读取完整清单',async()=>{
 for(const mode of ['selected','omit']){const f=fixture({groupId:'',groupError:true}),context=await collectContext(f.request,{id:'P'},{projectGroups:mode});assert(context.complete);assert(!f.paths.includes('/api/project-groups'));assert.deepEqual(context.projectGroups,[]);}
 assert.equal(projectGroupMode('新建一个产品计划','create'),'omit');assert.equal(projectGroupMode('改名称','manage'),'selected');for(const request of ['只改标题，不修改分组','改名，项目组保持不变','无需设置项目组','项目组不动'])assert.equal(projectGroupMode(request,'manage'),'selected',request);
});
test('明确分组需求附完整可见清单；未取得清单不会冒称没有项目组',async()=>{
 for(const request of ['分配到项目组','移到 PRJ-0097','调整分组','读取 project.list'])assert.equal(projectGroupMode(request,'manage'),'all');
 const f=fixture(),c=await collectContext(f.request,{id:'P'},{projectGroups:'all'});assert.deepEqual(c.projectGroups,groups);assert(buildPrompt('调整所属项目',c,1,{intent:'manage'}).includes('无关合成项目'));
 const failed=fixture({groupError:true}),unknown=await collectContext(failed.request,{id:'P'},{projectGroups:'all'});assert.equal(unknown.complete,false);assert.equal(unknown.projectGroups,null);assert(unknown.warnings.some(w=>w.includes('未核实')));
});
test('旧site.context默认仍完整；复制旧上下文时再次筛选且不改变源对象',async()=>{
 const f=fixture(),c=await collectContext(f.request,{id:'P'}),before=structuredClone(c);assert.deepEqual(c.projectGroups,groups);
 const scoped=scopePromptContext(c,'只改名称','manage');assert.deepEqual(scoped.projectGroups,[groups[0]]);assert.deepEqual(c,before);assert.deepEqual(scopePromptContext(c,'新建计划','create').projectGroups,[]);
 for(const mode of ['all','selected','omit'])validateStep({id:'c',op:'site.context',params:{projectGroups:mode}});assert.throws(()=>validateStep({id:'c',op:'site.context',params:{projectGroups:'unknown'}}));
});
test('批量Schema引用与展开契约同样接受和拒绝参数，不放宽约束',()=>{
 const contracts=promptContracts(),ajv=new Ajv({strict:false});ajv.addSchema({...contracts,$id:'urn:xutu:prompt'});const check=ajv.compile({$ref:'urn:xutu:prompt#/plan.batch'});
 const cases=[{changes:[{op:'node.update',params:{id:'1',set:{name:'A'}}}]},{changes:[{op:'edge.create',params:{fromNodeId:'1',toNodeId:'2',estimateDays:{minimum:1,likely:2,maximum:3}}}]},{changes:[{op:'node.update',params:{id:'1',set:{unsupported:1}}}]},{changes:[]},{changes:[{op:'plan.delete',params:{}}]},{changes:[{op:'node.update',params:{set:{name:'A'}}}]},{changes:[{op:'edge.create',params:{fromNodeId:'1',toNodeId:'2'}}]}];
 for(const params of cases){let expected=true;try{validateStep({id:'b',op:'plan.batch',target:{id:'P',version:1},params});}catch{expected=false;}assert.equal(check(params),expected,JSON.stringify(params));}
 assert.deepEqual(Object.keys(contracts),Object.keys(parameterSchemas).filter(k=>k!=='script.execute'));
 assert(JSON.stringify(contracts).length<JSON.stringify(parameterSchemas).length*0.8);
});
test('draw.io规则只复制一次，Schema保留所有命令，合并限制及执行确认表述一致',()=>{
 const prompt=buildPrompt('调整计划',{websiteGuide,plan:record,projectGroups:groups,complete:true},1,{intent:'manage'});
 assert.equal(prompt.split(drawingRules).length-1,1);assert(prompt.includes('各一入一出'));assert(prompt.includes('保留首尾，删除中间节点'));assert(prompt.includes('$ref'));assert(prompt.includes('使用者确认后执行'));
 assert(!prompt.includes('点击“执行”会直接执行'));assert(!JSON.stringify(websiteGuide).includes('执行按钮默认直接执行'));assert(!prompt.includes('当前账号明确保存的偏好'));assert(aiInstructions.includes('不擅自扣除混合工作中的时间'));
});
test('兼容报告不再声称存在问卷门禁或已验证全部功能',async()=>{
 const r=await collectCompatibility({inspect:async()=>({}),session:async()=>({actor:'OWNER'}),plans:async()=>[],probe:async()=>({}),userScripts:async()=>false});const local=r.checks.find(x=>x.id==='localFeatures');assert(!local.message.includes('问卷'));assert(local.message.includes('不代表'));assert.equal(local.status,'optional');
});
