import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

test("the app and API require the same release contract", () => {
  const client = readFileSync(join(root, "src", "services", "auth.ts"), "utf8");
  const server = readFileSync(join(root, "backend", "app", "main.py"), "utf8");
  const clientVersion = client.match(/EXPECTED_API_VERSION = "([^"]+)"/)?.[1];
  const serverVersion = server.match(/API_VERSION = "([^"]+)"/)?.[1];
  assert.ok(clientVersion, "Client API version is missing");
  assert.ok(serverVersion, "Server API version is missing");
  assert.equal(clientVersion, serverVersion);
});

test("the safely patchable node-forge advisory stays overridden", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(packageJson.overrides?.["node-forge"], "1.4.3");
  assert.equal(packageJson.overrides?.["decode-uri-component"], "0.5.1");
  assert.equal(packageJson.overrides?.["@expo/fingerprint"]?.minimatch, "11.0.8");
});

test("public App Store release has an automated legal and service gate", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const appJson = JSON.parse(readFileSync(join(root, "app.json"), "utf8"));
  const preflight = readFileSync(join(root, "scripts", "app-store-preflight.mjs"), "utf8");
  const legal = readFileSync(join(root, "src", "constants", "legal.ts"), "utf8");
  assert.equal(packageJson.scripts?.["appstore:preflight"], "node scripts/app-store-preflight.mjs");
  for (const name of ["EXPO_PUBLIC_OPERATOR_LEGAL_NAME", "EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS", "EXPO_PUBLIC_LAUNCH_JURISDICTION"]) {
    assert.match(preflight, new RegExp(name));
    assert.match(legal, new RegExp(name));
  }
  assert.equal(appJson.expo?.ios?.infoPlist?.NSAppTransportSecurity?.NSAllowsArbitraryLoads, false);
  assert.match(preflight, /NSAllowsArbitraryLoads/);
});

test("installed builds can safely check, download, and apply an OTA update", () => {
  const updateService = readFileSync(join(root, "src", "services", "appUpdates.ts"), "utf8");
  const settings = readFileSync(join(root, "src", "app", "settings.tsx"), "utf8");
  assert.match(updateService, /Updates\.checkForUpdateAsync\(\)/);
  assert.match(updateService, /Updates\.fetchUpdateAsync\(\)/);
  assert.match(updateService, /Updates\.reloadAsync\(\)/);
  assert.match(settings, /Check for updates/);
});

test("settings supports one to three explicit reminder times", () => {
  const reminders = readFileSync(join(root, "src", "services", "reminders.ts"), "utf8");
  const settings = readFileSync(join(root, "src", "app", "settings.tsx"), "utf8");
  assert.match(reminders, /slice\(0, 3\)/);
  assert.match(settings, /setDailyReminders\(enabled, selectedReminderTimes\)/);
  assert.match(settings, /Choose one to three times, then save\./);
});

test("rewards respects appearance and prevents duplicate unlock taps", () => {
  const rewards = readFileSync(join(root, "src", "app", "rewards.tsx"), "utf8");
  assert.match(rewards, /useRiseAppearance\(\)/);
  assert.match(rewards, /redeemingId/);
  assert.match(rewards, /if \(redeemingId\) return/);
  assert.match(rewards, /busy: saving/);
  assert.match(rewards, /Your coins are safe/);
  assert.doesNotMatch(rewards, /backgroundColor:\s*"#010807"/);
});

test("member help and synced progress respect the shared appearance", () => {
  const help = readFileSync(join(root, "src", "app", "help.tsx"), "utf8");
  const progress = readFileSync(join(root, "src", "app", "account-progress.tsx"), "utf8");
  for (const source of [help, progress]) {
    assert.match(source, /useRiseAppearance\(\)/);
    assert.match(source, /theme\.background/);
    assert.match(source, /theme\.text/);
  }
  assert.doesNotMatch(help, /accessibilityLabel="Go back"/);
  assert.doesNotMatch(progress, /accessibilityLabel="Go back"/);
});
