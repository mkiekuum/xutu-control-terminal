import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';
if(process.platform!=='darwin')throw Error('安装器仅支持 macOS；当前机器未执行安装');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),home=path.join(os.homedir(),'.xutu'),manifest=path.join(os.homedir(),'Library/Application Support/Google/Chrome/NativeMessagingHosts/cn.fpgabbs.xutu.json');
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
if(process.argv[2]==='uninstall'){for(const f of [manifest,path.join(home,'host'),path.join(home,'xutu')])if(fs.existsSync(f))fs.unlinkSync(f);console.log('已删除本工具注册和启动器；源码及浏览器存储保留。');process.exit();}
const id=process.argv[2];if(!/^[a-p]{32}$/.test(id||''))throw Error('用法：node native-host/install.mjs 扩展ID');
fs.mkdirSync(home,{recursive:true,mode:0o700});fs.chmodSync(home,0o700);fs.mkdirSync(path.dirname(manifest),{recursive:true});
for(const [name,script,args]of [['host','host.mjs',' --host'],['xutu','cli.mjs',' "$@"']])fs.writeFileSync(path.join(home,name),'#!/bin/sh\nexec '+quote(process.execPath)+' '+quote(path.join(root,'native-host',script))+args+'\n',{mode:0o700});
fs.writeFileSync(manifest,JSON.stringify({name:'cn.fpgabbs.xutu',description:'序图本地用户 IPC 桥接',path:path.join(home,'host'),type:'stdio',allowed_origins:['chrome-extension://'+id+'/']},null,2),{mode:0o600});console.log('安装完成。将 ~/.xutu 加入 PATH，然后在扩展终端点击连接本地 CLI。源码目录必须保留。');
