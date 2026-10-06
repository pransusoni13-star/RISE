import test from "node:test";
import assert from "node:assert/strict";
import { daysUntilMission, getUnlockedDay } from "../src/services/dayUnlock.ts";

test("only day one is available on the plan start date", () => {
  assert.equal(getUnlockedDay("2026-10-06T22:00:00Z", 7, new Date("2026-10-06T23:00:00Z")), 1);
});

test("one new mission unlocks on each local calendar day", () => {
  assert.equal(getUnlockedDay("2026-10-01T12:00:00Z", 7, new Date("2026-10-04T09:00:00Z")), 4);
  assert.equal(daysUntilMission(6, 4), 2);
});

test("unlocked day never exceeds the cycle length", () => {
  assert.equal(getUnlockedDay("2026-01-01T00:00:00Z", 7, new Date("2026-10-06T00:00:00Z")), 7);
});
