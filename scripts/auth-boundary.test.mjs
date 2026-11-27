import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createSessionBoundary } from "../src/services/sessionBoundary.ts";
import { createSerializedMutationQueue } from "../src/services/serializedMutations.ts";

function harness() {
  const local = new Map();
  const secure = new Map();
  let profileExpired = false;
  let finishRefresh;
  let refreshStarted;
  const started = new Promise(resolve => { refreshStarted = resolve; });
  const refresh = new Promise(resolve => { finishRefresh = resolve; });
  const user = id => ({ id, email: `${id}@example.com`, display_name: id, is_founding_member: false, founding_expires_at: null });
  const session = id => ({ access_token: `access-${id}`, refresh_token: `refresh-${id}`, token_type: "bearer", user: user(id) });
  const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
  const fetch = async (url, init) => {
    const path = new URL(url).pathname;
    if (path === "/auth/login") return reply(session(JSON.parse(init.body).email.split("@")[0]));
    if (path === "/auth/logout") return reply(null, 204);
    if (path === "/auth/refresh") { refreshStarted(); return refresh; }
    if (path === "/profiles/me") return profileExpired ? reply({ detail: "expired" }, 401) : reply(null);
    if (path === "/users/me/usage-analytics") return reply({ opted_in: false });
    if (path === "/users/me") return reply(user("alice"));
    throw new Error(`Unexpected mock request ${path}`);
  };
  const storage = map => ({ getItem: async key => map.get(key) ?? null, setItem: async (key, value) => { map.set(key, value); } });
  const dependencies = {
    "react-native": { Platform: { OS: "ios" } },
    "expo-secure-store": { getItemAsync: async key => secure.get(key) ?? null, setItemAsync: async (key, value) => { secure.set(key, value); }, deleteItemAsync: async key => { secure.delete(key); } },
    "@react-native-async-storage/async-storage": { __esModule: true, default: storage(local) },
    "./sessionBoundary": { createSessionBoundary },
    "./serializedMutations": { createSerializedMutationQueue },
    "./syncOutbox": { getPendingSyncCount: async () => 0, listSyncOutbox: async () => [], discardQueuedUsageAnalytics: async () => undefined },
  };
  const source = ts.transpileModule(readFileSync(new URL("../src/services/auth.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; }, process: { env: { EXPO_PUBLIC_API_URL: "https://api.example.com" } }, __DEV__: false, fetch, URL, AbortController, setTimeout, clearTimeout, console });
  return { auth: exports, local, secure, started, expire: () => { profileExpired = true; }, release: () => finishRefresh(reply(session("alice"))) };
}

test("a refresh response arriving after logout cannot restore credentials", async () => {
  const h = harness();
  await h.auth.login("alice@example.com", "password");
  h.expire();
  const request = h.auth.getCloudProfile();
  await h.started;
  await h.auth.logout();
  h.release();
  await assert.rejects(request, /session changed/);
  assert.equal(h.secure.has("RISE_AUTH_ACCESS"), false);
  assert.equal(h.secure.has("RISE_AUTH_REFRESH"), false);
  assert.equal(await h.auth.isMemberDataLocked(), true);
});

test("sign-out retains but locks private records until the same owner signs in", async () => {
  const h = harness();
  await h.auth.login("alice@example.com", "password");
  h.local.set("RISE_MISSION_RECORDS", "private reflection");
  await h.auth.logout();
  assert.equal(h.local.get("RISE_MISSION_RECORDS"), "private reflection");
  assert.equal(await h.auth.isMemberDataLocked(), true);
  await h.auth.login("alice@example.com", "password");
  assert.equal(await h.auth.isMemberDataLocked(), false);
  assert.equal(h.local.get("RISE_MISSION_RECORDS"), "private reflection");
});

test("a different account cannot silently inherit or erase retained records", async () => {
  const h = harness();
  await h.auth.login("alice@example.com", "password");
  h.local.set("RISE_MISSION_RECORDS", "private reflection");
  await h.auth.logout();
  await assert.rejects(h.auth.login("bob@example.com", "password"), /another account/);
  assert.equal(h.local.get("RISE_LOCAL_OWNER"), "alice");
  assert.equal(h.local.get("RISE_MISSION_RECORDS"), "private reflection");
  assert.equal(h.secure.has("RISE_AUTH_USER"), false);
});
