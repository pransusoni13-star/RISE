import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createSessionBoundary } from "../src/services/sessionBoundary.ts";
import { createSerializedMutationQueue } from "../src/services/serializedMutations.ts";

function harness({ exportPages = [], failExportPage = null, holdProfileWrites = false } = {}) {
  const local = new Map();
  const secure = new Map();
  const queued = [];
  let finishProfile;
  let profileWriteStarted;
  const profileStarted = new Promise(resolve => {profileWriteStarted=resolve;});
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
    if (path === "/users/me/export") {
      const page = Number(new URL(url).searchParams.get("page"));
      return page === failExportPage
        ? reply({ detail: "Cloud export unavailable" }, 503)
        : reply(exportPages[page]);
    }
    if (path === "/auth/login") return reply(session(JSON.parse(init.body).email.split("@")[0]));
    if (path === "/auth/logout") return reply(null, 204);
    if (path === "/auth/refresh") { refreshStarted(); return refresh; }
    if (path === "/profiles/me") {
      if(holdProfileWrites && init.method === "PUT") {
        profileWriteStarted();
        return new Promise(resolve => {finishProfile=()=>resolve(reply(null));});
      }
      return profileExpired ? reply({ detail: "expired" }, 401) : reply(null);
    }
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
    "./syncOutbox": {
      getPendingSyncCount: async () => queued.length,
      listSyncOutbox: async () => [...queued],
      queueProfile: async (payload,ownerId) => {queued.push({id:'profile:latest',kind:'profile',ownerId,payload});},
      removeSyncOutboxItem: async id => {const i=queued.findIndex(item=>item.id===id);if(i>=0)queued.splice(i,1);},
      discardQueuedUsageAnalytics: async () => undefined,
    },
  };
  const source = ts.transpileModule(readFileSync(new URL("../src/services/auth.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; }, process: { env: { EXPO_PUBLIC_API_URL: "https://api.example.com" } }, __DEV__: false, fetch, URL, AbortController, setTimeout, clearTimeout, console });
  return { auth: exports, local, secure, started, queued, profileStarted, releaseProfile:()=>finishProfile?.(), expire: () => { profileExpired = true; }, release: () => finishRefresh(reply(session("alice"))) };
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

test("the client combines every export page instead of returning only the first", async () => {
  const h = harness({exportPages:[
    {user:{id:'alice'},skills:[{id:'skill-a'}],progress_events:[{id:'event-a'}],product_feedback:[],pagination:{more:true}},
    {skills:[],progress_events:[{id:'event-b'}],product_feedback:[{id:'feedback-b'}],pagination:{more:false}},
  ]});
  await h.auth.login('alice@example.com', 'password');
  const archive = await h.auth.getCloudDataExport();
  assert.equal(archive.user.id, 'alice');
  assert.equal(archive.progress_events.map(event => event.id).join(','), 'event-a,event-b');
  assert.equal(archive.product_feedback[0].id, 'feedback-b');
  assert.equal('pagination' in archive, false);
});

test("a failed later export page rejects the export without returning a partial archive", async () => {
  const h = harness({exportPages:[{skills:[],progress_events:[{id:'event-a'}],product_feedback:[],pagination:{more:true}}],failExportPage:1});
  await h.auth.login('alice@example.com', 'password');
  await assert.rejects(h.auth.getCloudDataExport(), /Cloud export unavailable/);
});

test("profile changes are durably queued without waiting for a slow account service", {timeout:3000}, async () => {
  const h=harness({holdProfileWrites:true});
  await h.auth.login('alice@example.com','password');
  try {
    await h.auth.syncUserProfile({selectedGoals:['music'],customGoal:'Practise piano',availableTime:'10 minutes'});
    await h.profileStarted;
    assert.equal(h.queued.length,1);
    assert.equal(h.queued[0].ownerId,'alice');
    assert.equal(h.queued[0].payload.available_time,'10 minutes');
  } finally {
    h.releaseProfile();
  }
  const flushed=await h.auth.flushCloudSyncQueue();
  assert.equal(flushed.pending,0);
});
