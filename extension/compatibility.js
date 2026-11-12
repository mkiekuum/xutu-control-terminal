import {VERSION} from './core.js';

// Serialized into MAIN. Synthetic data only; no network or business writes.
export function probeNativeCompatibility(){
 const result={calculation:typeof globalThis.validatePlan==='function',scoring:typeof globalThis.scorePlan==='function',progress:typeof globalThis.PlanProgress?.completionRate==='function',samplePassed:false};
 if(result.calculation)try{
  const sample={version:2,title:'Compatibility sample',planOwner:'',planNumber:'',start:'',deadline:'',baseline:null,nodes:[{id:'s',name:'Start'},{id:'e',name:'End'}],edges:[{from:'s',to:'e',upper:'1-1-1',lower:'',executor:'',dashed:false,completedAt:''}],positions:{}};
  const calculation=globalThis.validatePlan(sample);
  result.samplePassed=calculation.total===1&&calculation.schedule?.[0]?.te===0;
 }catch{result.samplePassed=false;}
 return result;
}

export async function collectCompatibility({inspect,session,plans,probe,userScripts}){
 const jobs=await Promise.allSettled([inspect,session,plans,probe,userScripts].map(run=>Promise.resolve().then(run)));
 const [page,auth,list,engine,scripts]=jobs.map(r=>r.status==='fulfilled'?r.value:null),checks=[];
 const add=(id,status,message)=>checks.push({id,status,message});
 add('page',page?.origin==='https://plan.fpgabbs.cn'?'pass':'fail',page?.origin==='https://plan.fpgabbs.cn'?'目标网页与通信桥已连接。':'未能连接受支持的序图网页。');
 const identity=['planOwner','planNumber','title'];
 const missing=identity.filter(id=>page?.anchors?.[id]!==1);
 add('target',page?(missing.length?'warning':'pass'):'unknown',page?(missing.length?'当前计划定位字段变化或未加载：'+missing.join('、'):'当前计划定位字段均唯一。'):'未检查当前计划定位字段。');
 const editors=['new','nodeSubmit','edgeSubmit','rows'].filter(id=>page?.anchors?.[id]!==1);
 add('editor',page?(editors.length?'warning':'pass'):'unknown',page?(editors.length?'部分编辑锚点未出现；可能与页面状态或权限有关。':'已识别既有编辑锚点；不代表写入已测试。'):'未检查编辑锚点。');
 const loggedIn=!!auth&&typeof auth.actor==='string'&&!!auth.actor;
 add('session',loggedIn&&!auth.mustChangePassword?'pass':'warning',loggedIn?(auth.mustChangePassword?'当前账号需先在网站完成密码设置。':'当前网站会话可读取。'):'未确认登录状态；请先在网站登录。');
 const validList=Array.isArray(list)&&list.every(p=>p&&typeof p.id==='string'&&Number.isInteger(p.revision));
 add('readApi',validList?'pass':'warning',validList?'计划列表只读接口返回已识别结构。':'计划列表接口未读到已识别结构，可能未登录、网络异常或网站已更新。');
 add('calculation',engine?(engine.calculation&&engine.samplePassed?'pass':'warning'):'unknown',engine?.calculation&&engine.samplePassed?'原生计算接口通过1天合成样例。':'原生计算接口未通过检查；不应推断工期计算兼容。');
 add('scoring',engine?(engine.scoring?'pass':'warning'):'unknown',engine?.scoring?'已发现原生评分函数；未证明所有评分规则不变。':'未确认原生评分函数。');
 add('progress',engine?(engine.progress?'pass':'warning'):'unknown',engine?.progress?'已发现原生完成率函数。':'未确认原生完成率函数。');
 add('javascript',scripts===true?'pass':'optional',scripts===true?'用户脚本接口可读取；具体脚本仍受浏览器限制。':'JavaScript授权未确认；JSON业务指令不依赖此授权。');
 add('localFeatures','optional','页面摘要、HTML导出与本地十批历史入口已提供；此项不代表导出或恢复写入已验证。');
 const status=checks.some(c=>c.status==='fail')?'unavailable':checks.some(c=>['warning','unknown'].includes(c.status))?'limited':'ok';
 return {schema:'xutu.compatibility/v1',extensionVersion:VERSION,checkedAt:new Date().toISOString(),site:'https://plan.fpgabbs.cn/',status,checks,scope:'当前网页基础只读检查；未执行任何业务写入。',limitations:['不是全站兼容或写权限认证；最终以服务器权限及实际操作回读为准。','未扫描所有新增字段或接口；新功能需维护者核实。','未比较全部网站资源或评分规则版本；网站更新检测按维护手册执行。'],privacy:'此报告不包含姓名、计划内容、计划ID、本机路径、Cookie或连接密钥。'};
}

export function formatCompatibility(report){
 if(!report)return '序图兼容性状态\n尚未检查。请打开序图网站后重新检查。';
 const labels={ok:'基础只读检查通过',limited:'部分检查未通过或未确认',unavailable:'网页连接不可用',not_checked:'尚未检查'},states={pass:'通过',warning:'待核对',unknown:'未确认',optional:'可选'};
 return ['序图兼容性状态','插件版本：'+(report.extensionVersion||VERSION),'检查时间：'+(report.checkedAt||'未检查'),'结果：'+(labels[report.status]||'未确认'),...(report.checks||[]).map(c=>'['+(states[c.status]||'异常')+'] '+c.message),report.scope||'',...(report.limitations||[]),report.privacy||''].filter(Boolean).join('\n');
}
