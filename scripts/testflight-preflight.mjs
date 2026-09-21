import { readFileSync } from "node:fs";

const app = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8")).expo;
const eas = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8"));
const problems = [];

if (!/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*){2,}$/.test(app.ios?.bundleIdentifier || "")) {
  problems.push("Set ios.bundleIdentifier in app.json to an identifier you own in Apple Developer.");
}
if (eas.build?.testflight?.distribution !== "store" || eas.build?.testflight?.environment !== "production") {
  problems.push("The testflight EAS profile must use store distribution and the production environment.");
}

const apiUrl = process.env.EXPO_PUBLIC_API_URL || "";
try {
  const parsed = new URL(apiUrl);
  const host = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "https:" || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local") || /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    problems.push("EXPO_PUBLIC_API_URL must be a public HTTPS API, not localhost or a private LAN address.");
  }
} catch {
  problems.push("Set EXPO_PUBLIC_API_URL to the deployed HTTPS API origin.");
}

for (const name of ["RISE_PRIVACY_POLICY_URL", "RISE_SUPPORT_URL"]) {
  try {
    if (new URL(process.env[name]).protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    problems.push(`Set ${name} to a working public HTTPS page and enter it in App Store Connect.`);
  }
}

if (problems.length) {
  process.stderr.write(`TestFlight preflight: ${problems.length} item(s) need attention:\n${problems.map((item) => `- ${item}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("TestFlight configuration checks passed. Still test the iPhone build and App Store Connect metadata manually.\n");
}
