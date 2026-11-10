import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {bridgeConfig} from './platform.mjs';
export function frame(value){const data=Buffer.from(JSON.stringify(value));if(data.length>900000)throw Error('MESSAGE_TOO_LARGE');const h=Buffer.alloc(4);h.writeUInt32LE(data.length);return Buffer.concat([h,data]);}
export function decoder(onMessage){let pending=Buffer.alloc(0);return chunk=>{pending=Buffer.concat([pending,chunk]);while(pending.length>=4){const n=pending.readUInt32LE();if(n>900000)throw Error('MESSAGE_TOO_LARGE');if(pending.length<4+n)return;const value=JSON.parse(pending.subarray(4,4+n));pending=pending.subarray(4+n);onMessage(value);}};}
if(process.argv[1]===fileURLToPath(import.meta.url)||process.argv.includes('--host')){
 process.umask(0o077);const {home,socket,auth}=bridgeConfig();fs.mkdirSync(home,{recursive:true,mode:0o700});const st=fs.lstatSync(home);if(st.isSymbolicLink()||!st.isDirectory()||process.getuid&&st.uid!==process.getuid())throw Error('IPC_DIRECTORY_PERMISSIONS');if(process.platform!=='win32')fs.chmodSync(home,0o700);
 const pending=new Map();const server=net.createServer(client=>{client.setTimeout(120000,()=>client.destroy());client.on('error',()=>{});let submitted=false;const receive=decoder(m=>{if(auth&&(typeof m.auth!=='string'||m.auth.length!==auth.length||!crypto.timingSafeEqual(Buffer.from(m.auth),Buffer.from(auth)))){client.end(frame({status:'failed',code:'IPC_AUTH_DENIED'}));return;}if(submitted||!m.command||typeof m.command!=='object'){client.end(frame({status:'failed',code:'INVALID_SCHEMA'}));return;}submitted=true;const id=crypto.randomUUID();pending.set(id,client);process.stdout.write(frame({id,command:m.command}));});client.on('data',chunk=>{try{receive(chunk);}catch{client.end(frame({status:'failed',code:'INVALID_NATIVE_FRAME'}));}});client.on('close',()=>{for(const[id,c]of pending)if(c===client)pending.delete(id);});});
 server.on('error',e=>{process.stderr.write(e.code==='EADDRINUSE'?'桥接端点已存在；关闭其他浏览器桥接，运行 doctor 检查。\n':e.code+'\n');process.exit(1);});
 server.listen(socket,()=>{if(process.platform!=='win32')fs.chmodSync(socket,0o600);process.stdout.write(frame({kind:'ready'}));});
 process.stdin.on('data',decoder(m=>{const c=pending.get(m.id);if(c){c.end(frame(m.result));pending.delete(m.id);}}));
 function close(){for(const c of pending.values())c.end(frame({status:'failed',code:'NATIVE_DISCONNECTED'}));server.close();if(process.platform!=='win32')try{fs.unlinkSync(socket);}catch{}process.exit();}process.stdin.on('end',close);process.on('SIGTERM',close);
}
