// Standard stdio alternative for clients without Streamable HTTP. Never log credentials.
import readline from 'node:readline';
const url=process.env.XUTU_MCP_URL||'http://127.0.0.1:62924/mcp',token=process.env.XUTU_MCP_TOKEN;
if(!token)throw Error('XUTU_MCP_TOKEN is required');
const u=new URL(url);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1')throw Error('Only local/private-tunnel loopback allowed');
let queue=Promise.resolve();for await(const line of readline.createInterface({input:process.stdin})){queue=queue.then(async()=>{let input;try{input=JSON.parse(line);const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:line,signal:AbortSignal.timeout(20000),redirect:'error'});if(!r.ok)throw Error('HTTP '+r.status);if(r.status!==202)process.stdout.write(JSON.stringify(await r.json())+'\n');}catch(e){if(input?.id!==undefined)process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:input.id,error:{code:-32000,message:e.message}})+'\n');}});}await queue;
