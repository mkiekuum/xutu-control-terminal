// Publish only an explicit allowlist of result metadata, never real plan contents.
import fs from 'node:fs';import path from 'node:path';
const audit=process.argv[2];if(!audit)throw Error('Pass the private local audit directory');
const files=['live-create-final','live-02-transform-final','live-03-edit-final','live-04-redundancy','live-05-copy-batch','live-06-restore-snapshot','live-07-theme','live-08-theme-restore','live-lifecycle','live-original-cleanup','live-copy-cleanup'];
const negatives={versionConflict:'VERSION_CONFLICT',adminDenied:'PERMISSION_DENIED',hardDeleteUnavailable:'UNSUPPORTED_BY_SITE',historyUnavailable:'UNSUPPORTED_BY_SITE'};
const results=files.flatMap(name=>{const r=JSON.parse(fs.readFileSync(path.join(audit,name+'.json'),'utf8').replace(/^\uFEFF/,''));return r.steps.map(s=>({case:name,step:s.id,status:s.status,...(s.code?{code:s.code}:{}),serverVerified:s.serverVerified===true,expected:negatives[s.id]||'success',passed:negatives[s.id]?s.code===negatives[s.id]:s.status==='success'}));});
const cleanup=JSON.parse(fs.readFileSync(path.join(audit,'live-cleanup-verification.json'),'utf8').replace(/^\uFEFF/,''));
const check=cleanup.steps[0].data[0].result;
const summary={date:'2026-11-10',environment:'Windows; installed browser extension; current ordinary user; explicitly authorized dedicated production test records',counts:{checkedSteps:results.length,passed:results.filter(s=>s.passed).length,unexpectedFailures:results.filter(s=>!s.passed).length},cleanup:{activeTestPlans:check.activeTestPlans.length,trashTestPlans:check.trashTestPlans.length,otherActivePlanCount:check.otherActivePlanCount,permanentDeletion:'unavailable'},results};
fs.writeFileSync('docs/live-test-evidence.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary.counts));
