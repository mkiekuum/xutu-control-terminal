import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
if(process.platform!=='win32')throw Error('Windows packaging requires Windows');
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version;
execFileSync(process.execPath,[path.join(root,'native-host/install-windows.mjs'),'build-only'],{stdio:'inherit'});
const stage=fs.mkdtempSync(path.join(dist,'.windows-stage-')),output=path.join(dist,'xutu-control-terminal-v'+version+'-windows.zip');
try{
 for(const item of ['native-host','extension','schemas','examples','docs','package.json','README.md','LICENSE'])fs.cpSync(path.join(root,item),path.join(stage,item),{recursive:true});
 fs.mkdirSync(path.join(stage,'bin'));fs.copyFileSync(path.join(dist,'windows/native-host.exe'),path.join(stage,'bin/native-host.exe'));
 fs.writeFileSync(path.join(stage,'START-HERE.txt'),'Windows setup\r\n1. Install Node.js 22+.\r\n2. Load the extension folder in Chrome or Edge.\r\n3. Run native-host/INSTALL-WINDOWS.cmd and paste the extension ID.\r\n4. Click Connect local CLI in the extension terminal.\r\nSee docs/WINDOWS_INSTALL.md for Chinese instructions. Keep this extracted directory after installation.\r\nThe installer builds the included C# source. No credentials or machine-specific launcher configuration are bundled.\r\n');
 if(fs.existsSync(output))fs.unlinkSync(output);
 const quote=s=>"'"+s.replaceAll("'","''")+"'";
 execFileSync('powershell.exe',['-NoProfile','-Command','Add-Type -AssemblyName System.IO.Compression.FileSystem\n[System.IO.Compression.ZipFile]::CreateFromDirectory('+quote(stage)+','+quote(output)+')']);
 console.log(output);
}finally{const resolved=fs.realpathSync(stage);if(path.dirname(resolved)!==fs.realpathSync(dist)||!path.basename(resolved).startsWith('.windows-stage-'))throw Error('UNSAFE_STAGE_PATH');fs.rmSync(resolved,{recursive:true});}
