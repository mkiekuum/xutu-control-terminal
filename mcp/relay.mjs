import http from 'node:http';import {randomUUID,timingSafeEqual} from 'node:crypto';import {pathToFileURL} from 'node:url';
import {checked,readOnly} from '../extension/mcp-policy.js';
const object=properties=>({type:'object',properties,additionalProperties:false});
export function createRelay({clientToken,bridgeToken,origins=[],now=()=>Date.now()}){
 if(!clientToken||!bridgeToken||clientToken.length<32||bridgeToken.length<32||clientToken===bridgeToken)throw Error('需要两枚不同的至少32字符密钥');
 const jobs=new Map();let lastBridge=0,activeBridge=null;
 const auth=(req,token)=>{const got=Buffer.from(req.headers.authorization||''),want=Buffer.from('Bearer '+token);return got.length===want.length&&timingSafeEqual(got,want);};
 const tools=[{name:'xutu_read',description:'只读查询当前授权网站。返回jobId后用xutu_result取结果。',inputSchema:{...object({command:{type:'object'}}),required:['command']}},{name:'xutu_preview',description:'预览一次写入，展示完整变更给用户；不会保存网站。',inputSchema:{...object({command:{type:'object'}}),required:['command']}},{name:'xutu_execute',description:'仅在用户明确同意已展示的预览后调用。approval必须是用户本次同意原文，不能编造。',inputSchema:{...object({previewJobId:{type:'string'},approval:{type:'string'}}),required:['previewJobId','approval']}},{name:'xutu_result',description:'获取任务状态；dispatched/unknown时不要重放写入。',inputSchema:{...object({jobId:{type:'string'}}),required:['jobId']}}];
 const server=http.createServer(async(req,res)=>{
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
   if(req.headers.origin&&!origins.includes(req.headers.origin)&&!new RegExp("^chrome-extension://[a-p]{32}$").test(req.headers.origin))return json(403,{error:'ORIGIN_DENIED'});
   const bridge=req.url?.startsWith('/bridge/');if(!auth(req,bridge?bridgeToken:clientToken))return json(401,{error:'UNAUTHORIZED'});
   if(bridge){const peer=req.headers['x-xutu-bridge-id'];if(typeof peer!=='string'||!/^[-a-zA-Z0-9]{8,80}$/.test(peer))return json(400,{error:'BRIDGE_ID_REQUIRED'});if(activeBridge&&activeBridge!==peer&&now()-lastBridge<90000)return json(409,{error:'ANOTHER_BROWSER_CONNECTED'});activeBridge=peer;}
   if(req.method==='GET'&&req.url==='/bridge/next'){
    lastBridge=now();for(const j of jobs.values())if(j.status==='queued'){j.status='dispatched';return json(200,j);}return json(200,null);
   }
   if(req.method!=='POST')return json(405,{error:'METHOD_NOT_ALLOWED'});
   let size=0;const chunks=[];for await(const part of req){size+=part.length;if(size>2*1024*1024)return json(413,{error:'BODY_TOO_LARGE'});chunks.push(part);}
   const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(req.url==='/bridge/result'){
    const j=jobs.get(body.id);if(!j||j.status!=='dispatched')return json(409,{error:'JOB_STATE'});j.status='completed';j.result=body.result;return json(200,{ok:true});
   }
   if(req.url!=='/mcp')return json(404,{error:'NOT_FOUND'});
   if(body.jsonrpc!=='2.0'||typeof body.method!=='string'||Array.isArray(body))return json(400,{error:'INVALID_REQUEST'});
   if(body.id===undefined){res.writeHead(202);return res.end();}
   const rpc=result=>json(200,{jsonrpc:'2.0',id:body.id,result});
   if(body.method==='initialize')return rpc({protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'xutu-terminal',version:'3.1.1'}});
   if(body.method==='ping')return rpc({});if(body.method==='tools/list')return rpc({tools});
   if(body.method!=='tools/call')return json(200,{jsonrpc:'2.0',id:body.id,error:{code:-32601,message:'Method not found'}});
   try{
    const {name,arguments:a={}}=body.params||{};let result;
    if(name==='xutu_result'){
     const j=jobs.get(a.jobId);if(!j)throw Error('任务不存在；服务重启后先核对网站原 requestId，不自动重放');result={...j};delete result.command;delete result.approval;
    }else{
     if(now()-lastBridge>90000)throw Error('浏览器桥未连接，请在插件连接并保持网站登录');
     if(jobs.size>=1000)throw Error('任务缓存已满，请维护者核对并重启；不要重放未知写入');
     let payload;
     if(name==='xutu_read'||name==='xutu_preview'){const command=checked(a.command);if(name==='xutu_read'&&!readOnly(command))throw Error('只读工具拒绝写入');payload={kind:name==='xutu_read'?'read':'preview',command};}
     else if(name==='xutu_execute'){if(typeof a.approval!=='string'||!a.approval.trim())throw Error('缺少明确同意');const previous=jobs.get(a.previewJobId);if(previous?.status!=='completed'||!previous.result?.previewJobId)throw Error('预览未成功');const existing=[...jobs.values()].find(j=>j.kind==='execute'&&j.previewJobId===a.previewJobId);if(existing)return rpc({content:[{type:'text',text:JSON.stringify({jobId:existing.id,status:existing.status})}]});payload={kind:'execute',previewJobId:a.previewJobId,approval:a.approval};}
     else throw Error('未知工具');
     const id=randomUUID(),j={id,...payload,status:'queued',createdAt:now()};jobs.set(id,j);result={jobId:id,status:j.status};
    }
    return rpc({content:[{type:'text',text:JSON.stringify(result)}]});
   }catch(e){return rpc({isError:true,content:[{type:'text',text:e.message}]});}
  }catch{json(400,{error:'INVALID_REQUEST'});}
 });return {server,jobs};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {server}=createRelay({clientToken:process.env.XUTU_MCP_TOKEN,bridgeToken:process.env.XUTU_BRIDGE_TOKEN,origins:(process.env.XUTU_ALLOWED_ORIGINS||'').split(',').filter(Boolean)});server.listen(Number(process.env.PORT||62924),'127.0.0.1',()=>console.log('MCP relay listening on loopback; no public deployment.'));}
