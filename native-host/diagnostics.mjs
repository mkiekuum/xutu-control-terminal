import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {fileURLToPath} from 'node:url';
import {diagnosticCode} from '../extension/cli-diagnostics.js';
const execute=promisify(execFile);
export async function probeViaCli(tabId,{run=execute,timeout=17000}={}){
 if(!Number.isSafeInteger(tabId)||tabId<=0)return {ok:false,code:'TARGET_REQUIRED'};
 try{
  // A real CLI child uses the normal authenticated pipe, native bridge, and selected page.
  // No caller-supplied operation, source code, file path or process arguments are accepted.
  const {stdout}=await run(process.execPath,[fileURLToPath(new URL('./cli.mjs',import.meta.url)),'exec','site session','--tab-id',String(tabId),'--timeout','12000'],{windowsHide:true,timeout,maxBuffer:1024*1024,encoding:'utf8'});
  return summarizeCliOutput(stdout);
 }catch(error){
  // execFile rejects on a nonzero CLI exit; inspect only the structured result's known code.
  if(error.stdout){const result=summarizeCliOutput(error.stdout);if(result.ok===false&&result.code!=='QUERY_RESPONSE_INVALID')return result;}
  return {ok:false,code:error.killed?'CLI_TIMEOUT':error.code==='ENOENT'?'CLI_UNAVAILABLE':'CLI_FAILED'};
 }
}
export function summarizeCliOutput(stdout){
 try{
  const result=JSON.parse(stdout),step=result.steps?.[0];
  if(result.status==='success'&&result.steps?.length===1&&step.status==='success')return {ok:true};
  const code=result.steps?.find(s=>s.status==='failed')?.code||result.code;
  if(code==='TIMEOUT_RESULT_UNKNOWN')return {ok:false,code:'CLI_TIMEOUT'};
  if(code==='NATIVE_DISCONNECTED_RESULT_UNKNOWN')return {ok:false,code:'HOST_DISCONNECTED'};
  return {ok:false,code:diagnosticCode(code)};
 }catch{return {ok:false,code:'QUERY_RESPONSE_INVALID'};}
}
