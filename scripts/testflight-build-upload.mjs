import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { interpretLatestEasBuild, loadReleaseEnvironment } from "./app-store-submission-gate.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const execute = process.argv.includes("--execute");
loadReleaseEnvironment(root);

const problems = [];
const app = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8")).expo;
const localBuildNumber = app?.ios?.buildNumber;
if (!/^\d+$/.test(localBuildNumber || "")) {
  problems.push("app.json must contain a numeric iOS buildNumber.");
}

const preflight = spawnSync(process.execPath, [fileURLToPath(new URL("./testflight-preflight.mjs", import.meta.url))], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});
if (preflight.error || preflight.status !== 0) {
  problems.push("TestFlight preflight must pass before building or uploading.");
}

if (/^\d+$/.test(localBuildNumber || "")) {
  const inventoryCommand = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npx";
  const inventoryArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", "npx eas-cli build:list --platform ios --limit 1 --json --non-interactive"]
    : ["eas-cli", "build:list", "--platform", "ios", "--limit", "1", "--json", "--non-interactive"];
  const inventory = spawnSync(inventoryCommand, inventoryArgs, {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    timeout: 120_000,
  });
  if (inventory.error || inventory.status !== 0) {
    problems.push(`Authenticated EAS iOS build inventory is required (${inventory.error?.message || inventory.stderr?.trim() || `exit ${inventory.status}`}).`);
  } else {
    interpretLatestEasBuild(inventory.stdout, localBuildNumber, problems);
  }
}

if (problems.length) {
  process.stderr.write(`TestFlight build/upload blocked by ${problems.length} release gate(s):\n${problems.map((item) => `- ${item}`).join("\n")}\n`);
  process.exit(1);
}

if (!execute) {
  process.stdout.write([
    `TestFlight preflight passed for iOS build ${localBuildNumber}; latest uploaded EAS build is older.`,
    "Dry run only. Re-run `npm run testflight:build-upload -- --execute` to build and upload this binary to TestFlight.",
    "This uploads to TestFlight only. The App Store submission gate runs after exact-build screenshots and device QA are complete.",
  ].join("\n") + "\n");
  process.exit(0);
}

const buildCommand = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npx";
const buildArgs = process.platform === "win32"
  ? ["/d", "/s", "/c", "npx eas-cli build --profile testflight --platform ios --auto-submit-with-profile testflight --non-interactive"]
  : ["eas-cli", "build", "--profile", "testflight", "--platform", "ios", "--auto-submit-with-profile", "testflight", "--non-interactive"];
const build = spawnSync(buildCommand, buildArgs, {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});
if (build.error) throw build.error;
process.exit(build.status ?? 1);
