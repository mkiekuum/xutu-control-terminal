export function installSidebarUI(doc=document){
 const panel=doc.getElementById('fileSidebar'),toggle=doc.getElementById('fileSidebarToggle');
 if(!panel||!toggle)return {available:false,reason:'未找到左侧计划栏，未修改网页'};
 const old={class:panel.className,text:toggle.textContent,expanded:toggle.getAttribute('aria-expanded')};
 let open=false;const controller=new doc.defaultView.AbortController(),options={capture:true,signal:controller.signal};
 const style=doc.createElement('style');style.textContent=`html.xutu-sidebar-optimized{--file-space:0px!important}html.xutu-sidebar-optimized #fileSidebar{position:fixed!important;z-index:1000!important;width:min(620px,calc(100vw - 40px))!important;max-height:100vh;overflow:auto;overscroll-behavior:contain;box-shadow:5px 0 18px #0002}html.xutu-sidebar-optimized #fileSidebar.is-collapsed{width:36px!important;overflow:hidden!important}html.xutu-sidebar-optimized #fileSidebarPin{display:none!important}#xutu-sidebar-close{position:sticky;top:0;z-index:2;width:100%;background:#fff;padding:9px;cursor:pointer}html.xutu-sidebar-optimized #fileSidebar.is-collapsed #xutu-sidebar-close{display:none}html.xutu-sidebar-optimized #fileSidebarToggle{touch-action:manipulation}`;
 const close=doc.createElement('button');close.id='xutu-sidebar-close';close.textContent='收起计划列表';close.type='button';panel.prepend(close);doc.head.append(style);doc.documentElement.classList.add('xutu-sidebar-optimized');
 const render=()=>{panel.classList.toggle('is-collapsed',!open);toggle.textContent=open?'‹ 收起计划':'计划 ›';toggle.setAttribute('aria-expanded',String(open));};
 const block=e=>{if(e.target===panel||panel.contains(e.target))e.stopImmediatePropagation();};
 for(const type of ['pointerenter','pointerleave','pointermove','focusin','focusout'])doc.addEventListener(type,block,options);
 doc.addEventListener('click',e=>{if(toggle.contains(e.target)||close.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();open=close.contains(e.target)?false:!open;render();}else if(open&&!panel.contains(e.target)){open=false;render();}},options);
 doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){open=false;render();}},options);
 const observer=new doc.defaultView.MutationObserver(()=>{if(panel.classList.contains('is-collapsed')===open)render();});observer.observe(panel,{attributes:true,attributeFilter:['class']});render();
 return {available:true,destroy(){controller.abort();observer.disconnect();close.remove();style.remove();doc.documentElement.classList.remove('xutu-sidebar-optimized');panel.className=old.class;toggle.textContent=old.text;if(old.expanded===null)toggle.removeAttribute('aria-expanded');else toggle.setAttribute('aria-expanded',old.expanded);}};
}
