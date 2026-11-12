import test from 'node:test';import assert from 'node:assert/strict';
import {compareVersions,releaseFromResponse,checkForUpdates,createUpdateChecker,buildAgentUpdatePrompt,REPOSITORY,RELEASE_PAGE,updateStatusText} from '../extension/updates.js';
const page=(version='2.3.0',status=200)=>({status,url:REPOSITORY+'/releases/tag/v'+version,body:null});
test('版本按数字比较，拒绝畸形标签及预发布后缀',()=>{
 assert.equal(compareVersions('2.10.0','2.9.9'),1);assert.equal(compareVersions('v2.3.0','2.3.0.0'),0);assert.equal(compareVersions('2.3.0','3.0.0'),-1);
 for(const v of ['2.3.0-beta','2.03.0','2.3','99999.0.0','../../x'])assert.throws(()=>compareVersions(v,'2.3.0'));
});
test('有网页不等于版本存在：必须HTTP200且最终地址是本仓库正式tag',()=>{
 assert.equal(releaseFromResponse(page()).version,'2.3.0');
 assert.throws(()=>releaseFromResponse({...page('2.2.3',404),ok:true}),/HTTP_404/);
 for(const url of [RELEASE_PAGE,REPOSITORY+'/releases','https://evil.test/releases/tag/v9.0.0',REPOSITORY+'/releases/tag/v2.3.0-beta',REPOSITORY+'/releases/tag/v2.3.0/extra','https://github.com/other/repo/releases/tag/v2.3.0'])assert.throws(()=>releaseFromResponse({status:200,url}));
});
test('自动检测只请求latest网页，不发API、版本文件或凭据，区分三种版本关系',async()=>{
 const calls=[];const fetchImpl=async(url,options)=>{calls.push({url,options});return page();};
 for(const [currentVersion,status] of [['2.2.1','available'],['2.3.0','current'],['2.4.0','ahead']]){const r=await checkForUpdates({currentVersion,fetchImpl});assert.equal(r.status,status);assert.equal(r.source,'release-page');}
 assert.equal(calls.length,6);for(const c of calls){assert.equal(c.url,c.options.method==='HEAD'?RELEASE_PAGE:REPOSITORY+'/releases/tag/v2.3.0');assert.equal(c.options.credentials,'omit');assert.equal(c.options.redirect,'follow');assert.equal(c.options.cache,'no-store');assert.equal(c.options.headers,undefined);}
});
test('服务器不支持HEAD时仅对同一latest地址回退GET',async()=>{
 const methods=[];const result=await checkForUpdates({currentVersion:'2.3.0',fetchImpl:async(url,o)=>{assert([RELEASE_PAGE,REPOSITORY+'/releases/tag/v2.3.0'].includes(url));methods.push(o.method);return o.method==='HEAD'?{status:405,body:null}:page();}});
 assert.equal(result.status,'current');assert.deepEqual(methods,['HEAD','GET','GET']);
});
test('404、403、限流、离线和没有正式tag的200页面均不得宣称最新',async()=>{
 for(const fetchImpl of [async()=>page('2.2.3',404),async()=>page('2.3.0',403),async()=>page('2.3.0',429),async()=>{throw Error('offline');},async()=>({status:200,url:RELEASE_PAGE})]){
  const r=await checkForUpdates({fetchImpl});assert.equal(r.status,'unknown');assert(!r.latestVersion);assert(updateStatusText(r).includes('无法确认'));
 }
});
test('网站检查有超时并中止请求',async()=>{
 let signal;const r=await checkForUpdates({fetchImpl:async(_,o)=>{signal=o.signal;return new Promise(()=>{});},timeoutMs:10});assert.equal(r.status,'unknown');assert(signal.aborted);assert(r.reason.includes('超时'));
});
test('短时缓存和并发合并减少请求，过期后自动重新访问网页',async()=>{
 let clock=Date.parse('2026-11-10T00:00:00Z'),calls=0,saved;
 const check=createUpdateChecker({version:'2.3.0',now:()=>clock,load:async()=>saved,save:async r=>{saved=r;},check:async()=>{calls++;return {status:'current',currentVersion:'2.3.0',latestVersion:'2.3.0',checkedAt:new Date(clock).toISOString(),source:'release-page'};}});
 await Promise.all([check(),check()]);assert.equal(calls,1);assert((await check()).cached);clock+=120001;await check();assert.equal(calls,2);
});
test('旧API/文件检测缓存失效；新版本和失败缓存到期会重新检查',async()=>{
 let clock=Date.parse('2026-11-10T00:00:00Z'),calls=0;const old={status:'current',currentVersion:'2.3.0',latestVersion:'2.3.0',checkedAt:new Date(clock).toISOString(),source:'github-api'};
 const check=createUpdateChecker({version:'2.3.0',now:()=>clock,load:async()=>old,check:async()=>{calls++;return {...old,status:'unknown',source:'release-page',checkedAt:new Date(clock).toISOString()};}});
 await check();assert.equal(calls,1);clock+=29999;await check();assert.equal(calls,1);clock+=2;await check();assert.equal(calls,2);
 const changed=createUpdateChecker({version:'2.4.0',now:()=>clock,load:async()=>({...old,source:'release-page'}),check:async()=>{calls++;return {status:'unknown',source:'release-page'};}});await changed();assert.equal(calls,3);
});
test('Agent指令含设备/版本线索、404判定和升级回滚规范，不嵌入远端正文或敏感错误',()=>{
 const prompt=buildAgentUpdatePrompt({status:'available',latestVersion:'2.3.0',checkedAt:'2026-11-10T00:00:00Z',reason:'LEAK',assets:[{url:'https://evil.test'}]},{currentVersion:'2.2.1',extensionId:'a'.repeat(32)});
 for(const text of ['2.2.1','2.3.0','a'.repeat(32),'不要发业务问卷','SHA256SUMS','不是独立数字签名','404','UI','回滚','源码','不要操作真实鼠标','不包含上游推送/发布','不能套用旧路径'])assert(prompt.includes(text),text);
 assert(!prompt.includes('evil.test'));assert(!prompt.includes('LEAK'));assert(!prompt.includes('api.github.com'));assert(!prompt.includes('update.json'));
 const unknown=buildAgentUpdatePrompt({status:'unknown',latestVersion:'2.3.0',reason:'PRIVATE_PLAN'});assert(unknown.includes('未确认，必须重新检查'));assert(!unknown.includes('PRIVATE_PLAN'));
});
