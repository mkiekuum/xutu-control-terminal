import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
if(process.platform!=='win32')throw Error('Windows packaging requires Windows');
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
execFileSync(process.execPath,[path.join(root,'native-host/install-windows.mjs'),'build-only'],{stdio:'inherit'});
const stage=fs.mkdtempSync(path.join(dist,'.windows-stage-')),output=path.join(dist,'xutu-control-terminal-v'+version+'-windows.zip');
try{
 for(const item of ['native-host','extension','schemas','examples','docs','package.json','README.md','LICENSE'])fs.cpSync(path.join(root,item),path.join(stage,item),{recursive:true});
 fs.mkdirSync(path.join(stage,'bin'));fs.copyFileSync(path.join(dist,'windows/native-host.exe'),path.join(stage,'bin/native-host.exe'));
 fs.writeFileSync(path.join(stage,'START-HERE.txt'),"序图终端 · Windows 入门\r\n\r\n普通使用：无需 Node.js 或 CLI。\r\n1. 解压整个文件夹，保存到固定位置。\r\n2. Chrome 地址栏输入 chrome://extensions（Edge 用 edge://extensions）。\r\n3. 开启开发者模式，点击加载已解压的扩展程序，选择本包的 extension 文件夹。\r\n4. 登录序图网站，打开插件：选择新建/管理 → 写需求 → 复制 AI 提示词 → 发给 AI → 粘贴回复代码 → 执行。\r\n\r\n可选 CLI（仅供能执行本机命令的 AI）：\r\n1. 安装 Node.js 22 或以上。\r\n2. 双击 native-host/INSTALL-WINDOWS.cmd，粘贴实际 32 位扩展 ID。\r\n3. 插件主界面选中序图网页，在“更多 → 本地 CLI”点击“测试本地 CLI”；本机命令示例见手册。\r\n保留整个解压目录；移动目录后重装宿主。\r\n\r\n完整中文步骤：docs/WINDOWS_INSTALL.md\r\n换电脑：docs/CROSS_DEVICE.md\r\n更新：备份后覆盖原加载目录，扩展管理页重新加载，刷新序图；CLI 用户还需重装宿主并连接。\r\n");
 if(fs.existsSync(output))fs.unlinkSync(output);
 const quote=s=>"'"+s.replaceAll("'","''")+"'";
 execFileSync('powershell.exe',['-NoProfile','-Command','Add-Type -AssemblyName System.IO.Compression.FileSystem\n[System.IO.Compression.ZipFile]::CreateFromDirectory('+quote(stage)+','+quote(output)+')']);
 console.log(output);
}finally{const resolved=fs.realpathSync(stage);if(path.dirname(resolved)!==fs.realpathSync(dist)||!path.basename(resolved).startsWith('.windows-stage-'))throw Error('UNSAFE_STAGE_PATH');fs.rmSync(resolved,{recursive:true});}
