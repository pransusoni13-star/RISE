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
