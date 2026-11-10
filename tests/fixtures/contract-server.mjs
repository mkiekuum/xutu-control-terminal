// Synthetic local contract fixture. This is NOT the company's backend.
import http from 'node:http';
export async function contractServer(){
 let record={id:'SYNTHETIC_PLAN',revision:1,current:{version:2,title:'SYNTHETIC',planOwner:'TEST_OWNER',planNumber:'TEST-1',start:'',deadline:'',baseline:null,nodes:[],edges:[],positions:{}}};
 const operations=new Map(),events=[];
 const server=http.createServer(async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(value));};
  const actor=req.headers['x-test-actor'];if(!actor)return send(401,{error:'anonymous'});
  if(req.url==='/api/session')return send(200,{actor,role:'user'});
  if(req.url==='/api/plans'&&req.method==='GET')return send(200,[{id:record.id,planNumber:record.current.planNumber,planOwner:record.current.planOwner}]);
  if(req.url==='/api/plans/SYNTHETIC_PLAN'&&req.method==='GET')return send(200,record);
  if(req.url==='/api/plans/SYNTHETIC_PLAN/change'&&req.method==='POST'){
   if(actor!==record.current.planOwner)return send(403,{error:'owner-only'});
   let bytes='';for await(const chunk of req){bytes+=chunk;if(bytes.length>200000){return send(413,{error:'too-large'});}}
   let body;try{body=JSON.parse(bytes);}catch{return send(400,{error:'invalid-json'});}
   if(operations.has(body.operation))return send(200,operations.get(body.operation));
   if(body.baseRevision!==record.revision)return send(409,{error:'revision'});
   record={...record,revision:record.revision+1,current:body.current};events.push({method:req.method,path:req.url,revision:record.revision});operations.set(body.operation,structuredClone(record));return send(200,record);
  }return send(404,{error:'unsupported-fixture-route'});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {url:'http://127.0.0.1:'+server.address().port,events,getRecord:()=>structuredClone(record),remoteEdit:patch=>{record={...record,revision:record.revision+1,current:{...record.current,...patch}};},close:()=>new Promise(r=>server.close(r))};
}
