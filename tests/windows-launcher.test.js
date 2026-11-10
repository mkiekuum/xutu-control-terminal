import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawn} from 'node:child_process';import {frame} from '../native-host/host.mjs';
test('Windows EXE长连接：不关闭stdin也必须立即完成双向小帧传输',{skip:process.platform!=='win32',timeout:15000},async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xutu-stream-test-'));let child;
 try{fs.copyFileSync(path.resolve('dist/windows/native-host.exe'),path.join(temp,'native-host.exe'));
 const script=path.join(temp,'echo.cjs');fs.writeFileSync(script,"process.stdout.write('READY');process.stdin.on('data',b=>process.stdout.write(b));");
 fs.writeFileSync(path.join(temp,'launcher.json'),JSON.stringify({node:process.execPath,script}));
 // Cold CLR/Node startup on hosted Windows runners can exceed 2.5s. Keep a
 // separate short PING deadline after READY to retain the streaming regression.
 await new Promise((resolve,reject)=>{
  child=spawn(path.join(temp,'native-host.exe'),[],{windowsHide:true,stdio:['pipe','pipe','pipe']});
  let data='',errors='',sent=false,settled=false;
  let timer=setTimeout(()=>finish(Error('宿主启动超时：'+errors)),8000);
  function finish(error){if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve();}
  child.on('error',finish);child.stderr.on('data',b=>{errors+=b.toString();});child.on('exit',()=>{if(!settled)finish(Error('宿主提前退出：'+errors));});
  child.stdout.on('data',b=>{data+=b.toString();if(data==='READY'&&!sent){sent=true;clearTimeout(timer);timer=setTimeout(()=>finish(Error('保持stdin打开时未收到PING响应：'+errors)),2500);child.stdin.write('PING');}if(data==='READYPING')finish();});
 });
 }finally{if(child&&child.exitCode===null){child.stdin.end();await new Promise(r=>{const timer=setTimeout(()=>child.kill(),3000);child.once('exit',()=>{clearTimeout(timer);r();});});}const resolved=fs.realpathSync(temp);if(path.dirname(resolved)!==fs.realpathSync(os.tmpdir())||!path.basename(resolved).startsWith('xutu-stream-test-'))throw Error('unsafe test cleanup');fs.rmSync(resolved,{recursive:true});}
});
test('Windows EXE宿主实际进程：stdio二进制帧往返且正常退出',{skip:process.platform!=='win32',timeout:15000},async()=>{
 const executable=path.resolve('dist/windows/native-host.exe');assert(fs.existsSync(executable),'先运行 node native-host/install-windows.mjs build-only');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xutu-launch-test-'));
 try{
 fs.copyFileSync(executable,path.join(temp,'native-host.exe'));
 const script=path.join(temp,'echo.cjs');fs.writeFileSync(script,"process.stdin.on('data', b=>process.stdout.write(b));process.stdin.on('end',()=>process.exit(0));");
 fs.writeFileSync(path.join(temp,'launcher.json'),JSON.stringify({node:process.execPath,script}));
 const input=frame({protocol:'xutu.command/v1',requestId:'binary-frame',text:'合成测试'});
 const output=await new Promise((resolve,reject)=>{const child=spawn(path.join(temp,'native-host.exe'),[],{windowsHide:true,stdio:['pipe','pipe','pipe']}),chunks=[];let errors='';const timer=setTimeout(()=>{child.kill();reject(Error('launcher timeout'));},10000);child.stdout.on('data',c=>chunks.push(c));child.stderr.on('data',c=>errors+=c);child.on('error',reject);child.on('close',code=>{clearTimeout(timer);code===0?resolve(Buffer.concat(chunks)):reject(Error(errors));});child.stdin.end(input);});
 assert.deepEqual(output,input);
 }finally{const resolved=fs.realpathSync(temp);if(path.dirname(resolved)!==fs.realpathSync(os.tmpdir())||!path.basename(resolved).startsWith('xutu-launch-test-'))throw Error('unsafe test cleanup');fs.rmSync(resolved,{recursive:true});}
});
