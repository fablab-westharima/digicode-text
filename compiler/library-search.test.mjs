import test from 'node:test';
import assert from 'node:assert/strict';
import { collectCandidates, searchTerms } from './library-search.mjs';
import { searchLibraries } from './registry.mjs';
const p = (id,name) => ({id,name,owner:'test',version:'1.0.0'});
test('rank, ID dedup, bounded evidence-based prefix completion',async()=>{
 const calls=[];
 const result=await collectCandidates('serv',async params=>{
  calls.push(params);
  if(params.query==='type:library name:"serv"')return {items:[p(1,'serv')],total:1};
  if(params.query==='type:library Servo*')return {items:[p(3,'ESP32Servo'),p(2,'Servo')],total:2};
  return {items:[p(4,'Related'),p(2,'Servo'),p(1,'serv')],total:300};
 });
 assert.equal(calls.length,5); assert.ok(calls.every(c=>c.page===1));
 assert.deepEqual(result.items.map(p=>p.id),[1,2,3,4]); assert.equal(result.total,4); assert.equal(result.scope,'candidates'); assert.equal(result.limited,true);
});
test('literal syntax and exact multiword/punctuation preserved',()=>{
 assert.equal(searchTerms('  Adafruit BusIO  ').phrase,'"Adafruit BusIO"');
 assert.equal(searchTerms('MKS_SERVO42').phrase,'"MKS_SERVO42"');
 assert.equal(searchTerms('type:tool +Servo').phrase,'"type:tool +Servo"');
 assert.equal(searchTerms('type:tool +Servo').wildcard,'type* tool* Servo*');
 for(const q of ['','x\ny','" type:tool','back\\slash'])assert.throws(()=>searchTerms(q));
});
test('base or supplemental failure never becomes empty/partial success',async()=>{
 for(const fail of ['name:', 'Servo*']) {
  await assert.rejects(collectCandidates('serv',async params=>{
   if(params.query.includes(fail))throw new Error('network failed');
   return {items:[p(1,'Servo')],total:1};
  }),/network failed/);
 }
});
test('case-insensitive cache coalesces requests and retries failures',async t=>{
 let calls=0,fail=false;
 t.mock.method(globalThis,'fetch',async()=>{
  calls++; if(fail)throw new Error('offline');
  return {ok:true,text:async()=>JSON.stringify({items:Array.from({length:15},(_,i)=>({id:i+1,type:'library',owner:{username:'test'},name:'Package'+i,version:{name:'1.0.0'}})),total:15})};
 });
 await Promise.all([searchLibraries('CACHEtest',1),searchLibraries('cacheTEST',1)]); assert.equal(calls,4);
 const cached=await searchLibraries('cachetest',1); assert.equal(calls,4); assert.equal(cached.items.length,10);
 fail=true; await assert.rejects(searchLibraries('failtest',1)); const before=calls;
 fail=false; await searchLibraries('failtest',1); assert.equal(calls,before+4);
});
