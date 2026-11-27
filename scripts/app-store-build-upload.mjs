import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadReleaseEnvironment } from "./app-store-submission-gate.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
loadReleaseEnvironment(root);
// Legal and service readiness precede the binary. Exact-build screenshots and
// physical-device QA are checked by appstore:submission:preflight afterwards.
const legal = spawnSync(process.execPath, [fileURLToPath(new URL("./app-store-preflight.mjs", import.meta.url))], { cwd: root, env: process.env, stdio: "inherit" });
if (legal.error) throw legal.error;
if (legal.status !== 0) process.exit(legal.status ?? 1);
const args = [fileURLToPath(new URL("./testflight-build-upload.mjs", import.meta.url))];
if (process.argv.includes("--execute")) args.push("--execute");
const build = spawnSync(process.execPath, args, { cwd: root, env: process.env, stdio: "inherit" });
if (build.error) throw build.error;
process.exit(build.status ?? 1);
