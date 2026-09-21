import { readFileSync } from "node:fs";

const app = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8")).expo;
const eas = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8"));
const problems = [];

if (!/^[A-Za-z][A-Za-z0-9-]*(\.[A-Za-z][A-Za-z0-9-]*){2,}$/.test(app.ios?.bundleIdentifier || "")) {
  problems.push("Set ios.bundleIdentifier in app.json to an identifier you own in Apple Developer.");
}
if (!app.extra?.eas?.projectId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(app.extra.eas.projectId)) {
  problems.push("Link RISE to the correct Expo account with eas init; do not use a project owned by the wrong account.");
}
if (!app.plugins?.some((plugin) => plugin === "expo-notifications" || Array.isArray(plugin) && plugin[0] === "expo-notifications")) {
  problems.push("Add the expo-notifications config plugin before making the iOS build.");
}
if (eas.build?.testflight?.distribution !== "store" || eas.build?.testflight?.environment !== "production") {
  problems.push("The testflight EAS profile must use store distribution and the production environment.");
}

const apiUrl = process.env.EXPO_PUBLIC_API_URL || "";
const checks = [];
try {
  const parsed = new URL(apiUrl);
  const host = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "https:" || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local") || /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    problems.push("EXPO_PUBLIC_API_URL must be a public HTTPS API, not localhost or a private LAN address.");
  } else {
    checks.push({ label: "API health", url: new URL("/health", parsed).href, json: true });
  }
} catch {
  problems.push("Set EXPO_PUBLIC_API_URL to the deployed HTTPS API origin.");
}

for (const name of ["RISE_PRIVACY_POLICY_URL", "RISE_SUPPORT_URL"]) {
  try {
    const parsed = new URL(process.env[name]);
    if (parsed.protocol !== "https:") throw new Error("HTTPS required");
    checks.push({ label: name, url: parsed.href, json: false });
  } catch {
    problems.push(`Set ${name} to a working public HTTPS page and enter it in App Store Connect.`);
  }
}

for (const check of checks) {
  try {
    const response = await fetch(check.url, { signal: AbortSignal.timeout(8000), redirect: "follow" });
    if (!response.ok || new URL(response.url).protocol !== "https:") throw new Error(`HTTP ${response.status} or non-HTTPS redirect`);
    if (check.json) {
      const health = await response.json();
      if (health.status !== "ok") throw new Error("health response is not ok");
    }
  } catch (error) {
    problems.push(`${check.label} must be reachable over HTTPS (${error.message}).`);
  }
}

if (problems.length) {
  process.stderr.write(`TestFlight preflight: ${problems.length} item(s) need attention:\n${problems.map((item) => `- ${item}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("TestFlight configuration checks passed. Still test the iPhone build and App Store Connect metadata manually.\n");
}
