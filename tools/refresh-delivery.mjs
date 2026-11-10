import fs from 'node:fs';
const write=(p,x)=>fs.writeFileSync(p,typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');
const recipes=JSON.parse(fs.readFileSync('extension/recipes.json')).slice(0,45);
for(const [name,op,mode]of [['检查编号、长任务和冗余依赖','graph.inspect','execute'],['预览零耗时虚边简化','graph.simplify','preview'],['执行零耗时虚边简化','graph.simplify','execute'],['撤销最近外观修改','theme.undo','execute']]){
 const command={protocol:'xutu.command/v1',requestId:'recipe-'+String(recipes.length+1).padStart(2,'0'),mode,steps:[{id:'s1',op,params:{},...(op.startsWith('graph.')?{target:{id:'TEST_PLAN_ID'}}:{})}]};
 recipes.push({name,condition:'写操作只用于已授权的测试对象；建议先预览。',command});
}
recipes.find(r=>r.name==='设置虚线').command.steps[0].params.estimateDays={minimum:0,likely:0,maximum:0};
write('extension/recipes.json',recipes);for(let i=0;i<recipes.length;i++)write('examples/'+String(i+1).padStart(2,'0')+'.json',recipes[i].command);
write('docs/COPY_PASTE_RECIPES.md','# 49份完整可复制示例\n\nTEST_*是占位值，请换成真实授权测试对象。写操作会改变服务器记录；必须保留真实依赖和验收点。每个新作业换requestId，重放旧ID不会重复执行。示例不证明真实账号已通过验收。\n\n'+recipes.map((r,i)=>'## '+(i+1)+'. '+r.name+'\n\n适用条件：'+r.condition+'\n\n预期：调用 '+r.command.steps[0].op+' 并返回结构化结果。风险：业务写入会保存到服务器；外观命令修改本机配置；JS权限独立。查看每步code和serverVerified。\n\n~~~json\n'+JSON.stringify(r.command,null,2)+'\n~~~\n').join('\n'));
for(const p of ['README.md','docs/INSTALL.md','docs/TERMINAL_MANUAL.md','docs/COMMAND_REFERENCE.md','docs/ACCEPTANCE.md','docs/TEST_REPORT.md','docs/GITHUB.md']){
 let s=fs.readFileSync(p,'utf8');
 s=s.replaceAll('JSON Lines 尚未实现','使用 --jsonl 支持 JSON Lines').replaceAll('18项通过','39项通过').replaceAll('45份示例','49份示例').replaceAll('45个示例','49个示例');
 s=s.replace('逐命令严格参数Schema、JSON Lines、多目标selector、可选备份、','外观/转换严格参数Schema、多目标selector、');
 s=s.replace('预览/日志/中断阻止重复已实现；可选备份、自动恢复未完成','预览/日志/中断阻止重复已实现；已有计划可选快照和恢复已测试；未知写入自动恢复未完成');
 s=s.replace('备份选项 true 当前返回不支持，不能依赖它恢复数据。','已有计划修改可选backup:true，结果返回backupId；用plan.restoreSnapshot恢复，仍需当前权限及版本检查。');
 s=s.replace('项目组列表写入目前仅回读未逐字段比对，返回 false。','项目组写入现在逐字段回读比对，未匹配时返回SERVER_NOT_CONFIRMED。');
 s=s.replace('它应包含','它应包含');
 const note='> 最新状态：Windows优先，macOS暂缓；核心参数Schema、JSON Lines、计划快照和图依赖检查已加入。参见 [当前状态](CURRENT_STATUS.md) 与 [Windows安装](WINDOWS_INSTALL.md)。\n\n';
 if(!s.includes('> 最新状态：'))s=note+s;
 if(p==='README.md')s=s.replace('(CURRENT_STATUS.md)','(docs/CURRENT_STATUS.md)').replace('(WINDOWS_INSTALL.md)','(docs/WINDOWS_INSTALL.md)');
 write(p,s);
}
