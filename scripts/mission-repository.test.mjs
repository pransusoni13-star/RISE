import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createSerializedMutationQueue} from '../src/services/serializedMutations.ts';

function harness(initial = null) {
  let raw = initial;
  let readFailure = false;
  let writeFailure = false;
  let writes = 0;
  const storage = {
    getItem: async () => { if (readFailure) throw new Error('read unavailable'); return raw; },
    setItem: async (_, value) => { if (writeFailure) throw new Error('storage full'); writes++; raw=value; },
  };
  const source = ts.transpileModule(readFileSync(new URL('../src/services/missionRepository.ts', import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports = {};
  vm.runInNewContext(source,{exports,require:name => {
    if(name==='./serializedMutations') return {createSerializedMutationQueue};
    assert.equal(name,'@react-native-async-storage/async-storage');
    return {__esModule:true,default:storage};
  }});
  return {repo:exports.missionRepository, raw:()=>raw, writes:()=>writes, failRead:value=>{readFailure=value;},failWrite:value=>{writeFailure=value;}};
}

test('unreadable or malformed history is never overwritten by the next mission save',async()=>{
  for(const raw of ['{broken','[]','null','{"old":{"status":"completed"}}']) {
    const h=harness(raw);
    await assert.rejects(h.repo.patch('new',{status:'in_progress'}));
    assert.equal(h.raw(),raw);
    assert.equal(h.writes(),0);
  }
  const h=harness();
  h.failRead(true);
  await assert.rejects(h.repo.patch('new',{status:'in_progress'}),/read unavailable/);
  assert.equal(h.writes(),0);
  h.failRead(false);
  await h.repo.patch('new',{status:'in_progress'});
  assert.equal((await h.repo.get('new')).status,'in_progress');
});

test('concurrent mission saves retain every record and written results survive reopening',async()=>{
  const h=harness();
  await Promise.all(Array.from({length:20},(_,i)=>h.repo.patch(`mission-${i}`,{chosenResult:`Attempt ${i}`})));
  assert.equal((await h.repo.list()).length,20);
  await h.repo.patch('mission-0',{status:'completed',proof:{type:'text',uri:'',missionId:'mission-0',submittedAt:'2026-11-27T12:00:00Z',description:'Ten recorded trials'}});
  const record=await h.repo.get('mission-0');
  assert.equal(record.proof.type,'text');
  assert.equal(record.proof.description,'Ten recorded trials');
  assert.equal(record.chosenResult,'Attempt 0');
});

test('failed mission writes preserve existing history and do not poison later saves',async()=>{
  const h=harness();
  await h.repo.patch('existing',{chosenResult:'Keep this result'});
  const before=h.raw();
  h.failWrite(true);
  await assert.rejects(h.repo.patch('new',{status:'in_progress'}),/storage full/);
  assert.equal(h.raw(),before);
  h.failWrite(false);
  await h.repo.patch('new',{status:'in_progress'});
  assert.equal((await h.repo.get('existing')).chosenResult,'Keep this result');
  assert.equal((await h.repo.list()).length,2);
});
