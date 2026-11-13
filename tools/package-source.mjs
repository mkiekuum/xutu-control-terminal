import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
fs.mkdirSync(dist,{recursive:true});const stage=fs.mkdtempSync(path.join(dist,'.source-stage-'));
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version,output=path.join(dist,'xutu-control-terminal-v'+version+'-source.zip');
const include=['mcp','extension','schemas','examples','docs','tests','tools','.github','README.md','LICENSE','CHANGELOG.md','.gitignore','package.json','pnpm-lock.yaml','capability-map.json','site-capabilities.json','dom-map.json','site-baseline.json'];
try{
 for(const item of include){if(item==='mcp'){fs.mkdirSync(path.join(stage,item));for(const name of ['relay.mjs','start-local.mjs','stdio.mjs','README.md','Start-MCP.cmd'])fs.copyFileSync(path.join(root,item,name),path.join(stage,item,name));}else fs.cpSync(path.join(root,item),path.join(stage,item),{recursive:true});}
 if(fs.existsSync(output))fs.unlinkSync(output);
 if(process.platform==='win32'){const quote=s=>"'"+s.replaceAll("'","''")+"'";execFileSync('powershell.exe',['-NoProfile','-Command','Add-Type -AssemblyName System.IO.Compression.FileSystem\n[System.IO.Compression.ZipFile]::CreateFromDirectory('+quote(stage)+','+quote(output)+')']);}
 else execFileSync('zip',['-q','-r',output,'.'],{cwd:stage});
 const lines=fs.readdirSync(dist).filter(n=>n.startsWith('xutu-control-terminal-v'+version+'-')&&n.endsWith('.zip')).sort().map(n=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,n))).digest('hex')+'  '+n);
 fs.writeFileSync(path.join(dist,'SHA256SUMS'),lines.join('\n')+'\n');console.log(output);
}finally{
 const resolved=fs.realpathSync(stage),base=fs.realpathSync(dist);
 if(path.dirname(resolved)!==base||!path.basename(resolved).startsWith('.source-stage-'))throw Error('UNSAFE_STAGE_PATH');
 fs.rmSync(resolved,{recursive:true});
}
