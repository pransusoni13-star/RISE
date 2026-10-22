import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { APP_HEADER_ACTIONS } from "../src/services/appNavigation.ts";
import { TOUR_STEPS } from "../src/services/tourGuide.ts";

const appRoot = join(process.cwd(), "src", "app");

function routeFile(route) {
  const clean = route.replace(/^\//, "");
  return join(appRoot, `${clean}.tsx`);
}

test("every persistent header button points to a real screen", () => {
  assert.deepEqual(APP_HEADER_ACTIONS.map((action) => action.label), ["Menu"]);
  for (const action of APP_HEADER_ACTIONS) {
    assert.equal(existsSync(routeFile(action.route)), true, `${action.label} route is missing: ${action.route}`);
  }
});

test("the tour stays short and every optional destination exists", () => {
  assert.equal(TOUR_STEPS.length, 1);
  for (const step of TOUR_STEPS) {
    assert.ok(step.description.length < 80, `${step.title} is too wordy`);
    assert.equal(step.previewRows.length, 3);
    assert.equal(existsSync(routeFile(step.destinationRoute)), true, `Tour destination is missing: ${step.destinationRoute}`);
  }
});

