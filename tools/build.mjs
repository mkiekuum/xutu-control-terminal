import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'));const dist=path.join(root,'dist');fs.mkdirSync(dist,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'extension/manifest.json')));if(manifest.version!==JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version)throw Error('VERSION_MISMATCH');
const output=path.join(dist,'xutu-control-terminal-v'+manifest.version+'-chrome.zip');
if(fs.existsSync(output))fs.unlinkSync(output);
if(process.platform==='win32'){const quote=s=>"'"+s.replaceAll("'","''")+"'";execFileSync('powershell.exe',['-NoProfile','-Command',`Add-Type -AssemblyName System.IO.Compression.FileSystem\n[System.IO.Compression.ZipFile]::CreateFromDirectory(${quote(path.join(root,'extension'))},${quote(output)})`]);}else execFileSync('zip',['-q','-r',output,'.'],{cwd:path.join(root,'extension')});
fs.writeFileSync(path.join(dist,'SHA256SUMS'),crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex')+'  '+path.basename(output)+'\n');console.log(output);
