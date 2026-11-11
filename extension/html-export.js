// Self-contained function serialized into the selected page's ISOLATED world.
export async function capturePage(kind){
 if(location.origin!=='https://plan.fpgabbs.cn')throw Error('EXPORT_ORIGIN_DENIED');
 const missingResources=[],limit=8*1024*1024;let used=0;
 const resource=async(url)=>{try{const u=new URL(url,location.href);if(u.protocol==='data:')return u.href;if(u.origin!==location.origin)throw Error('跨域资源');const r=await fetch(u.href,{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('HTTP '+r.status);const b=await r.blob();if(b.size>limit||used+b.size>32*1024*1024)throw Error('资源超出内联上限');used+=b.size;return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(b);});}catch{missingResources.push({url:String(url),reason:'不可内联：跨域、网络、资源大小或格式限制'});return '';}};
 let html=document.documentElement.outerHTML;
 if(kind==='offline'){
  const root=document.documentElement.cloneNode(true);
  async function styleUrls(css,base){
   css=css.replace(/@import\s+(?:url\([^)]*\)|["'][^"']*["'])[^;]*;/gi,match=>{missingResources.push({url:match,reason:'嵌套CSS import未内联'});return '';});
   const matches=[...css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)];
   for(const m of matches){if(m[2].startsWith('#')||m[2].startsWith('data:'))continue;let value='';try{value=await resource(new URL(m[2],base).href);}catch{}css=css.replace(m[0],value?'url("'+value+'")':'none');}return css;
  }
  async function walk(original,copy){
   if(original.nodeType!==1)return;
   // Property-only form values and open shadows belong to the static export, not raw DOM.
   if(original.tagName==='INPUT'){copy.setAttribute('value',original.type==='password'?'':original.value);if(original.checked)copy.setAttribute('checked','');else copy.removeAttribute('checked');}
   if(original.tagName==='TEXTAREA')copy.textContent=original.value;
   if(original.tagName==='OPTION'){if(original.selected)copy.setAttribute('selected','');else copy.removeAttribute('selected');}
   if(original.tagName==='CANVAS'){try{const img=document.createElement('img');img.src=original.toDataURL();img.width=original.width;img.height=original.height;copy.replaceWith(img);return;}catch{missingResources.push({url:'canvas',reason:'画布受跨域限制'});}}
   const originals=[...original.children],copies=[...copy.children];for(let i=0;i<originals.length;i++)await walk(originals[i],copies[i]);
   if(original.shadowRoot){const template=document.createElement('template');template.setAttribute('shadowrootmode','open');const shadow=document.createDocumentFragment();for(const child of original.shadowRoot.childNodes)shadow.append(child.cloneNode(true));const oc=[...original.shadowRoot.children],cc=[...shadow.children];for(let i=0;i<oc.length;i++)await walk(oc[i],cc[i]);for(const sheet of original.shadowRoot.adoptedStyleSheets||[]){try{const style=document.createElement('style');style.textContent=[...sheet.cssRules].map(r=>r.cssText).join('\n');shadow.prepend(style);}catch{missingResources.push({url:'shadow stylesheet',reason:'无法读取采用样式表'});}}template.content.append(shadow);copy.prepend(template);}
  }
  await walk(document.documentElement,root);
  async function sanitize(container){
   for(const el of [...(container.nodeType===1?[container]:[]),...container.querySelectorAll('*')]){
    const tag=el.tagName.toUpperCase();
    if(tag==='TEMPLATE'){await sanitize(el.content);continue;}
    if(['SCRIPT','IFRAME','FRAME','OBJECT','EMBED','BASE','NOSCRIPT'].includes(tag)||tag==='META'){el.remove();continue;}
    if(tag==='LINK'){
     if(el.rel==='stylesheet'){try{const url=new URL(el.href,location.href);if(url.origin!==location.origin)throw Error('cross-origin');const r=await fetch(url.href,{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const css=await r.text();if(css.length>limit)throw Error();const style=document.createElement('style');style.textContent=await styleUrls(css,url.href);el.replaceWith(style);}catch{missingResources.push({url:el.href,reason:'样式表无法内联'});el.remove();}}
     else el.remove();continue;
    }
    if(tag==='STYLE')el.textContent=await styleUrls(el.textContent,location.href);
    if(el.hasAttribute('style'))el.setAttribute('style',await styleUrls(el.getAttribute('style'),location.href));
    if(tag==='FORM'){el.removeAttribute('action');el.setAttribute('inert','');}
    if(['INPUT','BUTTON','SELECT','TEXTAREA'].includes(tag))el.setAttribute('disabled','');
    for(const a of [...el.attributes]){
     const name=a.name.toLowerCase();if(name.startsWith('on')||['action','formaction','srcset','ping','autofocus','autoplay','contenteditable','integrity','nonce'].includes(name)){el.removeAttribute(a.name);continue;}
     if(['src','href','xlink:href','poster','background','data'].includes(name)){
      if(a.value.startsWith('#'))continue;
      if(['IMG','IMAGE','USE','SOURCE','VIDEO'].includes(tag)){const data=await resource(a.value);if(data&&/^data:image\/(?!svg\+xml)/i.test(data)||data&&tag==='IMG'&&data.startsWith('data:image/'))el.setAttribute(a.name,data);else {el.removeAttribute(a.name);missingResources.push({url:a.value,reason:'非静态图像资源或SVG外部引用'});}}
      else el.removeAttribute(a.name);
     }
    }
   }
  }
  await sanitize(root);
  const head=root.querySelector('head')||root.insertBefore(document.createElement('head'),root.firstChild),charset=document.createElement('meta'),csp=document.createElement('meta');charset.setAttribute('charset','utf-8');csp.setAttribute('http-equiv','Content-Security-Policy');csp.setAttribute('content',"default-src 'none'; script-src 'none'; connect-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline' data:; form-action 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'");head.prepend(charset,csp);
  const notice=document.createElement('p');notice.textContent='离线只读快照 · '+new Date().toISOString()+' · 不可登录或提交业务；可能包含私密资料。';root.querySelector('body')?.prepend(notice);
  html='<!doctype html>\n'+root.outerHTML;
 }
 const bytes=new TextEncoder().encode(html),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join(''),id=crypto.randomUUID();
 const cache=globalThis.__xutuExportCache??=new Map();for(const[key,value]of cache)if(Date.now()-value.at>300000)cache.delete(key);if(cache.size>=2)cache.delete(cache.keys().next().value);
 cache.set(id,{html,at:Date.now()});return {exportId:id,kind,length:html.length,bytes:bytes.length,sha256:hash,chunkSize:131072,missingResources,limitations:['原始outerHTML不含Shadow DOM和仅存在于JS属性的状态','离线导出仅尽量还原；closed Shadow DOM、动画和部分外部资源不可恢复']};
}
export function pageChunk(exportId,offset){
 if(location.origin!=='https://plan.fpgabbs.cn')throw Error('EXPORT_ORIGIN_DENIED');const entry=globalThis.__xutuExportCache?.get(exportId);if(!entry||Date.now()-entry.at>300000)throw Error('EXPORT_EXPIRED');if(!Number.isSafeInteger(offset)||offset<0)throw Error('INVALID_OFFSET');return {text:entry.html.slice(offset,offset+131072),offset,length:entry.html.length};
}
export function releasePageExport(exportId){globalThis.__xutuExportCache?.delete(exportId);return true;}
export async function assembleExport(meta,read){let text='';for(let offset=0;offset<meta.length;offset+=meta.chunkSize){const chunk=await read(offset);if(chunk.offset!==offset||chunk.length!==meta.length||!chunk.text)throw Error('导出不完整，请重新导出');text+=chunk.text;}const bytes=new TextEncoder().encode(text),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');if(text.length!==meta.length||bytes.length!==meta.bytes||hash!==meta.sha256)throw Error('导出完整性校验失败');return text;}
