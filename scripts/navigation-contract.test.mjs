import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { APP_HEADER_ACTIONS } from "../src/services/appNavigation.ts";
import { TOUR_STEPS } from "../src/services/tourGuide.ts";

const appRoot = join(process.cwd(), "src", "app");

function routeFile(route) {
  const clean = route.replace(/^\//, "");
  return join(appRoot, `${clean}.tsx`);
}

test("every persistent header button points to a real screen", () => {
  assert.deepEqual(APP_HEADER_ACTIONS.map((action) => action.label), ["Tour", "Plan", "Settings"]);
  for (const action of APP_HEADER_ACTIONS) {
    assert.equal(existsSync(routeFile(action.route)), true, `${action.label} route is missing: ${action.route}`);
  }
});

test("member navigation is described as Settings, never Menu", () => {
  const tourSource = readFileSync(join(appRoot, "tour.tsx"), "utf8");
  assert.match(tourSource, /Tour, Plan, and Settings stay at the top of every member screen\./);
  assert.doesNotMatch(tourSource, /always in Menu/i);
});

test("the tour explains the complete RISE loop in five concise steps", () => {
  assert.equal(TOUR_STEPS.length, 5);
  assert.deepEqual(
    TOUR_STEPS.map((step) => step.destination),
    ["Today tab", "Learn tab", "Proof screen", "Progress tab", "Settings screen"],
  );
  for (const step of TOUR_STEPS) {
    assert.ok(step.description.length < 90, `${step.title} is too wordy`);
    assert.equal(step.previewRows.length, 3);
    assert.equal(existsSync(routeFile(step.destinationRoute)), true, `Tour destination is missing: ${step.destinationRoute}`);
  }
});

test("the plan keeps future missions locked behind time and completion", () => {
  const planSource = readFileSync(join(appRoot, "plan.tsx"), "utf8");
  assert.match(planSource, /isMissionAvailable\(mission\.day/);
  assert.match(planSource, /disabled=\{!available\}/);
  assert.match(planSource, /Finish today before tomorrow opens\./);
  assert.match(planSource, /Your one mission for today/);
});

