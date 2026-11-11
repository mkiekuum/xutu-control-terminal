import test from 'node:test';import assert from 'node:assert/strict';import {collectContext} from '../extension/context.js';
const record={id:'TEST',revision:8,review:{status:'approved'},current:{title:'Synthetic',planOwner:'OWNER',planNumber:'N-1',start:'2026-11-10',deadline:'',baseline:{confirmed:true},nodes:[{id:'1',name:'A'},{id:'2',name:'B'}],edges:[{from:'1',to:'2',upper:'1-2-3',dashed:false,completedAt:'2026-11-11',executor:'ASSIGNEE'}]}};
test('上下文完整保留计划、审核、基线、完成日期、任务权限与契约',async()=>{
 const paths=[];const context=await collectContext(async path=>{paths.push(path);if(path==='/api/session')return {actor:'OWNER',role:'user',password:'not-exported'};if(path==='/api/project-groups')return [{id:'G',name:'Synthetic'}];if(path==='/api/work-tasks')return [{planId:'TEST',revision:8,canAssign:true,canComplete:false},{planId:'OTHER',revision:1}];if(path.endsWith('/forecast-log'))return [{newDate:'2026-11-12'}];return structuredClone(record);},{id:'TEST'});
 assert.equal(context.complete,true);assert.deepEqual(context.plan,record);assert.equal(context.target.version,8);assert.equal(context.status.review.status,'approved');assert.equal(context.status.completedEdges,1);assert.equal(context.workTasks.length,1);assert.equal(context.workTasks[0].canAssign,true);assert.equal(context.permissions.canRequestReview,false);assert(context.commandContract.parameters['task.merge']);assert(!JSON.stringify(context).includes('not-exported'));assert.equal(paths.filter(p=>p==='/api/plans/TEST').length,2);
});
test('部分状态读取失败或版本变化必须显式报告不完整',async()=>{
 let reads=0;const context=await collectContext(async path=>{if(path==='/api/session')return {actor:'OWNER',role:'user'};if(path==='/api/project-groups')return [{id:'G',name:'Synthetic'}];if(path==='/api/work-tasks')throw Error('offline');if(path.endsWith('/forecast-log'))return [];reads++;return {...structuredClone(record),revision:reads===1?8:9};},{id:'TEST'});
 assert.equal(context.complete,false);assert.equal(context.warnings.length,2);assert.equal(context.target.version,8);
});
test('未选择计划时不擅自附带其他人的计划',async()=>{
 const paths=[];const context=await collectContext(async path=>{paths.push(path);return {actor:'OWNER',role:'user'};},{});assert.deepEqual(paths,['/api/session','/api/project-groups']);assert.equal(context.plan,null);assert.equal(context.complete,false);
});
test('上下文未登录直接拒绝',async()=>{await assert.rejects(()=>collectContext(async()=>({}),{id:'TEST'}),{code:'NOT_LOGGED_IN'});});
