import { execFileSync } from "node:child_process";

const temporaryExpo57Allowlist = new Set([
  "@expo/cli",
  "@expo/code-signing-certificates",
  "@expo/metro",
  "@expo/metro-config",
  "@expo/metro-file-map",
  "@react-native/community-cli-plugin",
  "@react-native/metro-config",
  "@react-native/virtualized-lists",
  "braces",
  // Expo Router 57.0.29 pins query-string 7.1.3, which pins the affected
  // decode-uri-component release. The fixed query-string release is a major
  // upgrade outside the SDK 57 compatibility set, so keep the risk visible and
  // time-boxed instead of forcing a router dependency that Expo did not ship.
  "decode-uri-component",
  "expo",
  "expo-router",
  "expo-updates",
  "metro",
  "metro-config",
  "metro-file-map",
  "metro-transform-worker",
  "micromatch",
  "node-forge",
  "query-string",
  "react-native",
  "react-native-reanimated",
  "react-native-worklets",
  // Expo SDK 57's bundled CLI currently pins Zod 3.25.76. The published fix is
  // Zod 4.6.6, which is not a drop-in SDK dependency upgrade. Keep this visible
  // and time-boxed with the rest of the Expo 57 exception instead of forcing an
  // incompatible override into production builds.
  "zod",
]);
const allowlistExpires = new Date("2026-11-15T00:00:00Z");

let report;
try {
  const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm audit --omit=dev --json"]
    : ["audit", "--omit=dev", "--json"];
  report = JSON.parse(execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
} catch (error) {
  const output = error?.stdout?.toString();
  if (!output) throw error;
  report = JSON.parse(output);
}

const vulnerabilities = Object.entries(report.vulnerabilities || {});
const critical = vulnerabilities.filter(([, item]) => item.severity === "critical");
const high = vulnerabilities.filter(([, item]) => item.severity === "high");
const unknownHigh = high.filter(([name]) => !temporaryExpo57Allowlist.has(name));
const allowlistExpired = new Date() >= allowlistExpires;

const summary = report.metadata?.vulnerabilities || {};
process.stdout.write(`Dependency audit: ${summary.critical || 0} critical, ${summary.high || 0} high, ${summary.moderate || 0} moderate.\n`);

if (high.length) {
  process.stdout.write(`Temporary Expo SDK 57 upstream exception: ${high.map(([name]) => name).join(", ")}. Recheck by ${allowlistExpires.toISOString().slice(0, 10)}.\n`);
}

if (critical.length || unknownHigh.length || allowlistExpired && high.length) {
  const reasons = [
    critical.length ? `critical: ${critical.map(([name]) => name).join(", ")}` : "",
    unknownHigh.length ? `unreviewed high: ${unknownHigh.map(([name]) => name).join(", ")}` : "",
    allowlistExpired && high.length ? "the temporary Expo SDK 57 exception expired" : "",
  ].filter(Boolean);
  process.stderr.write(`Security audit failed — ${reasons.join("; ")}.\n`);
  process.exitCode = 1;
}
