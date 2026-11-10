(()=>{
 if(globalThis.__xutuBridgeInstalled)return;globalThis.__xutuBridgeInstalled=true;
 const origin='https://plan.fpgabbs.cn',style=document.createElement('style');style.id='xutu-theme-style';document.head.append(style);let components=[];
 const error=code=>Object.assign(new Error(code),{code});
 function render(themes){style.textContent='';components.forEach(n=>n.remove());components=[];let css='';const nodes=[];
 try{for(const t of themes){if(t.schema!=='xutu.theme/v1'||t.scope?.origin!==origin)throw error('INVALID_THEME');if(t.scope.path!=='/*'&&t.scope.path!==location.pathname)continue;
 const declarations=o=>Object.entries(o).map(([k,v])=>{if(!/^(--[a-zA-Z][\w-]*|[a-zA-Z][\w-]*)$/.test(k)||typeof v!=='string'||/[{};@\\]|url\s*\(|expression|javascript:/i.test(v))throw error('INVALID_THEME');return k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+':'+v;}).join(';');
 css+=':root{'+declarations(Object.fromEntries(Object.entries(t.tokens||{}).map(([k,v])=>['--xutu-'+k,v])))+'}';
 for(const [selector,props]of Object.entries(t.selectors||{})){if(/[{}@\\]/.test(selector)||!document.querySelector(selector))throw error('THEME_ANCHOR_MISSING');css+=selector+'{'+declarations(props)+'}';}
 for(const [i,selector]of (t.layout?.order||[]).entries()){if(/[{}@\\]/.test(selector)||!document.querySelector(selector))throw error('THEME_ANCHOR_MISSING');css+=selector+'{order:'+i+'}';}
 for(const selector of t.layout?.hidden||[]){if(/[{}@\\]/.test(selector)||!document.querySelector(selector))throw error('THEME_ANCHOR_MISSING');css+=selector+'{display:none!important}';}
 for(const c of t.components||[]){const anchors=document.querySelectorAll(c.anchor);if(anchors.length!==1)throw error('THEME_ANCHOR_MISSING');if(!['text','note','label','divider','details'].includes(c.kind))throw error('INVALID_THEME');const node=document.createElement('div');node.dataset.xutuComponent=c.id;const root=node.attachShadow({mode:'closed'});const text=document.createElement(c.kind==='divider'?'hr':c.kind==='details'?'details':'span');if(c.kind==='details'){const summary=document.createElement('summary');summary.textContent=c.title||'提示';text.append(summary,document.createTextNode(c.text||''));}else text.textContent=c.text||'';root.append(text);nodes.push({anchor:anchors[0],node});}
 }style.textContent=css;for(const x of nodes){x.anchor.append(x.node);components.push(x.node);}return {applied:true};}catch(e){style.textContent='';components.forEach(n=>n.remove());components=[];throw e;}}
 async function appearance(op,p){let themes=(await chrome.storage.local.get('xutuThemes')).xutuThemes||[];
 async function save(next){const state=await chrome.storage.local.get('xutuThemeUndo');await chrome.storage.local.set({xutuThemes:next,xutuThemeUndo:[...(state.xutuThemeUndo||[]),themes].slice(-20)});}
 if(op==='theme.undo'){const state=await chrome.storage.local.get('xutuThemeUndo'),undo=state.xutuThemeUndo||[];if(!undo.length)throw error('NO_UNDO');const previous=undo.pop();render(previous);await chrome.storage.local.set({xutuThemes:previous,xutuThemeUndo:undo});return {undone:true};}
 if(op==='theme.list'||op==='theme.export')return themes;
 if(op==='theme.reset'){render([]);await save([]);return {reset:true};}
 if(op==='theme.apply'||op==='theme.save'||op==='theme.import'){const theme=p.theme||p,next=themes.filter(t=>t.scope.path!==theme.scope?.path);next.push(theme);const result=render(next);await save(next);return result;}
 if(op.startsWith('layout.')){const theme=structuredClone(themes.find(t=>t.scope.path===(p.path||'/*'))||{schema:'xutu.theme/v1',name:'布局',scope:{origin,path:p.path||'/*'}});theme.layout??={order:[],hidden:[]};theme.components??=[];
 if(op==='layout.set')theme.layout=p.layout;
 else if(op==='layout.move')theme.layout.order=p.order;
 else if(op==='layout.hide')theme.layout.hidden=[...new Set([...theme.layout.hidden,p.selector])];
 else if(op==='layout.show')theme.layout.hidden=theme.layout.hidden.filter(x=>x!==p.selector);
 else if(op==='layout.component.add'){if(theme.components.some(x=>x.id===p.component.id))throw error('INVALID_THEME');theme.components.push(p.component);}
 else if(op==='layout.component.remove')theme.components=theme.components.filter(x=>x.id!==p.id);else throw error('UNSUPPORTED_BY_SITE');return appearance('theme.apply',{theme});}
 throw error('UNSUPPORTED_BY_SITE');}
 chrome.runtime.onMessage.addListener((m,sender,reply)=>{if(sender.id!==chrome.runtime.id)return;(async()=>{
 if(m.kind==='inspect'){const ids=['new','nodeSubmit','edgeSubmit','rows','planOwner','planNumber','title'];return {origin:location.origin,anchors:Object.fromEntries(ids.map(id=>[id,document.querySelectorAll('#'+id).length])),activeTarget:{number:document.getElementById('planNumber')?.value||'',owner:document.getElementById('planOwner')?.value||''},auth:'use site.session for authoritative result'};}
 if(m.kind==='appearance')return appearance(m.op,m.params);
 if(m.kind!=='api'||!/^\/api\/(session|plans(?:\/[^/?#]+(?:\/(change|import|trash|undelete|submit|review|restore))?)?|trash|assignees|project-groups|visibility-groups|work-tasks(?:\/update)?)$/.test(m.path))throw error('PERMISSION_DENIED');
 try{const r=await fetch(m.path,{method:m.method,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:m.body?JSON.stringify(m.body):undefined,signal:AbortSignal.timeout(20000)});if(!r.ok){let detail;try{const payload=await r.json();detail=typeof payload.error==='string'?payload.error:typeof payload.message==='string'?payload.message:'';}catch{}return {ok:false,code:({400:'INVALID_SITE_DATA',401:'NOT_LOGGED_IN',403:'PERMISSION_DENIED',404:'TARGET_NOT_FOUND',409:'VERSION_CONFLICT',410:'TARGET_TRASHED'})[r.status]||'SERVER_ERROR',message:'服务器 HTTP '+r.status+(detail?'：'+detail.slice(0,500):'')};}return {ok:true,data:await r.json()};}catch{return {ok:false,code:'NETWORK_ERROR',message:'请求失败或超时；写入状态未知，先回读再处理'};}
 })().then(reply,e=>reply({ok:false,code:e.code||'DOM_DRIFT',message:e.message}));return true;});
 chrome.storage.local.get('xutuThemes').then(v=>{try{render(v.xutuThemes||[]);}catch{console.warn('Xutu: THEME_ANCHOR_MISSING，已恢复默认外观');}});
})();
