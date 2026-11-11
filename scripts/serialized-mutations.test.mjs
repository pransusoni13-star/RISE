import assert from "node:assert/strict";
import test from "node:test";

import { createSerializedMutationQueue } from "../src/services/serializedMutations.ts";

test("serialized mutations finish in the order they were requested", async () => {
  const runMutation = createSerializedMutationQueue();
  const events = [];

  const first = runMutation(async () => {
    events.push("first:start");
    await new Promise((resolve) => setTimeout(resolve, 20));
    events.push("first:end");
    return 1;
  });
  const second = runMutation(async () => {
    events.push("second:start");
    events.push("second:end");
    return 2;
  });

  assert.deepEqual(await Promise.all([first, second]), [1, 2]);
  assert.deepEqual(events, ["first:start", "first:end", "second:start", "second:end"]);
});

test("one failed mutation does not stop later saves", async () => {
  const runMutation = createSerializedMutationQueue();

  await assert.rejects(runMutation(async () => {
    throw new Error("storage unavailable");
  }));

  assert.equal(await runMutation(async () => "saved"), "saved");
});
