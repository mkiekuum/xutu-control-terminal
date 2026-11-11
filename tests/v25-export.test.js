import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {capturePage,pageChunk,assembleExport,releasePageExport} from '../extension/html-export.js';
import {fixture} from './export-fixture.js';
test('原始完整DOM字节/哈希/分块一致，不脱敏不下载资源；JS property和影子树限制如实说明',async()=>{
 const {dom,w,fetches,capture,chunk}=await fixture();try{const expected=w.document.documentElement.outerHTML,meta=await capture('raw'),html=await assembleExport(meta,o=>chunk(meta.exportId,o));assert.equal(html,expected);assert(meta.bytes>1000000);assert.equal(fetches.length,0);assert(!html.includes('仅property中的新值'));assert(!html.includes('影子树内文'));assert(html.includes('旧值'));assert.equal(w.__xutuExportCache.size,1);w.eval('('+releasePageExport.toString()+')('+JSON.stringify(meta.exportId)+')');assert.throws(()=>chunk(meta.exportId,0),/EXPORT_EXPIRED/);}finally{dom.window.close();}
});
test('离线快照保留表格SVG浮层、property值及open shadow，移除脚本提交并内联同源资源',async()=>{
 const {dom,w,fetches,capture,chunk}=await fixture();try{const meta=await capture('offline'),html=await assembleExport(meta,o=>chunk(meta.exportId,o)),out=new JSDOM(html),d=out.window.document;
  assert(d.querySelector('svg text').textContent.includes('节点'));assert.equal(d.querySelector('table').textContent,'验收完成2天');assert(d.querySelector('dialog[open]'));assert.equal(d.querySelector('#input').getAttribute('value'),'仅property中的新值');assert.equal(d.querySelector('textarea').textContent,'新文本');assert(d.querySelector('template[shadowrootmode]').content.textContent.includes('影子树内文'));assert.equal(d.querySelector('template').content.querySelectorAll('script').length,0);
  assert.equal(d.querySelectorAll('script,iframe,object,embed,link,[onclick],[onload]').length,0);assert(d.querySelector('form').hasAttribute('inert'));assert(d.querySelector('button').disabled);assert.match(d.querySelector('meta[http-equiv]').content,/connect-src 'none'/);assert(!d.querySelector('a').hasAttribute('href'));assert(d.querySelector('img').src.startsWith('data:image/png'));assert(meta.missingResources.some(x=>x.url.includes('external.invalid')));assert(fetches.every(f=>f.url.startsWith('https://plan.fpgabbs.cn/')&&!f.opts.method));assert(w.document.querySelector('button').getAttribute('onclick'));out.window.close();
 }finally{dom.window.close();}
});
test('丢块或哈希不一致拒绝返回、账号外站拒绝采集、导出缓存有上限',async()=>{
 const {dom,w,capture,chunk}=await fixture();try{const a=await capture('raw');await assert.rejects(assembleExport(a,async o=>({...chunk(a.exportId,o),text:'截断'})),/完整性/);await assert.rejects(assembleExport(a,async()=>({offset:0,length:a.length,text:''})),/不完整/);await capture('raw');await capture('raw');assert.equal(w.__xutuExportCache.size,2);dom.reconfigure({url:'https://other.invalid/'});await assert.rejects(capture('raw'),/EXPORT_ORIGIN_DENIED/);}finally{dom.window.close();}
});
