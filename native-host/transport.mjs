import net from 'node:net';
import {frame,decoder} from './host.mjs';
export function submit(socket,command,timeout=120000,auth){
 if(!Number.isInteger(timeout)||timeout<100||timeout>600000)throw Error('INVALID_TIMEOUT');
 return new Promise((resolve,reject)=>{
  const client=net.createConnection(socket);let done=false;
  function finish(error,result){if(done)return;done=true;client.destroy();error?reject(error):resolve(result);}
  client.setTimeout(timeout,()=>finish(Error('TIMEOUT_RESULT_UNKNOWN')));
  client.on('connect',()=>{try{client.write(frame({command,...(auth?{auth}:{})}));}catch(e){finish(e);}});
  const receive=decoder(result=>finish(null,result));
  client.on('data',chunk=>{try{receive(chunk);}catch(e){finish(e);}});
  client.on('error',e=>finish(e));
  client.on('end',()=>finish(Error('NATIVE_DISCONNECTED_RESULT_UNKNOWN')));
 });
}
export function parseInput(text,jsonl=false){
 const source=text.replace(/^\uFEFF/,'');
 if(!jsonl)return [JSON.parse(source)];
 const lines=source.split(/\r?\n/).filter(x=>x.trim());
 if(!lines.length)throw Error('EMPTY_INPUT');
 return lines.map((line,i)=>{try{return JSON.parse(line);}catch{throw Error('INVALID_JSON_LINE_'+(i+1));}});
}
