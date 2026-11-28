import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  REQUIRED_METADATA,
  interpretLatestEasBuild,
  interpretSubmissionBuild,
  readScreenshotImageInfo,
  validateMetadataDirectory,
  validateScreenshotManifest,
  validateSubmissionState,
} from "./app-store-submission-gate.mjs";

function pngChunk(type, data) {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  return chunk;
}

function pngImage(width, height, colorType = 2, includeTransparencyChunk = false) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = colorType;
  const chunks = [pngChunk("IHDR", header)];
  if (includeTransparencyChunk) chunks.push(pngChunk("tRNS", Buffer.alloc(6)));
  chunks.push(pngChunk("IEND", Buffer.alloc(0)));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]);
}

function jpegImage(width, height) {
  const frame = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0, 0, 0, 0, 0x03, 0x01, 0x11, 0, 0x02, 0x11, 0, 0x03, 0x11, 0]);
  frame.writeUInt16BE(height, 5);
  frame.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), frame, Buffer.from([0xff, 0xd9])]);
}

function completeState() {
  return {
    buildNumber: "23",
    listing: {
      primaryCategory: "Education",
      secondaryCategory: "Productivity",
      metadataEnteredInAppStoreConnect: true,
      territoriesReviewed: true,
      contentRightsConfirmed: true,
    },
    reviewContact: { firstName: "Review", lastName: "Contact", email: "review@example.com", phone: "+1 555 555 0100" },
    reviewAccount: { configuredInAppStoreConnect: true, instructionsReviewed: true },
    appStoreConnect: {
      privacyCompleted: true,
      ageRatingCompleted: true,
      accessibilityCompleted: true,
      privacyChoicesUrlEntered: true,
      agreementsCurrent: true,
      dsaTraderStatusCompletedOrNotDistributingInEU: true,
    },
    qa: {
      physicalIPhoneCompleted: true,
      upgradeRetentionCompleted: true,
      emailTwoProviderCompleted: true,
      permissionsNotificationsOfflineAccessibilityCompleted: true,
    },
    screenshots: { manifest: "app-store/screenshots/manifest.json" },
  };
}

test("submission state fails closed until every manual gate is confirmed", () => {
  const state = completeState();
  state.qa.physicalIPhoneCompleted = false;
  const problems = validateSubmissionState(state, "23");
  assert.ok(problems.some((problem) => problem.includes("qa.physicalIPhoneCompleted")));
});

test("submission state accepts complete non-secret markers and local review contact", () => {
  assert.deepEqual(validateSubmissionState(completeState(), "23"), []);
});

test("voluntary accessibility labels may be deferred without bypassing device accessibility QA", () => {
  const state = completeState();
  state.appStoreConnect.accessibilityCompleted = false;
  assert.deepEqual(validateSubmissionState(state, "23"), []);
  state.qa.permissionsNotificationsOfflineAccessibilityCompleted = false;
  assert.ok(validateSubmissionState(state, "23").some(problem => problem.includes("qa.permissionsNotificationsOfflineAccessibilityCompleted")));
});

test("metadata limits and HTTPS URLs are enforced", () => {
  const root = mkdtempSync(join(tmpdir(), "rise-metadata-"));
  mkdirSync(root, { recursive: true });
  for (const [name, rules] of Object.entries(REQUIRED_METADATA)) {
    const value = rules.url ? "https://example.com/path" : name === "subtitle.txt" ? "Daily Skill Missions" : "Final release copy";
    writeFileSync(join(root, name), value);
  }
  assert.deepEqual(validateMetadataDirectory(root), []);
  writeFileSync(join(root, "subtitle.txt"), "x".repeat(31));
  assert.ok(validateMetadataDirectory(root).some((problem) => problem.includes("30-character")));
});

test("screenshot manifest must match and contain real exact-build images", () => {
  const root = mkdtempSync(join(tmpdir(), "rise-screenshots-"));
  mkdirSync(join(root, "app-store", "screenshots"), { recursive: true });
  const image = join(root, "app-store", "screenshots", "today.png");
  writeFileSync(image, pngImage(1179, 2556));
  const manifest = join(root, "app-store", "screenshots", "manifest.json");
  writeFileSync(manifest, JSON.stringify({ buildNumber: "23", capturedFromExactBuild: true, sets: [{ displaySize: "required size", files: ["app-store/screenshots/today.png"] }] }));
  assert.deepEqual(validateScreenshotManifest(root, "app-store/screenshots/manifest.json", "23"), []);
});

test("screenshot validation rejects transparency and unsupported dimensions", () => {
  const root = mkdtempSync(join(tmpdir(), "rise-screenshot-alpha-"));
  mkdirSync(join(root, "app-store", "screenshots"), { recursive: true });
  writeFileSync(join(root, "app-store", "screenshots", "alpha.png"), pngImage(1179, 2556, 6));
  writeFileSync(join(root, "app-store", "screenshots", "wrong.png"), pngImage(100, 200));
  writeFileSync(join(root, "app-store", "screenshots", "manifest.json"), JSON.stringify({
    buildNumber: "23",
    capturedFromExactBuild: true,
    sets: [{ displaySize: "required size", files: ["app-store/screenshots/alpha.png", "app-store/screenshots/wrong.png"] }],
  }));
  const problems = validateScreenshotManifest(root, "app-store/screenshots/manifest.json", "23");
  assert.ok(problems.some((problem) => problem.includes("alpha channel")));
  assert.ok(problems.some((problem) => problem.includes("100x200")));
});

test("JPEG screenshot dimensions are read without an alpha channel", () => {
  const root = mkdtempSync(join(tmpdir(), "rise-screenshot-jpeg-"));
  const path = join(root, "screen.jpg");
  writeFileSync(path, jpegImage(1206, 2622));
  assert.deepEqual(readScreenshotImageInfo(path), { width: 1206, height: 2622, hasAlpha: false });
});

test("remote EAS inventory prevents reusing a consumed build number", () => {
  const problems = [];
  interpretLatestEasBuild(JSON.stringify([{ appBuildVersion: "23" }]), "23", problems);
  assert.ok(problems.some((problem) => problem.includes("higher than latest")));
  assert.deepEqual(interpretLatestEasBuild(JSON.stringify([{ appBuildVersion: "22" }]), "23", []), { appBuildVersion: "22" });
});

test("empty EAS inventory is treated intentionally as a first build", () => {
  const problems = [];
  assert.deepEqual(interpretLatestEasBuild("[]", "1", problems), { latest: null, isFirstBuild: true });
  assert.deepEqual(problems, []);
});

test("public review accepts the already-built candidate without requiring a newer build", () => {
  const candidate = { appBuildVersion: "24", status: "FINISHED", appIdentifier: "com.riseapp13.riseapp" };
  const problems = [];
  assert.deepEqual(interpretSubmissionBuild(JSON.stringify([candidate]), "24", candidate.appIdentifier, problems), candidate);
  assert.deepEqual(problems, []);
});

test("public review rejects missing, unfinished, or wrong-app binaries", () => {
  for (const builds of [[], [{ appBuildVersion: "24", status: "ERRORED", appIdentifier: "com.riseapp13.riseapp" }], [{ appBuildVersion: "24", status: "FINISHED", appIdentifier: "com.other.app" }]]) {
    const problems = [];
    interpretSubmissionBuild(JSON.stringify(builds), "24", "com.riseapp13.riseapp", problems);
    assert.ok(problems.length > 0);
  }
});

test("public review cannot pass an invalid remote inventory", () => {
  for (const response of ['broken', '{}', 'null']) {
    const problems = [];
    assert.equal(interpretSubmissionBuild(response, "24", "com.riseapp13.riseapp", problems), null);
    assert.ok(problems.length > 0);
  }
});
