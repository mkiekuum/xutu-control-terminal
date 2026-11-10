import {VERSION} from './core.js';
// Allowlisted explanations, never raw browser/server/native-process error messages.
const reasons={
 TARGET_REQUIRED:'请回主界面选择要测试的序图网页。',
 TARGET_NOT_FOUND:'选中的网页已关闭或不存在，请回主界面重新选择。',
 TARGET_ORIGIN:'选中的标签页不是序图网页。',
 HOST_NOT_FOUND:'未找到本地 CLI 宿主，请按安装说明安装。',
 HOST_CONNECT_FAILED:'宿主连接失败，请检查安装、扩展 ID 和 Node.js。',
 HOST_TOO_OLD:'宿主版本不支持分段测试，请更新整包并重新加载插件后再测。',
 HOST_TIMEOUT:'宿主响应超时，请检查宿主安装后重试。',
 HOST_DISCONNECTED:'宿主连接已中断，请重新打开插件再测。',
 HOST_RESPONSE_INVALID:'宿主没有返回有效测试响应。',
 CLI_TIMEOUT:'本机 CLI 只读查询超时，请检查桥接与网页连接。',
 CLI_UNAVAILABLE:'无法启动本机 CLI，请检查 Node.js 和安装文件。',
 CLI_FAILED:'本机 CLI 查询未完成，请检查安装和桥接状态。',
 CLI_BUSY:'已有本机 CLI 测试正在运行，请稍后重试。',
 IPC_AUTH_DENIED:'本机桥接认证失败，请按安装说明重新注册宿主。',
 NETWORK_ERROR:'选中网页的只读请求失败，请检查网络与网站状态。',
 AUTH_REQUIRED:'网站会话不可用，请在选中网页登录后重试。',
 NOT_LOGGED_IN:'选中的网页尚未登录或会话已过期，请登录后重试。',
 SERVER_ERROR:'网站服务器返回错误，请稍后重试。',
 INVALID_SITE_DATA:'网站拒绝了只读请求，请核对版本兼容性。',
 DOM_DRIFT:'网页连接脚本与当前网站不匹配，请刷新网页并检查兼容性。',
 PERMISSION_DENIED:'网站拒绝只读查询，请检查当前登录账号的权限。',
 TARGET_AMBIGUOUS:'没有唯一测试目标，请回主界面明确选择网页。',
 BRIDGE_UNAVAILABLE:'无法与选中的网页通信，请刷新该网页后重试。',
 QUERY_RESPONSE_INVALID:'本机 CLI 未返回有效的只读查询结果。',
 UNKNOWN_ERROR:'测试失败，错误详情已脱敏；请按故障排查手册检查连接。'
};
export function diagnosticCode(value){return Object.hasOwn(reasons,value)?value:'UNKNOWN_ERROR';}
export function diagnosticReason(code){return reasons[diagnosticCode(code)];}
export function normalizeDiagnosticError(error){
 const code=error?.code||error?.message;
 if(Object.hasOwn(reasons,code))return code;
 if(/No tab with id|Invalid tab ID|tab was closed/i.test(error?.message||''))return 'TARGET_NOT_FOUND';
 if(/Receiving end does not exist|Could not establish connection/i.test(error?.message||''))return 'BRIDGE_UNAVAILABLE';
 return 'UNKNOWN_ERROR';
}
export async function runCliDiagnostics({tabId,probeHost,query,version=VERSION,now=()=>new Date()}){
 const report={version,testedAt:now().toISOString(),status:'failed',stages:[{id:'host',status:'skipped'},{id:'page',status:'skipped'}]};
 if(!Number.isSafeInteger(tabId)||tabId<=0){report.stages.forEach(s=>s.code='TARGET_REQUIRED');return report;}
 try{const pong=await probeHost();if(pong?.pong!==true)throw {code:'HOST_RESPONSE_INVALID'};report.stages[0]={id:'host',status:'passed'};}
 catch(error){report.stages[0]={id:'host',status:'failed',code:normalizeDiagnosticError(error)};return report;}
 try{const result=await query(tabId);if(result?.ok!==true)throw {code:diagnosticCode(result?.code||'QUERY_RESPONSE_INVALID')};report.stages[1]={id:'page',status:'passed'};report.status='success';}
 catch(error){report.stages[1]={id:'page',status:'failed',code:normalizeDiagnosticError(error)};}
 return report;
}
export function stageText(stage){if(stage?.status==='passed')return '通过';if(stage?.status==='failed')return '失败：'+diagnosticReason(stage.code);return '未执行'+(stage?.code?'：'+diagnosticReason(stage.code):'（前一步未通过）');}
export function formatCliDiagnostics(report){
 const version=/^\d+(?:\.\d+){2,3}$/.test(report?.version)?report.version:VERSION;
 const time=Number.isFinite(Date.parse(report?.testedAt))?new Date(report.testedAt).toISOString():'未测试';
 const host=report?.stages?.find(s=>s.id==='host'),page=report?.stages?.find(s=>s.id==='page');
 return ['序图本地 CLI 诊断','插件版本：'+version,'测试时间：'+time,'1. 宿主连接与响应：'+stageText(host),'2. 经本机 CLI 查询选中网页：'+stageText(page),'整体：'+(host?.status==='passed'&&page?.status==='passed'?'通过':'未通过')].join('\n');
}
