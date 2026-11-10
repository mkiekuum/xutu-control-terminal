import test from 'node:test';import assert from 'node:assert/strict';
import {runCliDiagnostics,formatCliDiagnostics} from '../extension/cli-diagnostics.js';
import {probeViaCli,summarizeCliOutput} from '../native-host/diagnostics.mjs';
test('未选目标不连宿主也不查网页；宿主失败阻止后续查询',async()=>{
 let hosts=0,pages=0;const adapters={probeHost:async()=>{hosts++;throw {code:'HOST_NOT_FOUND'};},query:async()=>{pages++;return {ok:true};}};
 const missing=await runCliDiagnostics(adapters);assert.equal(hosts,0);assert.equal(pages,0);assert.equal(missing.stages[0].code,'TARGET_REQUIRED');
 const failed=await runCliDiagnostics({...adapters,tabId:123});assert.equal(hosts,1);assert.equal(pages,0);assert.equal(failed.stages[0].status,'failed');assert.equal(failed.stages[1].status,'skipped');
});
test('两段分开计结果，宿主通过但网页失败不误报成功；重复点击会重新测试',async()=>{
 let hosts=0,pages=0;const args={tabId:123,probeHost:async()=>{hosts++;return {pong:true};},query:async id=>{assert.equal(id,123);pages++;return {ok:false,code:'PERMISSION_DENIED'};}};
 const report=await runCliDiagnostics(args);assert.equal(report.status,'failed');assert.equal(report.stages[0].status,'passed');assert.equal(report.stages[1].code,'PERMISSION_DENIED');
 await runCliDiagnostics(args);assert.equal(hosts,2);assert.equal(pages,2);
 const passed=await runCliDiagnostics({...args,query:async()=>({ok:true})});assert.equal(passed.status,'success');assert(formatCliDiagnostics(passed).includes('整体：通过'));
});
test('诊断白名单输出不包含原始错误、路径、姓名、计划、凭据或标签ID',()=>{
 const text=formatCliDiagnostics({version:'2.3.0',testedAt:'2026-11-10T00:00:00Z',status:'success',tabId:9999,account:'PRIVATE_NAME',plan:'PRIVATE_PLAN',path:'C:\\Users\\private',stages:[{id:'host',status:'passed',data:'TOKEN'},{id:'page',status:'failed',code:'C:\\Users\\private TOKEN PRIVATE_NAME',message:'PRIVATE_PLAN cookie=secret'}]});
 for(const secret of ['PRIVATE','TOKEN','cookie','secret','Users','9999'])assert(!text.includes(secret));assert(text.includes('整体：未通过'));assert(text.includes('错误详情已脱敏'));
});
test('宿主探针只启动固定CLI只读命令，无可注入操作/路径；拒绝无效目标',async()=>{
 let calls=0;const run=async(exe,args,options)=>{calls++;assert.equal(exe,process.execPath);assert.deepEqual(args.slice(1),['exec','site session','--tab-id','123','--timeout','12000']);assert(options.windowsHide);return {stdout:JSON.stringify({status:'success',steps:[{status:'success',data:{actor:'PRIVATE_NAME'}}]})};};
 assert.deepEqual(await probeViaCli(123,{run}),{ok:true});assert.equal((await probeViaCli('123; delete',{run})).code,'TARGET_REQUIRED');assert.equal(calls,1);
});
test('CLI子进程非零退出、超时和错误输出按阶段失败，敏感内容不会透传',async()=>{
 assert.deepEqual(await probeViaCli(123,{run:async()=>{throw {killed:true,stderr:'C:/SECRET'};}}),{ok:false,code:'CLI_TIMEOUT'});
 assert.deepEqual(await probeViaCli(123,{run:async()=>{throw {stdout:JSON.stringify({status:'failed',steps:[{status:'failed',code:'NOT_LOGGED_IN',message:'PRIVATE'}]})};}}),{ok:false,code:'NOT_LOGGED_IN'});
 assert.deepEqual(await probeViaCli(123,{run:async()=>{throw {stdout:JSON.stringify({status:'success',steps:[{status:'success'}]})};}}),{ok:false,code:'CLI_FAILED'});
 assert.equal(summarizeCliOutput('C:/PRIVATE').code,'QUERY_RESPONSE_INVALID');
});
