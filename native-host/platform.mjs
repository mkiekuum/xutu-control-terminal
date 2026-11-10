import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
export function bridgeConfig(){
 const home=path.join(os.homedir(),'.xutu');
 if(process.platform==='win32'){
  const config=JSON.parse(fs.readFileSync(path.join(home,'windows','bridge-config.json'),'utf8'));
  if(!/^\\\\\.\\pipe\\xutu-[a-f0-9]{32}$/.test(config.socket)||!/^[a-f0-9]{64}$/.test(config.auth))throw Error('INVALID_BRIDGE_CONFIG');
  return {home:path.join(home,'windows'),socket:config.socket,auth:config.auth};
 }
 return {home,socket:path.join(home,'bridge.sock')};
}
