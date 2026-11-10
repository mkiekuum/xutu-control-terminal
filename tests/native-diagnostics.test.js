import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';
import {frame,decoder} from '../native-host/host.mjs';
test('真实宿主→CLI子进程→认证管道→模拟网页回读，逐次查询且不泄露业务数据',{timeout:40000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xutu-diag-')),home=path.join(dir,'.xutu');fs.mkdirSync(home,{mode:0o700});
 if(process.platform==='win32'){fs.mkdirSync(path.join(home,'windows'));fs.writeFileSync(path.join(home,'windows','bridge-config.json'),JSON.stringify({socket:'\\\\.\\pipe\\xutu-'+crypto.randomBytes(16).toString('hex'),auth:crypto.randomBytes(32).toString('hex')}));}
 const env={...process.env,HOME:dir,USERPROFILE:dir};const child=spawn(process.execPath,['native-host/host.mjs','--host'],{env,windowsHide:true,stdio:['pipe','pipe','pipe']});
 const queue=[],waiters=[],commands=[];let failed=false;
 const emit=m=>{const waiter=waiters.find(w=>w.match(m));if(waiter){waiters.splice(waiters.indexOf(waiter),1);clearTimeout(waiter.timer);waiter.resolve(m);}else queue.push(m);};
 const next=match=>{const i=queue.findIndex(match);if(i>=0)return Promise.resolve(queue.splice(i,1)[0]);return new Promise((resolve,reject)=>{const waiter={match,resolve,timer:setTimeout(()=>reject(Error('native diagnostic response timeout')),10000)};waiters.push(waiter);});};
 const receive=decoder(m=>{
  if(m.command){commands.push(m.command);const op=m.command.steps[0].op;assert(['site.session','site.context','plan.update'].includes(op));assert.equal(m.command.tabId,123);
   child.stdin.write(frame({id:m.id,result:failed?{status:'failed',steps:[{status:'failed',code:'PERMISSION_DENIED',message:'PRIVATE_NAME C:/SECRET cookie=TOKEN'}]}:{status:'success',steps:[{status:'success',data:{actor:'PRIVATE_NAME',plan:'PRIVATE_PLAN'}}],summary:{success:1}}}));
  }else emit(m);
 });
 child.stdout.on('data',receive);child.stderr.on('data',()=>{});
 try{
  const ready=await next(m=>m.kind==='ready');assert.equal(ready.diagnostics,1);
  child.stdin.write(frame({kind:'diagnostic',id:'ping1',action:'ping'}));assert.deepEqual((await next(m=>m.id==='ping1')).result,{pong:true});
  child.stdin.write(frame({kind:'diagnostic',id:'query1',action:'query',tabId:123}));assert.deepEqual((await next(m=>m.id==='query1')).result,{ok:true});assert.equal(commands[0].steps[0].op,'site.session');
  failed=true;child.stdin.write(frame({kind:'diagnostic',id:'query2',action:'query',tabId:123}));const result=(await next(m=>m.id==='query2')).result;assert.deepEqual(result,{ok:false,code:'PERMISSION_DENIED'});assert(!JSON.stringify(result).includes('PRIVATE'));assert.equal(commands.length,2);
  failed=false;const run=promisify(execFile);const context=await run(process.execPath,['native-host/cli.mjs','context','--tab-id','123'],{env,windowsHide:true,timeout:10000});assert.equal(JSON.parse(context.stdout).status,'success');assert.equal(commands.at(-1).steps[0].op,'site.context');
  const jsonl=path.join(dir,'batch.jsonl');fs.writeFileSync(jsonl,['preview','validate'].map((mode,i)=>JSON.stringify({protocol:'xutu.command/v1',requestId:'batch-'+i,mode,steps:[{id:'edit',op:'plan.update',target:{id:'SYNTHETIC'},params:{set:{title:'fixture'}}}]})).join('\n'));
  const batch=await run(process.execPath,['native-host/cli.mjs','run','--file',jsonl,'--jsonl','--tab-id','123'],{env,windowsHide:true,timeout:10000});assert.equal(batch.stdout.trim().split(/\r?\n/).length,2);assert.deepEqual(commands.slice(-2).map(c=>c.mode),['preview','validate']);
 }finally{
  waiters.forEach(w=>clearTimeout(w.timer));child.stdin.end();await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},2000);child.once('exit',()=>{clearTimeout(timer);resolve();});});
  assert.equal(path.dirname(fs.realpathSync(dir)),fs.realpathSync(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});
 }
});
