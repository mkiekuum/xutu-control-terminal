import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {websiteGuide,readNativeAnalysis} from '../extension/website-guide.js';
import {buildPrompt} from '../extension/terminal.js';

test('新AI提示词包含网站模型、真实评分依据和禁止缩短原数字的规则',()=>{
 const prompt=buildPrompt('改善当前计划',{websiteGuide,siteAnalysis:{available:true,score:{score:36}}},1);
 for(const text of ['双代号','siteAnalysis','不能为了提分缩短','不能删工作骗分','权限']){
  assert(prompt.includes(text),text);
 }
 assert.equal(websiteGuide.scoring.defaultThresholds.longDays,14);
 assert(prompt.includes('"score":36'));
});

test('评分函数可序列化到MAIN世界，使用当前网页规则并返回原生计算',()=>{
 const plan=Object.freeze({nodes:[],edges:[]}),seen=[];
 const sandbox={plan,document:{querySelectorAll(selector){assert.equal(selector,'.score-rules input');return [{name:'longDays',value:'28'},{name:'serialEdges',value:'6'}];}},scorePlan(p,r){assert.equal(p,plan);seen.push(r);return {score:87,findings:[]};},validatePlan(p){assert.equal(p,plan);return {total:12,finish:15,critical:new Set([1]),schedule:[{te:0,tl:3,slack:3}],nodeCompletion:new Map([['end',12]])};},PlanProgress:{completionRate(){return 25;}}};
 const result=vm.runInNewContext('('+readNativeAnalysis.toString()+')(plan)',sandbox);
 assert.equal(result.available,true);assert.equal(result.rules.longDays,28);assert.equal(seen.length,1);assert.equal(result.score.score,87);assert.equal(result.calculation.totalDays,12);assert.equal(result.calculation.nodeCompletion.end,12);assert.equal(result.calculation.criticalEdgeIndexes[0],1);assert.equal(result.completionRate,25);assert.equal(JSON.parse(JSON.stringify(result)).calculation.schedule[0].slack,3);
});

test('原生评分接口缺失或抛错时明确标记不可用',()=>{
 const source='('+readNativeAnalysis.toString()+')({})';
 assert.equal(vm.runInNewContext(source,{}).available,false);
 const result=vm.runInNewContext(source,{scorePlan(){},validatePlan(){throw Error('site changed');},document:{querySelectorAll(){return [];}}});
 assert.equal(result.available,false);assert.equal(result.reason,'site changed');
});
