export const preferenceChoices={audience:['neutral','self','report'],detail:['neutral','brief','normal','detailed'],naming:['neutral','preserve','plain'],scope:['specified','structure'],numbering:['preserve','continuous']};
export const neutralPreferences={audience:'neutral',detail:'neutral',naming:'neutral',scope:'specified',numbering:'preserve'};
export function sanitizePreferences(input={}){return Object.fromEntries(Object.entries(preferenceChoices).map(([k,values])=>[k,values.includes(input[k])?input[k]:neutralPreferences[k]]));}
export async function preferenceKey(actor,scene){
 if(typeof actor!=='string'||!actor||!['create','manage'].includes(scene))throw Error('请先登录并选择使用场景。');
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(['https://plan.fpgabbs.cn',actor,scene])));
 return 'preferences:'+Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
}
export async function preferencesFor(store,actor,scene,action='get',value,expectedScope){
 const scope=await preferenceKey(actor,scene);
 if(action!=='get'&&expectedScope!==scope)throw Error('登录账号或使用场景已变化，请重新查看偏好后再保存。');
 if(action==='save')await store.set(scope,sanitizePreferences(value));
 else if(action==='reset')await store.set(scope,null);
 else if(action!=='get')throw Error('无效偏好操作');
 const saved=await store.get(scope);return {scope,remembered:!!saved,values:sanitizePreferences(saved||{})};
}
