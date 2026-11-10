import test from 'node:test';import assert from 'node:assert/strict';import {equivalent} from '../extension/core.js';import {ApiAdapter} from '../extension/api.js';
test('服务端回读忽略对象字段序列化顺序，仍严格核对值和数组顺序',()=>{assert(equivalent([{dashed:false,executor:''}],[{executor:'',dashed:false}]));assert(!equivalent([{dashed:false}],[{dashed:true}]));assert(!equivalent([1,2],[2,1]));assert(!equivalent({a:1},{a:1,b:2}));});
test('真实站点字段顺序回归：创建时服务器规范化键顺序不会误报保存失败',async()=>{
 let record;const api=new ApiAdapter(async(path,method,body)=>{if(path==='/api/session')return {actor:'TEST',role:'user'};if(method==='POST'){record={id:body.id,revision:1,current:structuredClone(body.current)};record.current.edges=record.current.edges.map(e=>({from:e.from,to:e.to,upper:e.upper,lower:e.lower,executor:e.executor,dashed:e.dashed,completedAt:e.completedAt}));}return record;});
 const r=await api.run({id:'create',op:'plan.create',params:{number:'TEST',title:'Synthetic',nodes:[{id:'1',name:'开始'},{id:'2',name:'成果'}],edges:[{fromNodeId:'1',toNodeId:'2',estimateDays:{minimum:1,likely:2,maximum:3}}]}},{requestId:'order-test',mode:'execute'});assert.equal(r.serverVerified,true);
});
test('显式节点排序走已核实的import接口，保留编号而不是普通change的旧节点顺序',async()=>{
 let record={id:'TEST',revision:1,current:{version:2,title:'Synthetic',planOwner:'TEST',planNumber:'TEST-1',start:'',deadline:'',nodes:[{id:'1',name:'A'},{id:'3',name:'C'},{id:'2',name:'B'}],edges:[],positions:{}}};
 const api=new ApiAdapter(async(path,method,body)=>{if(path==='/api/session')return {actor:'TEST',role:'user'};if(method==='POST'){assert.equal(path,'/api/plans/TEST/import');record={...record,current:body.current,revision:2};}return structuredClone(record);});
 const result=await api.run({id:'order',op:'node.reorder',target:{id:'TEST'},params:{ids:['1','2','3']}},{requestId:'order-import',mode:'execute'});assert.equal(result.serverVerified,true);assert.deepEqual(result.data.current.nodes.map(n=>n.id),['1','2','3']);
});
