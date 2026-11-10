import test from 'node:test';import assert from 'node:assert/strict';import {operationId} from '../extension/core.js';
test('服务器操作ID为稳定UUID；重放相同、不同步骤和冲突尝试隔离',async()=>{
 const a=await operationId('human-readable-request','merge');assert.match(a,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
 assert.equal(a,await operationId('human-readable-request','merge'));
 assert.notEqual(a,await operationId('human-readable-request','split'));
 assert.notEqual(a,await operationId('human-readable-request','merge','conflict'));
});
