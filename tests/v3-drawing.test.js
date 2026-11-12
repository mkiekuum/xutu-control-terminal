import test from 'node:test';import assert from 'node:assert/strict';
import {buildPrompt,prepareCommand} from '../extension/terminal.js';
import {drawingRules} from '../extension/ai-brief.js';
import {parameterSchemas} from '../extension/validation.js';
import {site,integrated,envelope} from './v25-helpers.js';

// These verify supplied prompt policy and executable synthetic examples, not an external AI's answers.
test('清晰图纸的合成JSON样例可执行且名称正文依赖保持，不以图形对象ID替代成果编号',async()=>{
 const web=site(),{executor}=integrated(web);const names=['需求确认','样机验证','方案定稿'],contents=['用户确认原文一','用户确认原文二','用户确认原文三'];
 const command=envelope([{id:'new',op:'plan.create',params:{title:'合成图纸',number:'DRAW-SYNTH',nodes:names.map((name,i)=>({id:String(i+1),name,content:contents[i]})),edges:[{fromNodeId:'1',toNodeId:'2',estimateDays:{minimum:1,likely:2,maximum:3}},{fromNodeId:'2',toNodeId:'3',estimateDays:{minimum:2,likely:3,maximum:4}}]}}]);
 const parsed=prepareCommand('```json\n'+JSON.stringify(command)+'\n```',123,'unused'),r=await executor.run(parsed);assert.equal(r.status,'success');const p=web.records.get(r.steps[0].targetId).current;assert.deepEqual(p.nodes.map(n=>n.name),names);assert.deepEqual(p.nodes.map(n=>n.content),contents);assert.deepEqual(p.edges.map(e=>[e.from,e.to]),[['1','2'],['2','3']]);
});
test('图纸歧义、无法辨认、未提供图纸必须先核实；问卷无固定题数且简单修改不追问',()=>{
 for(const text of ['没有图纸不得声称已读取','只有模糊图片时不得编造关系','只问与本次操作相关的问题','不强制固定题数','简单文字修改不发无关问卷','不能将 draw.io 图形对象 ID 当作网站节点编号','多前置必须约束工作开始','正工期跨级边','同一执行人不等于业务必须串行'])assert(drawingRules.includes(text),text);
 const prompt=buildPrompt('只将节点1名称改为需求确认',null,123,{intent:'manage'});assert(prompt.includes(drawingRules));assert(prompt.includes('原样保留name/content'));assert(!prompt.includes('首轮必须3–6'));
});
test('复制提示词列出的命令均来自真实注册契约，draw.io没有新增导入器',()=>{
 const prompt=buildPrompt('依据已给的图纸新建',null,123,{intent:'create'});const contracts=JSON.parse(prompt.split('\n参数契约：')[1].split('\n')[0]);assert.deepEqual(Object.keys(contracts),Object.keys(parameterSchemas).filter(op=>op!=='script.execute'));assert(!contracts['drawio.import']);assert(!contracts['script.execute']);assert(drawingRules.includes('一个完整可复制 JSON 代码块'));
});
