export function setupToolPanels(doc){
 const pairs=[['loadHistory','historyBody'],['pageTools','pageToolsPanel'],['moreToggle','moreDetails']];
 function show(id){for(const [button,panel] of pairs){doc.getElementById(panel).hidden=panel!==id;doc.getElementById(button).setAttribute('aria-expanded',String(panel===id));}}
 function toggle(id){show(doc.getElementById(id).hidden?id:null);}
 for(const [button,panel] of pairs){const b=doc.getElementById(button);b.setAttribute('aria-controls',panel);b.setAttribute('aria-expanded','false');if(button!=='loadHistory')b.onclick=()=>toggle(panel);}
 return {show,toggle};
}
