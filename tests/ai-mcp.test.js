import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
import {generateCommand,providerURL} from '../extension/ai.js';
const config={baseURL:'https://ai.example.test/v1',apiKey:'SYNTHETIC_KEY',model:'synthetic-model',prompt:'列出我的计划'};
function provider(command,check=()=>{}){return async(url,options)=>{check(url,options);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(command)}}]})};};}
const result=steps=>({protocol:'xutu.command/v1',requestId:'ai-generated',steps});
test('AI默认不发送网站数据，Key只进指定服务请求头，生成结果固定预览',async()=>{
 const command=await generateCommand(config,provider(result([{id:'s',op:'plan.list'}]),(url,o)=>{assert.equal(url.href,'https://ai.example.test/v1/chat/completions');assert.equal(o.headers.Authorization,'Bearer SYNTHETIC_KEY');assert(!o.body.includes('SYNTHETIC_KEY'));assert.equal(JSON.parse(o.body).messages.length,2);assert.equal(o.redirect,'error');}));
 assert.equal(command.mode,'preview');assert.notEqual(command.requestId,'ai-generated');
});
test('AI返回脚本、未知操作或拼错字段时拒绝',async()=>{
 for(const step of [{id:'s',op:'script.execute',params:{source:'document.cookie',world:'MAIN'}},{id:'s',op:'user.destroy'},{id:'s',op:'plan.update',target:{id:'TEST'},params:{set:{titel:'bad'}}}])await assert.rejects(generateCommand(config,provider(result([step]))));
});
test('AI接口拒绝远端明文HTTP及URL内嵌凭据，允许本机模型',()=>{
 assert.throws(()=>providerURL('http://remote.example/v1'));assert.throws(()=>providerURL('https://user:pass@ai.example/v1'));assert.equal(providerURL('http://127.0.0.1:1234/v1').pathname,'/v1/chat/completions');
});
test('AI错误不回显服务端敏感正文',async()=>{
 await assert.rejects(generateCommand(config,async()=>({ok:false,status:401,text:async()=> 'SECRET_SERVER_DETAILS'})),e=>e.code==='AI_PROVIDER_ERROR'&&!e.message.includes('SECRET_SERVER_DETAILS'));
});
test('MCP实际stdio客户端：初始化、工具发现、契约读取与脚本拦截',{timeout:15000},async()=>{
 const messages=[{id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'synthetic-test',version:'1'}}},{method:'notifications/initialized'},{id:2,method:'tools/list'},{id:3,method:'resources/read',params:{uri:'xutu://contracts'}},{id:4,method:'tools/call',params:{name:'xutu_run',arguments:{command:result([{id:'js',op:'script.execute',params:{world:'MAIN',source:'document.title'}}])}}}].map(m=>JSON.stringify({jsonrpc:'2.0',...m})).join('\n')+'\n';
 const output=await new Promise((resolve,reject)=>{const c=spawn(process.execPath,['native-host/mcp.mjs'],{windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='';const timer=setTimeout(()=>{c.kill();reject(Error('MCP timeout'));},10000);c.stdout.on('data',x=>out+=x);c.stderr.on('data',x=>err+=x);c.on('error',reject);c.on('close',code=>{clearTimeout(timer);code===0?resolve(out):reject(Error(err));});c.stdin.end(messages);});
 const responses=output.trim().split('\n').map(x=>JSON.parse(x));assert.equal(responses.length,4);assert.equal(responses[0].result.serverInfo.name,'xutu-terminal');assert.equal(responses[1].result.tools[0].name,'xutu_run');assert(responses[2].result.contents[0].text.includes('plan.create'));assert.equal(responses[3].result.isError,true);assert(responses[3].result.content[0].text.includes('MCP_SCRIPT_DISABLED'));
});
