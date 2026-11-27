import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, isAbsolute, join, normalize, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const REQUIRED_METADATA = {
  "name.txt": { max: 30 },
  "subtitle.txt": { max: 30 },
  "promotional_text.txt": { max: 170 },
  "description.txt": { max: 4000 },
  "keywords.txt": { max: 100 },
  "release_notes.txt": { max: 4000 },
  "review_notes.txt": { max: 4000 },
  "support_url.txt": { url: true },
  "marketing_url.txt": { url: true },
  "privacy_url.txt": { url: true },
  "privacy_choices_url.txt": { url: true },
};

const REQUIRED_TRUE_PATHS = [
  "listing.metadataEnteredInAppStoreConnect",
  "listing.territoriesReviewed",
  "listing.contentRightsConfirmed",
  "reviewAccount.configuredInAppStoreConnect",
  "reviewAccount.instructionsReviewed",
  "appStoreConnect.privacyCompleted",
  "appStoreConnect.ageRatingCompleted",
  "appStoreConnect.accessibilityCompleted",
  "appStoreConnect.privacyChoicesUrlEntered",
  "appStoreConnect.agreementsCurrent",
  "appStoreConnect.dsaTraderStatusCompletedOrNotDistributingInEU",
  "qa.physicalIPhoneCompleted",
  "qa.upgradeRetentionCompleted",
  "qa.emailTwoProviderCompleted",
  "qa.permissionsNotificationsOfflineAccessibilityCompleted",
];

const REVIEW_CONTACT_FIELDS = ["firstName", "lastName", "email", "phone"];
const PLACEHOLDER = /^(your|todo|tbd|placeholder|example|unknown|n\/a)$/i;

// Source: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
// Checked 2026-11-18. Keep this list synchronized with Apple's source before
// each release because accepted devices and dimensions can change.
export const APPLE_IPHONE_SCREENSHOT_SIZES = new Set([
  "1398x2034", "2034x1398", "2007x2853", "2853x2007",
  "1260x2736", "2736x1260", "1290x2796", "2796x1290", "1320x2868", "2868x1320",
  "1284x2778", "2778x1284", "1242x2688", "2688x1242",
  "1179x2556", "2556x1179", "1206x2622", "2622x1206",
  "1170x2532", "2532x1170", "1125x2436", "2436x1125", "1080x2340", "2340x1080",
  "1242x2208", "2208x1242", "750x1334", "1334x750",
  "640x1096", "640x1136", "1136x600", "1136x640",
  "640x920", "640x960", "960x600", "960x640",
]);
export const APPLE_REQUIRED_DYNAMIC_ISLAND_MEDIUM_SIZES = new Set([
  "1179x2556", "2556x1179", "1206x2622", "2622x1206",
]);

function getPath(value, dottedPath) {
  return dottedPath.split(".").reduce((current, key) => current?.[key], value);
}

function readJson(path, label, problems) {
  if (!existsSync(path)) {
    problems.push(`${label} is missing at ${path}.`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    problems.push(`${label} is not valid JSON (${error.message}).`);
    return null;
  }
}

function readPngInfo(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature)) throw new Error("invalid PNG signature or header");
  if (buffer.toString("ascii", 12, 16) !== "IHDR" || buffer.readUInt32BE(8) !== 13) throw new Error("PNG is missing a valid IHDR chunk");
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer[25];
  let hasTransparencyChunk = false;
  let hasEndChunk = false;
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > buffer.length) throw new Error("PNG contains a truncated chunk");
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "tRNS") hasTransparencyChunk = true;
    if (type === "IEND") {
      hasEndChunk = true;
      break;
    }
    offset = end;
  }
  if (!hasEndChunk) throw new Error("PNG is missing its IEND chunk");
  return { width, height, hasAlpha: colorType === 4 || colorType === 6 || hasTransparencyChunk };
}

function readJpegInfo(buffer) {
  if (buffer.length < 12 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer.at(-2) !== 0xff || buffer.at(-1) !== 0xd9) {
    throw new Error("invalid JPEG start or end marker");
  }
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  for (let offset = 2; offset + 4 <= buffer.length;) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) throw new Error("JPEG contains a truncated segment");
    if (sofMarkers.has(marker)) {
      if (length < 7) throw new Error("JPEG has an invalid size segment");
      return { width: buffer.readUInt16BE(offset + 5), height: buffer.readUInt16BE(offset + 3), hasAlpha: false };
    }
    offset += length;
  }
  throw new Error("JPEG is missing a supported size segment");
}

export function readScreenshotImageInfo(path) {
  const buffer = readFileSync(path);
  const extension = extname(path).toLowerCase();
  if (extension === ".png") return readPngInfo(buffer);
  if (extension === ".jpg" || extension === ".jpeg") return readJpegInfo(buffer);
  throw new Error("only PNG and JPEG are supported");
}

export function validateMetadataDirectory(metadataDirectory, problems = []) {
  for (const [name, rules] of Object.entries(REQUIRED_METADATA)) {
    const path = join(metadataDirectory, name);
    if (!existsSync(path)) {
      problems.push(`App Store metadata file is missing: ${path}.`);
      continue;
    }
    const value = readFileSync(path, "utf8").trim();
    if (!value || PLACEHOLDER.test(value)) {
      problems.push(`App Store metadata file must contain final copy: ${path}.`);
      continue;
    }
    if (rules.max && [...value].length > rules.max) {
      problems.push(`${name} exceeds Apple's ${rules.max}-character limit.`);
    }
    if (rules.url) {
      try {
        const parsed = new URL(value);
        if (parsed.protocol !== "https:") throw new Error("HTTPS required");
      } catch {
        problems.push(`${name} must contain one public HTTPS URL.`);
      }
    }
  }
  return problems;
}

export function validateSubmissionState(state, localBuildNumber, problems = []) {
  if (!state) return problems;
  if (String(state.buildNumber || "") !== String(localBuildNumber)) {
    problems.push(`submission-state.json must target exact build ${localBuildNumber}.`);
  }
  for (const field of ["primaryCategory", "secondaryCategory"]) {
    const value = state.listing?.[field]?.trim?.() || "";
    if (!value || PLACEHOLDER.test(value)) problems.push(`listing.${field} must be finalized.`);
  }
  for (const field of REVIEW_CONTACT_FIELDS) {
    const value = state.reviewContact?.[field]?.trim?.() || "";
    if (!value || PLACEHOLDER.test(value)) problems.push(`reviewContact.${field} must be stored locally with final App Review contact information.`);
  }
  const email = state.reviewContact?.email?.trim?.() || "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push("reviewContact.email is invalid.");
  const phone = state.reviewContact?.phone?.trim?.() || "";
  if (phone && !/^\+?[0-9 ()-]{7,}$/.test(phone)) problems.push("reviewContact.phone is invalid.");
  for (const path of REQUIRED_TRUE_PATHS) {
    if (getPath(state, path) !== true) problems.push(`${path} must be confirmed true after completing that gate.`);
  }
  const manifest = state.screenshots?.manifest?.trim?.() || "";
  if (!manifest || PLACEHOLDER.test(manifest)) problems.push("screenshots.manifest must point to the exact-build screenshot manifest.");
  return problems;
}

export function validateScreenshotManifest(root, manifestPath, localBuildNumber, problems = []) {
  if (!manifestPath) return problems;
  const absoluteManifest = isAbsolute(manifestPath) ? normalize(manifestPath) : resolve(root, manifestPath);
  const manifest = readJson(absoluteManifest, "Screenshot manifest", problems);
  if (!manifest) return problems;
  if (String(manifest.buildNumber || "") !== String(localBuildNumber)) {
    problems.push(`Screenshot manifest must target exact build ${localBuildNumber}.`);
  }
  if (manifest.capturedFromExactBuild !== true) {
    problems.push("Screenshot manifest must confirm capturedFromExactBuild after exact-build capture.");
  }
  if (!Array.isArray(manifest.sets) || manifest.sets.length === 0) {
    problems.push("Screenshot manifest must include every display-size set required by App Store Connect.");
    return problems;
  }
  let hasRequiredDynamicIslandMediumScreenshot = false;
  for (const [setIndex, set] of manifest.sets.entries()) {
    if (!set?.displaySize?.trim?.()) problems.push(`Screenshot set ${setIndex + 1} needs a displaySize label.`);
    if (!Array.isArray(set?.files) || set.files.length === 0) {
      problems.push(`Screenshot set ${setIndex + 1} must list at least one image.`);
      continue;
    }
    if (set.files.length > 10) problems.push(`Screenshot set ${setIndex + 1} exceeds Apple's 10-image limit.`);
    for (const file of set.files) {
      const absoluteImage = isAbsolute(file) ? normalize(file) : resolve(root, file);
      const extension = extname(absoluteImage).toLowerCase();
      if (!new Set([".png", ".jpg", ".jpeg"]).has(extension)) {
        problems.push(`Screenshot must be PNG or JPEG: ${file}.`);
      } else if (!existsSync(absoluteImage) || statSync(absoluteImage).size === 0) {
        problems.push(`Screenshot file is missing or empty: ${file}.`);
      } else {
        try {
          const info = readScreenshotImageInfo(absoluteImage);
          const size = `${info.width}x${info.height}`;
          if (!APPLE_IPHONE_SCREENSHOT_SIZES.has(size)) problems.push(`Screenshot has a size Apple does not accept for iPhone: ${file} (${size}).`);
          if (APPLE_REQUIRED_DYNAMIC_ISLAND_MEDIUM_SIZES.has(size)) hasRequiredDynamicIslandMediumScreenshot = true;
          if (info.hasAlpha) problems.push(`Screenshot must not contain an alpha channel or transparency: ${file}.`);
        } catch (error) {
          problems.push(`Screenshot cannot be validated: ${file} (${error.message}).`);
        }
      }
    }
  }
  if (!hasRequiredDynamicIslandMediumScreenshot) {
    problems.push("Include at least one current required iPhone Dynamic Island medium screenshot (1179x2556 or 1206x2622, portrait or landscape).");
  }
  return problems;
}

export function interpretLatestEasBuild(stdout, localBuildNumber, problems = []) {
  let builds;
  try {
    builds = JSON.parse(stdout);
  } catch (error) {
    problems.push(`Unable to parse the EAS build inventory (${error.message}).`);
    return null;
  }
  if (!Array.isArray(builds)) {
    problems.push("EAS build inventory must be a JSON array.");
    return null;
  }
  const latest = builds[0] || null;
  if (!latest) return { latest: null, isFirstBuild: true };
  const latestNumber = Number(latest.appBuildVersion);
  if (!Number.isInteger(latestNumber)) {
    problems.push("Latest EAS iOS build has an invalid build number.");
    return latest;
  }
  if (Number(localBuildNumber) <= latestNumber) {
    problems.push(`Local iOS build ${localBuildNumber} must be higher than latest EAS iOS build ${latestNumber}.`);
  }
  return latest;
}

export function loadReleaseEnvironment(root) {
  for (const relative of [".env", ".release.env"]) {
    try {
      const contents = readFileSync(join(root, relative), "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
        if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim();
      }
    } catch {
      // The release gate reports individual missing values below.
    }
  }
}

export function interpretSubmissionBuild(stdout, buildNumber, bundleIdentifier, problems = []) {
  let builds;
  try { builds = JSON.parse(stdout); } catch { problems.push("Unable to parse the EAS submission build inventory."); return null; }
  if (!Array.isArray(builds)) { problems.push("EAS submission build inventory must be a JSON array."); return null; }
  const candidate = builds.find((build) => String(build.appBuildVersion) === String(buildNumber));
  if (!candidate) { problems.push(`Build ${buildNumber} must be built and uploaded to TestFlight before exact-build QA and App Store review.`); return null; }
  if (candidate.status !== "FINISHED") problems.push(`Build ${buildNumber} must finish successfully before App Store review (status: ${candidate.status}).`);
  if (candidate.appIdentifier !== bundleIdentifier) problems.push(`Build ${buildNumber} does not match this app's bundle identifier.`);
  return candidate;
}

export function runSubmissionGate({ root = fileURLToPath(new URL("..", import.meta.url)), checkRemote = true } = {}) {
  loadReleaseEnvironment(root);
  const problems = [];
  const app = readJson(join(root, "app.json"), "app.json", problems)?.expo;
  const localBuildNumber = app?.ios?.buildNumber;
  if (!/^\d+$/.test(localBuildNumber || "")) problems.push("app.json must contain a numeric iOS buildNumber.");

  const automated = spawnSync(process.execPath, [join(root, "scripts", "app-store-preflight.mjs")], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
  });
  if (automated.stdout) process.stdout.write(automated.stdout);
  if (automated.stderr) process.stderr.write(automated.stderr);
  if (automated.status !== 0) problems.push("Automated App Store preflight must pass before public review.");

  validateMetadataDirectory(join(root, "app-store", "metadata", "en-US"), problems);
  const guidePath = join(root, "app-store", "SUBMISSION_GUIDE.md");
  if (!existsSync(guidePath) || readFileSync(guidePath, "utf8").trim().length < 500) {
    problems.push("app-store/SUBMISSION_GUIDE.md must contain the final questionnaire and review guidance.");
  }

  const statePath = join(root, "app-store", "submission-state.json");
  const state = readJson(statePath, "Local App Store submission state (copy submission-state.example.json)", problems);
  validateSubmissionState(state, localBuildNumber, problems);
  if (state) validateScreenshotManifest(root, state.screenshots?.manifest, localBuildNumber, problems);

  if (checkRemote && /^\d+$/.test(localBuildNumber || "")) {
    const inventoryCommand = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npx";
    const inventoryArgs = process.platform === "win32"
      ? ["/d", "/s", "/c", "npx eas-cli build:list --platform ios --limit 10 --json --non-interactive"]
      : ["eas-cli", "build:list", "--platform", "ios", "--limit", "10", "--json", "--non-interactive"];
    const inventory = spawnSync(inventoryCommand, inventoryArgs, {
      cwd: root,
      env: process.env,
      encoding: "utf8",
      timeout: 120_000,
    });
    if (inventory.error || inventory.status !== 0) {
      problems.push(`Authenticated EAS iOS build inventory is required (${inventory.error?.message || inventory.stderr?.trim() || `exit ${inventory.status}`}).`);
    } else {
      interpretSubmissionBuild(inventory.stdout, localBuildNumber, app.ios.bundleIdentifier, problems);
    }
  }

  return { problems, localBuildNumber };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runSubmissionGate();
  if (result.problems.length) {
    process.stderr.write(`App Store submission gate: ${result.problems.length} blocking item(s):\n${result.problems.map((item) => `- ${item}`).join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`App Store submission gate passed for existing iOS build ${result.localBuildNumber}. Select that processed build in App Store Connect for App Review.\n`);
  }
}
