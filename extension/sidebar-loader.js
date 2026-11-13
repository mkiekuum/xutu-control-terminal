(async()=>{
 if(globalThis.__xutuSidebarLoader)return;globalThis.__xutuSidebarLoader=true;
 const {installSidebarUI}=await import(chrome.runtime.getURL('sidebar-ui.js'));let ui;
 const apply=async()=>{const {optimizeSidebar}=await chrome.storage.local.get('optimizeSidebar');ui?.destroy();ui=optimizeSidebar?installSidebarUI():null;};
 chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.optimizeSidebar)apply();});await apply();
})();
