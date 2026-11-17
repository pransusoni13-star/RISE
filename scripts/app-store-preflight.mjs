import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

try {
  const localEnv = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of localEnv.split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim();
  }
} catch {
  // CI and EAS may provide all values through their environment instead.
}

const testflight = spawnSync(process.execPath, [fileURLToPath(new URL("./testflight-preflight.mjs", import.meta.url))], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: process.env,
  stdio: "inherit",
});
const problems = [];
if (testflight.status !== 0) problems.push("Resolve every TestFlight preflight failure first.");

const app = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8")).expo;
if (!/^\d+$/.test(app.ios?.buildNumber || "") || Number(app.ios.buildNumber) <= 22) {
  problems.push("Create a new iOS release candidate with buildNumber higher than the currently uploaded build 22.");
}
if (app.ios?.infoPlist?.NSAppTransportSecurity?.NSAllowsArbitraryLoads !== false) {
  problems.push("Set ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads to false for the production release.");
}

const publicLegalValues = {
  EXPO_PUBLIC_OPERATOR_LEGAL_NAME: process.env.EXPO_PUBLIC_OPERATOR_LEGAL_NAME,
  EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS: process.env.EXPO_PUBLIC_OPERATOR_MAILING_ADDRESS,
  EXPO_PUBLIC_LAUNCH_JURISDICTION: process.env.EXPO_PUBLIC_LAUNCH_JURISDICTION,
};
const placeholder = /^(your|todo|tbd|placeholder|example)/i;
for (const [name, rawValue] of Object.entries(publicLegalValues)) {
  const value = rawValue?.trim() || "";
  if (!value || placeholder.test(value)) problems.push(`Set ${name} to verified public information and add the same value to the EAS production environment.`);
}

if (problems.length) {
  process.stderr.write(`App Store preflight: ${problems.length} blocking item(s):\n${problems.map((item) => `- ${item}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write([
    "Automated App Store preflight passed.",
    "Manual gates still required in App Store Connect: final screenshots, App Privacy answers, age rating, categories, support metadata, review contact, reviewer account/instructions, agreements, and physical-iPhone QA.",
    "Do not submit until every manual gate is complete and the exact processed build has passed upgrade, account, notification, permission, accessibility, offline, and deletion testing.",
  ].join("\n") + "\n");
}
