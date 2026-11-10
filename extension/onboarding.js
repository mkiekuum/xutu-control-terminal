import {generateCommand,providerURL} from './ai.js';import {parameterSchemas} from './validation.js';
export async function setupOnboarding({send,show,refresh,envelope}){
 const host=document.createElement('div');host.innerHTML=await (await fetch('onboarding.html')).text();document.getElementById('terminalPanel').prepend(host);
 const $=id=>host.querySelector('#'+id),stored=(await chrome.storage.session.get('aiConnection')).aiConnection;
 if(stored){$('aiBase').value=stored.baseURL;$('aiModel').value=stored.model;$('aiKey').value=stored.apiKey||'';}
 $('openSite').onclick=async()=>{const result=await send({kind:'openSite'});$('connectionStatus').textContent=result.message||'网站已打开，请在网站完成登录';await refresh();};
 $('checkSite').onclick=async()=>{await refresh();const result=await send({kind:'run',command:envelope('site.session')});$('connectionStatus').textContent=result.status==='success'?'网站已登录，可以使用当前账号权限':'尚未连接：请打开网站并登录';show(result);};
 $('connectAI').onclick=async()=>{try{const baseURL=$('aiBase').value.trim(),endpoint=providerURL(baseURL);if(!$('aiModel').value.trim())throw Error('请填写模型名称');const allowed=await chrome.permissions.request({origins:[endpoint.origin+'/*']});if(!allowed)throw Error('未授予此AI服务访问权限');await chrome.storage.session.set({aiConnection:{baseURL,model:$('aiModel').value.trim(),apiKey:$('aiKey').value}});$('aiHelp').textContent='连接配置已保存；首次生成时验证模型与Key。仅将你输入的内容及明确勾选的数据发给该服务。';}catch(e){$('aiHelp').textContent=e.message;}};
 $('disconnectAI').onclick=async()=>{await chrome.storage.session.remove('aiConnection');$('aiKey').value='';$('aiHelp').textContent='已清除当前浏览器会话中的AI配置。';};
 $('generateAI').onclick=async()=>{const button=$('generateAI');button.disabled=true;try{
  const connection=(await chrome.storage.session.get('aiConnection')).aiConnection;if(!connection)throw Error('先展开“连接AI”，保存服务地址和模型。');
  let context;if($('shareContext').checked){const inspection=await send({kind:'run',command:envelope('site.inspect')}),target=inspection.steps?.[0]?.data?.activeTarget;if(!target?.number)throw Error('当前网站没有已选计划，无法发送上下文');const c=envelope('plan.get');c.steps[0].target=target;const read=await send({kind:'run',command:c});if(read.status!=='success')throw Error('无法读取当前计划，请先检查登录');context=read.steps[0].data;}
  const command=await generateCommand({...connection,prompt:$('naturalPrompt').value,context});command.tabId=Number(document.getElementById('tabs').value);
  command.mode=$('executeAI').checked?'execute':'preview';document.getElementById('mode').value='JSON';document.getElementById('editor').value=JSON.stringify(command,null,2);
  show(await send({kind:'run',command}));$('aiHelp').textContent=command.mode==='execute'?'执行已结束，请检查结果；失败步骤没有被当成成功。':'已生成并预览；下方“执行”可提交。请核对编号和工作关系。';
 }catch(e){show({status:'failed',code:e.code||'AI_CONNECTION_ERROR',message:e.message});$('aiHelp').textContent='未自动继续：'+e.message;}finally{button.disabled=false;}};
 $('copyUniversal').onclick=async()=>{await navigator.clipboard.writeText('请将下述需求转换成xutu.command/v1 JSON信封（protocol、requestId、steps），只输出JSON。保留已有编号；不能猜测目标ID。虚任务三个估时均为0；不要增加A→B→C之外的重复A→C虚边。未知信息先生成查询，不编造。禁止script.execute。可用参数契约：'+JSON.stringify(Object.fromEntries(Object.entries(parameterSchemas).filter(([op])=>op!=='script.execute')))+'\n用户需求：'+$('naturalPrompt').value);$('aiHelp').textContent='提示词已复制；粘贴到你使用的AI，再把返回JSON粘贴到终端。没有自动发送网站内容。';};
 $('copyMcp').onclick=async()=>{const result=await send({kind:'mcpConfig'});if(result.config){await navigator.clipboard.writeText(JSON.stringify(result.config,null,2));$('aiHelp').textContent='MCP配置已复制，粘贴到支持本地MCP的AI客户端。配置不含API Key或网页登录凭据。';}else $('aiHelp').textContent=result.message||'先连接Windows本地宿主。';};
}
