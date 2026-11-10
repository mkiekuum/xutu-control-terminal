import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
const ajv=new Ajv({strict:false,allErrors:true});
for(const name of ['operation','command','plan','theme','result'])ajv.addSchema(JSON.parse(fs.readFileSync('schemas/'+name+'.schema.json')),name+'.schema.json');
test('JSON Schema 2020-12 标准验证器验证49份示例及各命令参数',()=>{
 const validate=ajv.getSchema('command.schema.json');
 for(const name of fs.readdirSync('examples')){const value=JSON.parse(fs.readFileSync('examples/'+name));assert(validate(value),name+': '+ajv.errorsText(validate.errors));}
});
test('标准Schema拒绝拼错写字段、错误类型及缺失必填参数',()=>{
 const validate=ajv.getSchema('command.schema.json');
 for(const params of [{set:{titel:'x'}},{set:{title:3}},{}]){
 const e={protocol:'xutu.command/v1',requestId:'schema-negative',steps:[{id:'a',op:'plan.update',target:{id:'TEST'},params}]};assert.equal(validate(e),false);
 }
});
