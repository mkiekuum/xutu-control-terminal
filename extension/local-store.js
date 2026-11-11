// Versioned private extension database. Never browser sync or public artifacts.
export class LocalStore {
 constructor(indexedDB=globalThis.indexedDB){this.idb=indexedDB;}
 async db(){
  if(!this.idb)throw Object.assign(Error('本机历史存储不可用，未开始写入。'),{code:'HISTORY_STORAGE_FAILED'});
  if(!this.opening)this.opening=new Promise((resolve,reject)=>{const r=this.idb.open('xutu-private-v25',1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('IndexedDB upgrade blocked'));});
  return this.opening;
 }
 async transact(mode,action){try{const db=await this.db();return await new Promise((resolve,reject)=>{const tx=db.transaction('records',mode),r=action(tx.objectStore('records'));tx.oncomplete=()=>resolve(r.result);tx.onerror=tx.onabort=()=>reject(tx.error||Error('IndexedDB transaction failed'));});}catch{throw Object.assign(Error('本机快照保存或读取失败，请检查存储空间。'),{code:'HISTORY_STORAGE_FAILED'});}}
 get(key){return this.transact('readonly',s=>s.get(key));}
 set(key,value){return this.transact('readwrite',s=>s.put(value,key));}
 remove(key){return this.transact('readwrite',s=>s.delete(key));}
}
export async function digest(value){const sorted=x=>Array.isArray(x)?x.map(sorted):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sorted(x[k])])):x;const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(sorted(value))));return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');}
export const accountKey=actor=>digest(['https://plan.fpgabbs.cn',actor]);
