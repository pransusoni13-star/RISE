import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness() {
  const data = new Map();
  let failNext = false;
  const storage = {
    getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => {
      if (failNext) { failNext = false; throw new Error('device storage full'); }
      data.set(key, value);
    },
  };
  const source = ts.transpileModule(readFileSync(new URL('../src/services/syncOutbox.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => {
    assert.equal(name, '@react-native-async-storage/async-storage');
    return { __esModule: true, default: storage };
  }});
  return { outbox: exports, fail: () => { failNext = true; } };
}

test('acknowledging an older in-flight profile retains the newer offline edit', async () => {
  const {outbox} = harness();
  await outbox.queueProfile({custom_goal:'first goal'}, 'alice');
  const sent = (await outbox.listSyncOutbox())[0];
  await outbox.queueProfile({custom_goal:'new goal'}, 'alice');
  await outbox.removeSyncOutboxItem(sent.id, sent);
  const pending = await outbox.listSyncOutbox();
  assert.equal(pending.length, 1);
  assert.equal(pending[0].payload.custom_goal, 'new goal');
  await outbox.removeSyncOutboxItem(pending[0].id, pending[0]);
  assert.equal(await outbox.getPendingSyncCount(), 0);
});

test('concurrent offline events persist once and retain their owner', async () => {
  const {outbox} = harness();
  await Promise.all(Array.from({length:20}, (_, i) => outbox.queueProgressEvent({client_event_id:`event-${i}`}, 'alice')));
  await outbox.queueProgressEvent({client_event_id:'event-0'}, 'alice');
  const pending = await outbox.listSyncOutbox();
  assert.equal(pending.length, 20);
  assert.ok(pending.every(item => item.ownerId === 'alice'));
});

test('a failed device write is reported and does not poison the next sync save', async () => {
  const {outbox,fail} = harness();
  fail();
  await assert.rejects(outbox.queueProfile({custom_goal:'first'}, 'alice'), /storage full/);
  await outbox.queueProfile({custom_goal:'retry'}, 'alice');
  assert.equal((await outbox.listSyncOutbox())[0].payload.custom_goal, 'retry');
});
