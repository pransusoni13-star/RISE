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
  assert.equal(packageJson.overrides?.["node-forge"], "1.4.2");
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
