import {relayUrl} from './mcp-bridge.js';
// Import only the local relay credentials; never accept website sessions or arbitrary options.
export function parseConnection(text,tabId){
 if(!Number.isInteger(tabId)||tabId<=0)throw Error('请先选择序图网页');
 if(typeof text!=='string'||text.length>4096)throw Error('连接文件过大或格式不正确');
 let c;try{c=JSON.parse(text);}catch{throw Error('请选择本机 MCP 生成的 connection.json');}
 if(!c||typeof c!=='object')throw Error('连接文件格式不正确');
 const url=relayUrl(c.url);
 for(const key of ['clientToken','bridgeToken'])if(typeof c[key]!=='string'||!/^[-_a-zA-Z0-9]{32,256}$/.test(c[key]))throw Error('连接文件密钥无效，请重新生成');
 if(c.clientToken===c.bridgeToken)throw Error('AI 密钥和浏览器密钥必须分开');
 return {url,token:c.bridgeToken,clientToken:c.clientToken,bridgeId:crypto.randomUUID(),tabId,enabled:true};
}
