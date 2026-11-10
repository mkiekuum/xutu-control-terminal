import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
if(process.platform!=='win32')throw Error('Windows installer only');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),mode=process.argv[2],home=path.join(os.homedir(),'.xutu','windows');
const browsers=['Google\\Chrome','Microsoft\\Edge'];
if(mode==='uninstall'){
 for(const browser of browsers){try{execFileSync('reg.exe',['delete','HKCU\\Software\\'+browser+'\\NativeMessagingHosts\\cn.fpgabbs.xutu','/f'],{stdio:'pipe'});}catch{}}
 for(const name of ['native-host.exe','native-host.json','launcher.json','bridge-config.json','xutu.cmd']){const file=path.join(home,name);if(fs.existsSync(file))fs.unlinkSync(file);}
 console.log('已移除本工具Windows宿主注册及文件；源码和扩展数据保留。');process.exit();
}
const buildOnly=mode==='build-only';if(!buildOnly&&!/^[a-p]{32}$/.test(mode||''))throw Error('用法：node native-host/install-windows.mjs EXTENSION_ID | build-only | uninstall');
const dir=buildOnly?path.join(root,'dist','windows'):home;fs.mkdirSync(dir,{recursive:true});
if(!buildOnly){
 if(fs.lstatSync(dir).isSymbolicLink())throw Error('UNSAFE_INSTALL_DIRECTORY');
 const sid=execFileSync('powershell.exe',['-NoProfile','-Command','[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value'],{encoding:'utf8'}).trim();
 if(!/^S-1-5-(\d+-)*\d+$/.test(sid))throw Error('INVALID_USER_SID');
 execFileSync('icacls.exe',[dir,'/inheritance:r','/grant:r','*'+sid+':(OI)(CI)F','/remove:g','*S-1-1-0','*S-1-5-11','*S-1-5-32-545'],{stdio:'pipe'});
}
const compiler=path.join(process.env.SystemRoot||'C:\\Windows','Microsoft.NET','Framework64','v4.0.30319','csc.exe');
execFileSync(compiler,['/nologo','/target:exe','/r:System.Web.Extensions.dll','/out:'+path.join(dir,'native-host.exe'),path.join(root,'native-host','windows-launcher.cs')],{stdio:'pipe'});
fs.writeFileSync(path.join(dir,'launcher.json'),JSON.stringify({node:process.execPath,script:path.join(root,'native-host','host.mjs')},null,2));
if(buildOnly){console.log('已编译Windows Native Messaging EXE；未注册浏览器或写入用户配置。');process.exit();}
fs.writeFileSync(path.join(dir,'bridge-config.json'),JSON.stringify({socket:'\\\\.\\pipe\\xutu-'+crypto.randomBytes(16).toString('hex'),auth:crypto.randomBytes(32).toString('hex')}));
const manifest=path.join(dir,'native-host.json');fs.writeFileSync(manifest,JSON.stringify({name:'cn.fpgabbs.xutu',description:'Xutu Windows native host',path:path.join(dir,'native-host.exe'),type:'stdio',allowed_origins:['chrome-extension://'+mode+'/']},null,2));
for(const browser of browsers)execFileSync('reg.exe',['add','HKCU\\Software\\'+browser+'\\NativeMessagingHosts\\cn.fpgabbs.xutu','/ve','/t','REG_SZ','/d',manifest,'/f'],{stdio:'pipe'});
fs.writeFileSync(path.join(dir,'xutu.cmd'),'@echo off\r\n"'+process.execPath+'" "'+path.join(root,'native-host','cli.mjs')+'" %*\r\n');
console.log('已安装到 '+dir+'，仅当前用户Chrome/Edge。在扩展更多→本地CLI测试通过后运行 "'+path.join(dir,'xutu.cmd')+'" status。');
