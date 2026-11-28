import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as planner from "../src/services/missionPlanner.ts";
import {
  createSevenDayPlan,
  fallbackProfile,
} from "../src/services/missionPlanner.ts";

const compiled = ts.transpileModule(
  readFileSync(
    new URL("../src/services/quickStart.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const exports = {};
vm.runInNewContext(compiled, {
  exports,
  require: (name) => {
    assert.equal(name, "./missionPlanner");
    return planner;
  },
});
const { QUICK_START_GOALS, quickStartProfile } = exports;
const cycleExports = {};
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(
      new URL("../src/services/practiceCycle.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  { exports: cycleExports },
);
const { canStartNextCycle, nextPracticeCycle } = cycleExports;

test("a completed week continues tomorrow with its goal and time budget intact", () => {
  const completed = new Date(2026, 10, 27, 12);
  const tomorrow = new Date(2026, 10, 28, 9);
  for (const invalid of [undefined, "invalid", tomorrow.toISOString()])
    assert.equal(canStartNextCycle(invalid, completed), false);
  assert.equal(
    canStartNextCycle(completed.toISOString(), new Date(2026, 10, 27, 23)),
    false,
  );
  const profile = {
    ...fallbackProfile,
    ...quickStartProfile(
      "custom",
      5,
      "Improve at Beyblade",
      "2026-11-21T12:00:00Z",
    ),
  };
  assert.throws(() =>
    nextPracticeCycle(profile, completed.toISOString(), completed),
  );
  const next = {
    ...profile,
    ...nextPracticeCycle(profile, completed.toISOString(), tomorrow),
  };
  assert.equal(next.customGoal, profile.customGoal);
  assert.equal(next.availableTime, profile.availableTime);
  assert.equal(next.practiceCycle, 2);
  const oldPlan = createSevenDayPlan(profile);
  const newPlan = createSevenDayPlan(next);
  assert.ok(newPlan.every((task) => task.duration <= 5));
  assert.notEqual(newPlan[0].id, oldPlan[0].id);
  assert.match(newPlan[0].title, /Level 2/);
});

test("quick-start directions create a concrete task within each chosen time budget", () => {
  for (const option of QUICK_START_GOALS)
    for (const minutes of [5, 10, 20]) {
      const patch = quickStartProfile(
        option.id,
        minutes,
        "Become a better Beyblader",
        "2026-11-27T12:00:00Z",
      );
      const plan = createSevenDayPlan({ ...fallbackProfile, ...patch });
      assert.equal(plan.length, 7);
      assert.equal(patch.focusSkills.length, 1);
      assert.ok(
        plan.every((task) => task.duration <= minutes && task.duration > 0),
      );
      assert.ok(plan[0].steps.every((step) => step.length > 20));
      if (option.id === "custom")
        assert.match(plan[0].title, /launch consistency/i);
      if (option.id === "coding")
        assert.doesNotMatch(plan[0].steps[0], /two typed props/i);
    }
});

test("changing difficulty never exceeds the user’s five-minute time budget", () => {
  for (const feedback of ["too_easy", "too_hard", "right"]) {
    const patch = quickStartProfile("study", 5);
    const tasks = createSevenDayPlan({
      ...fallbackProfile,
      ...patch,
      lastBlocker: "none",
      lastDifficultyFeedback: feedback,
    });
    assert.ok(tasks.every((task) => task.duration <= 5));
  }
});

test("quick start rejects empty custom goals and unsupported choices", () => {
  for (const args of [
    ["custom", 5, ""],
    ["unknown", 5, "Goal"],
    ["study", 30, ""],
    ["study", -1, ""],
  ])
    assert.throws(() => quickStartProfile(...args));
});
