import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {installSidebarUI} from '../extension/sidebar-ui.js';import {McpGate,readOnly,mcpPrompt} from '../extension/mcp-policy.js';import {createRelay} from '../mcp/relay.mjs';import {relayUrl,startMcpBridge} from '../extension/mcp-bridge.js';
const cmd=(op='plan.get')=>({protocol:'xutu.command/v1',requestId:crypto.randomUUID(),steps:[{id:'a',op,target:{id:'P',version:1},params:op==='plan.update'?{set:{title:'New'}}:{}}]});
test('左侧栏禁悬停、点击展开、四种关闭和卸载恢复，不触碰业务节点',async()=>{
 const dom=new JSDOM('<div id="fileSidebar" class="is-collapsed"><button id="fileSidebarToggle">计划</button><button id="fileSidebarPin">固定</button><div>业务列表</div></div><main id="outside">图</main>');const d=dom.window.document,p=d.getElementById('fileSidebar'),t=d.getElementById('fileSidebarToggle');let hovered=0;p.addEventListener('pointerenter',()=>hovered++);const ui=installSidebarUI(d);
 p.dispatchEvent(new dom.window.Event('pointerenter'));assert.equal(hovered,0);assert(p.classList.contains('is-collapsed'));
 for(const close of [()=>t.click(),()=>d.getElementById('outside').click(),()=>d.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape'})),()=>d.getElementById('xutu-sidebar-close').click()]){t.click();assert(!p.classList.contains('is-collapsed'));close();assert(p.classList.contains('is-collapsed'));}
 t.click();p.classList.add('is-collapsed');await new Promise(r=>setTimeout(r,0));assert(!p.classList.contains('is-collapsed'));ui.destroy();assert.equal(t.textContent,'计划');assert.equal(p.className,'is-collapsed');p.dispatchEvent(new dom.window.Event('pointerenter'));assert.equal(hovered,1);assert.equal(d.querySelector('main').textContent,'图');dom.window.close();
});
test('网站锚点变化不乱改其他侧栏',()=>{const d=new JSDOM('<aside>Other</aside>');assert.equal(installSidebarUI(d.window.document).available,false);assert.equal(d.window.document.querySelector('aside').textContent,'Other');d.window.close();});
test('MCP 只读拒绝写，执行必须绑定成功预览及明确同意，执行后不重复',async()=>{
 const calls=[],gate=new McpGate(async c=>{calls.push(c);return {status:'success',steps:[{data:{after:{title:'New'}}}]};},async()=>'account:tab');
 await assert.rejects(gate.handle({kind:'read',command:cmd('plan.update')}));await assert.rejects(gate.handle({kind:'execute',previewJobId:'none',approval:'同意'}));
 const p=await gate.handle({id:'p',kind:'preview',command:cmd('plan.update')});assert.equal(calls[0].mode,'preview');assert.equal(p.previewJobId,'p');await assert.rejects(gate.handle({kind:'execute',previewJobId:'p',approval:''}));await gate.handle({kind:'execute',previewJobId:'p',approval:'同意本次改名'});assert.equal(calls[1].mode,'execute');assert.equal(calls[0].requestId,calls[1].requestId);await assert.rejects(gate.handle({kind:'execute',previewJobId:'p',approval:'同意'}));
});
test('MCP 不覆盖切换账号/过期预览，不给失败预览执行资格',async()=>{
 let actor='A',time=0;const gate=new McpGate(async()=>({status:'success',steps:[]}),async()=>actor,()=>time);await gate.handle({id:'p',kind:'preview',command:cmd('plan.update')});actor='B';await assert.rejects(gate.handle({kind:'execute',previewJobId:'p',approval:'同意'}));actor='A';time=300001;await assert.rejects(gate.handle({kind:'execute',previewJobId:'p',approval:'同意'}));
 const failed=new McpGate(async()=>({status:'failed',steps:[]}),async()=>'A');await failed.handle({id:'p',kind:'preview',command:cmd('plan.update')});assert.equal(failed.previews.size,0);
});
test('MCP 服务工作线程重建后仍可核对持久化预览；清理后无法重放',async()=>{
 const data=new Map(),persistence={get:async k=>data.get(k),save:async(k,v)=>data.set(k,v),remove:async k=>data.delete(k)},run=async()=>({status:'success',steps:[]});
 await new McpGate(run,async()=>'A',()=>0,persistence).handle({id:'p',kind:'preview',command:cmd('plan.update')});const restarted=new McpGate(run,async()=>'A',()=>1,persistence);await restarted.handle({kind:'execute',previewJobId:'p',approval:'同意'});assert.equal(data.size,0);
});
test('MCP 网络密钥分离、Origin、协议发现、队列、结果和重复execute去重',async()=>{
 const clientToken='c'.repeat(40),bridgeToken='b'.repeat(40),{server}=createRelay({clientToken,bridgeToken});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=async(path,body,token=clientToken,headers={})=>fetch(base+path,{method:'POST',headers:{'X-Xutu-Bridge-Id':'test-browser',Authorization:'Bearer '+token,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 const rpc=async(method,params)=>{const r=await post('/mcp',{jsonrpc:'2.0',id:1,method,params});return r.json();};
 try{
 assert.equal((await post('/mcp',{},'bad')).status,401);assert.equal((await post('/mcp',{},clientToken,{Origin:'https://evil.invalid'})).status,403);assert.equal((await fetch(base+'/bridge/next',{headers:{Authorization:'Bearer '+clientToken}})).status,401);
 assert.equal((await rpc('initialize',{})).result.protocolVersion,'2025-06-18');assert.equal((await rpc('tools/list',{})).result.tools.length,4);await fetch(base+'/bridge/next',{headers:{Authorization:'Bearer '+bridgeToken,'X-Xutu-Bridge-Id':'test-browser'}});
 const call=async(name,args)=>{const r=await rpc('tools/call',{name,arguments:args});return r.result;};assert((await call('xutu_read',{command:cmd('plan.update')})).isError);
 const queued=JSON.parse((await call('xutu_preview',{command:cmd('plan.update')})).content[0].text),pull=()=>fetch(base+'/bridge/next',{headers:{Authorization:'Bearer '+bridgeToken,'X-Xutu-Bridge-Id':'test-browser'}}).then(r=>r.json());const job=await pull();assert.equal(job.id,queued.jobId);assert.equal(await pull(),null);
 await post('/bridge/result',{id:job.id,result:{previewJobId:job.id}},bridgeToken);const a=JSON.parse((await call('xutu_execute',{previewJobId:job.id,approval:'同意'})).content[0].text),b=JSON.parse((await call('xutu_execute',{previewJobId:job.id,approval:'同意'})).content[0].text);assert.equal(a.jobId,b.jobId);
 }finally{await new Promise(r=>server.close(r));}
});
test('MCP 地址不接受凭据、路径、非加密远程；提示词不绑定AI品牌',()=>{
 for(const url of ['http://example.com','https://user:pass@example.com','https://example.com/mcp','https://example.com/?token=x'])assert.throws(()=>relayUrl(url));assert.throws(()=>relayUrl('https://example.com'));assert.equal(relayUrl('http://127.0.0.1:1'),'http://127.0.0.1:1');assert(mcpPrompt('test').includes('明确同意'));assert(!mcpPrompt('test').includes('Codex'));assert(readOnly(cmd()));
});

test('完整本地MCP桥：预览无写、明确同意后原执行器单次写入并回读',async()=>{
 const {site,integrated}=await import('./v25-helpers.js');const web=site();web.add('P');const run=integrated(web),clientToken='c'.repeat(40),bridgeToken='b'.repeat(40),{server}=createRelay({clientToken,bridgeToken});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port,values={mcpConnection:{url,token:bridgeToken,bridgeId:'e2e-browser',enabled:true}},storage={get:async k=>({[k]:values[k]}),set:async x=>Object.assign(values,x),remove:async k=>delete values[k]};const bridge=startMcpBridge({storage,run:c=>run.executor.run(c),identity:async()=>web.actor});
 const call=async(name,args)=>{const r=await fetch(url+'/mcp',{method:'POST',headers:{Authorization:'Bearer '+clientToken,'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})});const b=await r.json();assert(!b.result.isError,JSON.stringify(b));return JSON.parse(b.result.content[0].text);};
 try{await bridge.tick();const p=await call('xutu_preview',{command:cmd('plan.update')});await bridge.tick();const preview=await call('xutu_result',{jobId:p.jobId});assert.equal(preview.result.result.status,'success');assert.equal(web.calls.filter(c=>c.method==='POST').length,0);const e=await call('xutu_execute',{previewJobId:p.jobId,approval:'同意修改标题为 New'});await bridge.tick();const result=await call('xutu_result',{jobId:e.jobId});assert.equal(result.result.status,'success');assert(result.result.steps[0].serverVerified);assert.equal(web.calls.filter(c=>c.method==='POST').length,1);assert.equal(web.records.get('P').current.title,'New');assert.equal((await call('xutu_execute',{previewJobId:p.jobId,approval:'同意'})).jobId,e.jobId);}finally{await new Promise(r=>server.close(r));}
});

test('标准stdio适配器完成握手，stdout仅包含JSON-RPC且不输出密钥',async()=>{
 const {spawn}=await import('node:child_process');const token='stdio-client-'.repeat(4),{server}=createRelay({clientToken:token,bridgeToken:'stdio-bridge-'.repeat(4)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const child=spawn(process.execPath,['mcp/stdio.mjs'],{windowsHide:true,env:{...process.env,XUTU_MCP_URL:'http://127.0.0.1:'+server.address().port+'/mcp',XUTU_MCP_TOKEN:token},stdio:['pipe','pipe','pipe']});let output='',errors='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>errors+=b);child.stdin.end(JSON.stringify({jsonrpc:'2.0',id:42,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test-client',version:'1'}}})+'\n');await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(errors)));});const response=JSON.parse(output);assert.equal(response.id,42);assert.equal(response.result.protocolVersion,'2025-06-18');assert.equal(errors,'');assert(!output.includes(token));}finally{await new Promise(r=>server.close(r));}
});


test('连接导入只接受本机独立凭据，MCP提示词包含AI密钥但不含桥密钥',async()=>{
 const {parseConnection}=await import('../extension/mcp-connection.js');
 const clientToken='CLIENT_TEST_'.repeat(4),bridgeToken='BRIDGE_TEST_'.repeat(4),source={url:'http://127.0.0.1:62924',clientToken,bridgeToken,unexpected:'do not retain'};
 const c=parseConnection(JSON.stringify(source),123);assert.equal(c.token,bridgeToken);assert.equal(c.unexpected,undefined);assert.equal(c.tabId,123);
 const text=mcpPrompt('本次需求',c);assert(text.includes(clientToken));assert(!text.includes(bridgeToken));assert(text.includes('本次需求'));assert(text.includes('仅收到文字不代表工具已安装'));assert(!mcpPrompt('普通内容').includes(clientToken));
 for(const override of [{url:'https://example.com'},{url:'http://127.0.0.1:62924/path'},{clientToken:bridgeToken},{bridgeToken:'short'},{clientToken:'x\n'.repeat(40)}])assert.throws(()=>parseConnection(JSON.stringify({...source,...override}),123));
 assert.throws(()=>parseConnection(JSON.stringify(source),null));assert.throws(()=>parseConnection('x'.repeat(4097),123));assert.throws(()=>parseConnection('null',123));
});
test('精简界面保留恢复和单一页面复制区，不出现密钥输入或新手帮助',async()=>{
 const fs=await import('node:fs');const dom=new JSDOM(fs.readFileSync('extension/ui.html','utf8')),d=dom.window.document;
 for(const id of ['mcpUrl','mcpToken','usageHelp'])assert.equal(d.getElementById(id),null);
 for(const id of ['request','editor','copyPrompt','copyMcpPrompt','undo','redo','loadHistory','recoveryActions','copyPage','copyDom','saveOffline','mcpFile'])assert(d.getElementById(id));
 assert.equal(d.querySelectorAll('#copyPage').length,1);assert.equal(d.getElementById('copyPage').closest('section'),d.getElementById('copyDom').closest('section'));assert(!d.getElementById('moreDetails').contains(d.getElementById('copyDom')));dom.window.close();
});


test('MCP 分块传输的中文不会损坏',async()=>{
 const http=await import('node:http');const token='c'.repeat(40),{server,jobs}=createRelay({clientToken:token,bridgeToken:'b'.repeat(40)});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 try{await fetch(url+'/bridge/next',{headers:{Authorization:'Bearer '+'b'.repeat(40),'X-Xutu-Bridge-Id':'browser-test'}});
 const command=cmd('plan.update');command.steps[0].params.set.title='中文名称';const bytes=Buffer.from(JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'xutu_preview',arguments:{command}}}));const split=bytes.indexOf(Buffer.from('中'))+1;
 const result=await new Promise((resolve,reject)=>{const req=http.request(url+'/mcp',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}},res=>{let text='';res.setEncoding('utf8');res.on('data',s=>text+=s);res.on('end',()=>resolve(JSON.parse(text)));});req.on('error',reject);req.write(bytes.subarray(0,split));setTimeout(()=>req.end(bytes.subarray(split)),10);});
 const job=JSON.parse(result.result.content[0].text);assert.equal(jobs.get(job.jobId).command.steps[0].params.set.title,'中文名称');
 }finally{await new Promise(r=>server.close(r));}
});
