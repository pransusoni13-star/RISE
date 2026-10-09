import test from "node:test";
import assert from "node:assert/strict";
import { daysUntilMission, getAvailableMissionDay, getUnlockedDay, isMissionAvailable } from "../src/services/dayUnlock.ts";

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

test("tomorrow does not unlock until the earlier mission is complete", () => {
  const now = new Date("2026-10-04T09:00:00Z");
  assert.equal(getAvailableMissionDay("2026-10-01T12:00:00Z", 7, [], now), 1);
  assert.equal(getAvailableMissionDay("2026-10-01T12:00:00Z", 7, [1], now), 2);
  assert.equal(getAvailableMissionDay("2026-10-01T12:00:00Z", 7, [1, 2], now), 3);
});

test("finishing today never opens tomorrow early", () => {
  const now = new Date("2026-10-01T20:00:00Z");
  assert.equal(getAvailableMissionDay("2026-10-01T08:00:00Z", 7, [1], now), 1);
  assert.equal(isMissionAvailable(2, "2026-10-01T08:00:00Z", 7, [1], now), false);
});
