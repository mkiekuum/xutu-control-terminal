import fs from 'node:fs';
import {parameterSchemas} from '../extension/validation.js';
const schema={$schema:'https://json-schema.org/draft/2020-12/schema',title:'已映射命令的参数约束',oneOf:Object.entries(parameterSchemas).map(([op,params])=>({type:'object',required:['op'],properties:{op:{const:op},params},...(params.required?.length?{required:['op','params']}:{})}))};
fs.writeFileSync('schemas/operation.schema.json',JSON.stringify(schema,null,2)+'\n');
const command=JSON.parse(fs.readFileSync('schemas/command.schema.json'));
command.properties.steps.items.allOf=[{if:{properties:{op:{enum:Object.keys(parameterSchemas)}},required:['op']},then:{$ref:'operation.schema.json'}}];
fs.writeFileSync('schemas/command.schema.json',JSON.stringify(command,null,2)+'\n');
