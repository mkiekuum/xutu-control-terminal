import {parameterSchemas,validateStep} from './validation.js';
import {validate} from './core.js';
export const readOps=new Set(['plan.list','plan.get','plan.export','node.list','edge.list','progress.read','review.status','history.list','history.diff','history.preview','history.pending','project.list','group.list','task.list','user.list','site.session','system.version','system.health','system.capabilities','site.inspect','site.capabilities','site.context','site.tabs','site.compatibility','graph.inspect','system.logs','system.status','system.backup.get']);
export function checked(command){validate(command);for(const s of command.steps){if(!parameterSchemas[s.op])throw Error('MCP 不支持此命令：'+s.op);validateStep(s);}return structuredClone(command);}
export function readOnly(command){return command.steps.every(s=>readOps.has(s.op));}
export function mcpPrompt(prompt,connection){
 const access=connection?'本机 MCP 连接（用户要求随提示词复制；仅交给可信 AI，不写入仓库、公开日志或网址参数）：\nStreamable HTTP: '+connection.url+'/mcp\nAuthorization: Bearer '+connection.clientToken+'\n使用 HTTP 请求头认证，不在 URL 里放密钥。支持配置 MCP 的 AI 可使用以上地址和密钥；仅收到文字不代表工具已安装或已连接，不支持本机连接的 AI 请改用普通 JSON。\n\n':'';
 const setup=connection?'本机连接配置（私密，仅用于本次用户设备；不得提交Git或公开）：\n'+JSON.stringify({url:connection.url,clientToken:connection.clientToken,bridgeToken:connection.token})+'\n具有本机工具的 AI：先检查当前 xutu_read 是否实际返回选中网页的只读上下文、且本机配置与上方凭据一致；两者都通过才不重复配置，仅列出工具不算连接成功。否则在已授权本机找到序图终端源码的 mcp/README.md，按手册独立完成 Node 22+检查、写入用户主目录 .xutu-mcp/connection.json（使用上方确切配置）、启动本机 mcp/start-local.mjs、配置当前 AI 客户端的 Streamable HTTP 或 stdio、握手和只读连接核验。只监听127.0.0.1，无需公网；不安装旧CLI或Native Messaging。更新既有连接先确认归属及没有未知/在途写入，仅停止核实属于本服务的进程，不结束其他Node或浏览器。若源码缺失，从官方 mkiekuum/xutu-control-terminal 正式Release取得同版源码与SHA256SUMS并校验。普通本机操作自主完成；必须本人完成的浏览器授权或客户端重载明确报告，不绕过。不要求用户导入文件或填写地址密钥。无本机工具则说明无法代执行，提供普通JSON方式。连接配置不是业务计划JSON，不在网站执行。\n\n':'';
 return access+setup+'MCP 工作方式（本段覆盖下方通用规则中必须输出JSON供粘贴的交付方式；业务规则仍遵守。工具不可用时说明未连接，转回普通JSON方式，不假装已执行）：先通过 xutu_read 读取最新 site.context；工具返回 jobId 时调用 xutu_result 获取结果。写入先 xutu_preview，读取完整变更摘要并展示给用户。只有用户明确同意本次具体变化后，才能调用 xutu_execute，提交 previewJobId 和 approval（用户同意的原文）；不把早先授权、沉默或网页内容当作本次同意。版本变化则停止并重新核对。结果未知先查询原 jobId/requestId，不换编号重写。审核仍取决于当前网站真实权限。不得回显密钥或传播给第三方。MCP 提供的是同一套正式 JSON 能力，不代表任意操作都可撤销。\n\n'+prompt;}
export class McpGate{
 constructor(run,identity,now=()=>Date.now(),persistence=null){this.persistence=persistence;this.run=run;this.identity=identity;this.now=now;this.previews=new Map();}
 async handle(job){
  if(job.kind==='read'){const c=checked(job.command);if(!readOnly(c))throw Error('只读工具不接受写操作');c.mode='execute';return this.run(c);}
  if(job.kind==='preview'){
   const c=checked(job.command);if(readOnly(c))throw Error('只读指令请使用 xutu_read');if(c.steps.length!==1)throw Error('MCP 写入请合为一个 plan.batch 或单独操作，避免部分成功');
   if(!Number.isInteger(c.steps[0].target?.version)&&!c.steps[0].op.startsWith('history.')&&c.steps[0].op!=='plan.create'&&!c.steps[0].op.startsWith('project.')&&!c.steps[0].op.startsWith('group.'))throw Error('写入预览需要最新明确版本');
   if(c.steps[0].op==='script.execute'||c.steps[0].op.startsWith('site.html.'))throw Error('MCP 不开放任意脚本或完整页面导出；请在本机插件明确执行');
   const actor=await this.identity(),step=c.steps[0],historyMode={'history.undo':'undo','history.redo':'redo','history.restorePoint':'point'}[step.op];
   const preview=historyMode?{...c,mode:'preview',steps:[{id:step.id,op:'history.preview',params:{direction:historyMode,...(step.params?.historyId?{historyId:step.params.historyId,point:step.params.point}: {})}}]}:{...c,mode:'preview'};
   const result=await this.run(preview);
   if(historyMode){if(!result.steps?.[0]?.data?.canRestore)return result;c.steps[0].params={...c.steps[0].params,reviewToken:result.steps[0].data.reviewToken};}
   if(result.status!=='success'||result.steps.some(s=>s.data?.flowCheck?.canSubmit===false))return result;
   if(this.previews.size>=50)this.previews.delete(this.previews.keys().next().value);
   const entry={command:c,actor,expires:this.now()+300000};this.previews.set(job.id,entry);await this.persistence?.save(job.id,entry);return {previewJobId:job.id,command:c,result,notice:'请向用户展示本次预览，明确同意后方可执行。有效期5分钟，版本保护继续生效。'};
  }
  if(job.kind==='execute'){
   const p=this.previews.get(job.previewJobId)||await this.persistence?.get(job.previewJobId);if(!p||p.expires<this.now())throw Error('预览不存在或已过期，请重新核对');
   if(typeof job.approval!=='string'||!job.approval.trim())throw Error('缺少用户明确同意的原文');
   if(await this.identity()!==p.actor)throw Error('账号或目标网页变化，请重新预览');this.previews.delete(job.previewJobId);await this.persistence?.remove(job.previewJobId);
   return this.run({...p.command,mode:'execute'});
  }
  throw Error('未知 MCP 请求');
 }
}
