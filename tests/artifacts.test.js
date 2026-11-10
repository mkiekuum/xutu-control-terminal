import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {validate} from '../extension/core.js';
function check(schema,value,path='$'){
 if(schema.const!==undefined)assert.deepEqual(value,schema.const,path);
 if(schema.enum)assert(schema.enum.includes(value),path);
 if(schema.type){const type=Array.isArray(value)?'array':value===null?'null':typeof value;assert(schema.type==='integer'?Number.isInteger(value):type===schema.type,path+' type');}
 if(schema.required)for(const k of schema.required)assert(Object.hasOwn(value,k),path+'.'+k);
 if(schema.type==='object'){for(const[k,v]of Object.entries(value)){const sub=schema.properties?.[k];if(sub)check(sub,v,path+'.'+k);else if(schema.additionalProperties===false)assert.fail(path+'.'+k+' additional');else if(schema.additionalProperties&&typeof schema.additionalProperties==='object')check(schema.additionalProperties,v,path+'.'+k);}}
 if(schema.type==='array'){if(schema.minItems)assert(value.length>=schema.minItems,path);if(schema.uniqueItems)assert.equal(new Set(value.map(x=>JSON.stringify(x))).size,value.length,path);if(schema.items)value.forEach((v,i)=>check(schema.items,v,path+'['+i+']'));}
 if(schema.pattern)assert(new RegExp(schema.pattern).test(value),path);if(schema.minLength)assert(value.length>=schema.minLength,path);if(schema.minimum!==undefined)assert(value>=schema.minimum,path);if(schema.maximum!==undefined)assert(value<=schema.maximum,path);
}
test('全部45份示例满足信封Schema所用关键字及运行时校验',()=>{const schema=JSON.parse(fs.readFileSync('schemas/command.schema.json'));const files=fs.readdirSync('examples');assert.equal(files.length,45);for(const name of files){const e=JSON.parse(fs.readFileSync('examples/'+name));check(schema,e,name);validate(e);}});
test('原生计划示例满足Schema',()=>{for(const name of fs.readdirSync('examples')){const e=JSON.parse(fs.readFileSync('examples/'+name));for(const s of e.steps)if(s.op==='plan.create')check(JSON.parse(fs.readFileSync('schemas/plan.schema.json')),s.params);}});
test('MV3发布权限限定站点，无旧时间代理或远程执行代码',()=>{const m=JSON.parse(fs.readFileSync('extension/manifest.json'));assert.equal(m.manifest_version,3);assert.deepEqual(m.host_permissions,['https://plan.fpgabbs.cn/*','https://github.com/*']);assert(!m.externally_connectable);for(const name of fs.readdirSync('extension').filter(n=>n.endsWith('.js'))){const source=fs.readFileSync('extension/'+name,'utf8');assert(!/window\.confirm\s*=|sourceFactor|planMinuteLabels|new Function|\beval\s*\(/.test(source),name);}});
