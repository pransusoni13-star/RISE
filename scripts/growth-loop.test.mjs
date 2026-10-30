import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildRiseInviteMessage, RISE_PUBLIC_BETA_URL } from "../src/services/shareRise.ts";

const root = process.cwd();

test("the invite shares one public link without private progress", () => {
  const message = buildRiseInviteMessage();
  assert.equal((message.match(/https:\/\//g) || []).length, 1);
  assert.match(RISE_PUBLIC_BETA_URL, /^https:\/\//);
  assert.match(message, /free RISE TestFlight beta/i);
  assert.doesNotMatch(message, /proof|coin|quiz score|mission completed|goal:/i);
});

test("referral measurement is consent-gated and removed on analytics opt-out", () => {
  const client = readFileSync(join(root, "src", "app", "settings.tsx"), "utf8");
  const server = readFileSync(join(root, "backend", "app", "main.py"), "utf8");
  assert.match(client, /user && usageAnalyticsOptIn/);
  assert.match(server, /\{"app_session", "invite_shared"\}/);
  assert.match(server, /\["app_session", "signup_completed", "invite_shared"\]/);
});
