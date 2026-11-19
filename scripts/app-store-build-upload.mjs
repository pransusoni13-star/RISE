import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runSubmissionGate } from "./app-store-submission-gate.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const execute = process.argv.includes("--execute");
const result = runSubmissionGate({ root });

if (result.problems.length) {
  process.stderr.write(`Build/upload blocked by ${result.problems.length} release gate(s):\n${result.problems.map((item) => `- ${item}`).join("\n")}\n`);
  process.exit(1);
}

if (!execute) {
  process.stdout.write([
    `All build/upload gates passed for iOS build ${result.localBuildNumber}.`,
    "Dry run only. Re-run `npm run appstore:build-upload -- --execute` when the Account Holder intends to consume this build number and upload it to App Store Connect.",
  ].join("\n") + "\n");
  process.exit(0);
}

const buildCommand = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npx";
const buildArgs = process.platform === "win32"
  ? ["/d", "/s", "/c", "npx eas-cli build --profile testflight --platform ios --auto-submit --non-interactive"]
  : ["eas-cli", "build", "--profile", "testflight", "--platform", "ios", "--auto-submit", "--non-interactive"];
const build = spawnSync(buildCommand, buildArgs, {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});
if (build.error) throw build.error;
process.exit(build.status ?? 1);
