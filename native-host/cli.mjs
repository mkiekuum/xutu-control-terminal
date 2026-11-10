#!/usr/bin/env node
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {parseCLI,validate} from '../extension/core.js';
import {parseInput,submit} from './transport.mjs';
import {bridgeConfig} from './platform.mjs';
const a=process.argv.slice(2),option=k=>{const i=a.indexOf(k);return i<0?undefined:a[i+1];};
try{
 if(a[0]==='schema'){process.stdout.write(fs.readFileSync(new URL('../schemas/command.schema.json',import.meta.url)));process.exit();}
 const {home,socket,auth}=bridgeConfig();
 if(a[0]==='doctor'){console.log(JSON.stringify({platform:process.platform,node:process.version,socketExists:fs.existsSync(socket),socket,notice:'socket存在不证明Chrome连接；status检查连通性。确认宿主全退出后才可删除崩溃遗留socket。'}));process.exit();}
 let commands;
 if(a[0]==='run'){const text=option('--file')?fs.readFileSync(option('--file'),'utf8'):fs.readFileSync(0,'utf8');commands=parseInput(text,a.includes('--jsonl'));}
 else if(a[0]==='js'){commands=[{protocol:'xutu.command/v1',requestId:crypto.randomUUID(),steps:[{id:'js',op:'script.execute',params:{source:fs.readFileSync(option('--file'),'utf8'),world:option('--world')||'USER_SCRIPT'}}]}];}
 else if(a[0]==='status')commands=[parseCLI('system health')];
 else if(a[0]==='logs')commands=[{protocol:'xutu.command/v1',requestId:crypto.randomUUID(),steps:[{id:'log',op:'system.logs',params:{requestId:option('--request-id')}}]}];
 else if(a[0]==='theme'&&a[1]==='apply'&&option('--file'))commands=[{protocol:'xutu.command/v1',requestId:crypto.randomUUID(),steps:[{id:'theme',op:'theme.apply',params:{theme:JSON.parse(fs.readFileSync(option('--file'),'utf8'))}}]}];
 else {const flags=new Set(['--timeout','--tab-id']);const filtered=[];for(let i=0;i<a.length;i++){if(flags.has(a[i])){i++;continue;}filtered.push(a[i]);}commands=[parseCLI(a[0]==='exec'?a[1]:filtered.map(x=>/\s/.test(x)?JSON.stringify(x):x).join(' '))];}
 for(const c of commands){if(option('--tab-id'))c.tabId=Number(option('--tab-id'));validate(c);}
 const st=fs.lstatSync(home);if(st.isSymbolicLink()||!st.isDirectory()||process.getuid&&st.uid!==process.getuid()||process.platform!=='win32'&&(st.mode&0o077)!==0)throw Error('IPC_DIRECTORY_PERMISSIONS');
 for(const command of commands){try{const result=await submit(socket,command,Number(option('--timeout')||120000),auth);console.log(JSON.stringify(result));if(result.status==='failed'||result.status==='partial_success')process.exitCode=1;}catch(e){console.log(JSON.stringify({protocol:'xutu.transport-error/v1',requestId:command.requestId,status:'failed',code:e.code||e.message,resultUnknown:true}));process.stderr.write('连接失败；该命令状态可能未知，按requestId查询后处理。\n');process.exitCode=1;break;}}
}catch(e){console.error(e.message);process.exitCode=1;}
