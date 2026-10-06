import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteAllRiseData } from "./localData";
import { discardQueuedUsageAnalytics, getPendingSyncCount, listSyncOutbox, queueProfile, queueProgressEvent, removeSyncOutboxItem } from "./syncOutbox";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
const ACCESS_KEY = "RISE_AUTH_ACCESS";
const REFRESH_KEY = "RISE_AUTH_REFRESH";
const USER_KEY = "RISE_AUTH_USER";
const LOCAL_OWNER_KEY = "RISE_LOCAL_OWNER";

export type RiseUser = {
  id: string;
  email: string;
  display_name: string;
  is_founding_member: boolean;
  founding_expires_at: string | null;
};

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: RiseUser;
  verification_email_sent?: boolean;
};

export type RegistrationResult = { user: RiseUser; verificationEmailSent: boolean };

export type CloudProfile = {
  selected_goals: string[];
  custom_goal: string;
  weekly_skill: string;
  focus_skills: string[];
  commitment: string;
  available_time: string;
  experience: string;
};

export type PopularSkill = {
  slug: string;
  name: string;
  category: string;
  description: string;
  default_goal: string;
  popularity_rank: number;
};

export type ProgressDashboard = {
  user: RiseUser;
  skills: { skill_slug: string; baseline_score: number | null; latest_score: number | null; improvement_points: number | null; missions_completed: number; minutes_logged: number }[];
  total_missions: number;
  total_minutes: number;
};

export type LeaderboardSnapshot = { opted_in: boolean; rank: number | null; participants: number; missions: number; period: "month"; period_start: string };

let webSession: AuthResponse | null = null;
let usageAnalyticsConsent = false;
let usageAnalyticsEnabledAt = 0;

function isSafeReleaseApiUrl(): boolean {
  try {
    const parsed = new URL(API_URL);
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === "https:" && host !== "localhost" && host !== "127.0.0.1" && !host.endsWith(".local") && !/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(host);
  } catch { return false; }
}

export const isApiConfigured = () => Boolean(API_URL) && (__DEV__ || isSafeReleaseApiUrl());

async function getStored(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    if (!webSession) return null;
    if (key === ACCESS_KEY) return webSession.access_token;
    if (key === REFRESH_KEY) return webSession.refresh_token;
    if (key === USER_KEY) return JSON.stringify(webSession.user);
    return null;
  }
  return SecureStore.getItemAsync(key);
}

async function storeSession(session: AuthResponse | null): Promise<void> {
  if (!session) { usageAnalyticsConsent = false; usageAnalyticsEnabledAt = 0; }
  if (Platform.OS === "web") {
    webSession = session;
    return;
  }
  if (!session) {
    await Promise.all([SecureStore.deleteItemAsync(ACCESS_KEY), SecureStore.deleteItemAsync(REFRESH_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, session.access_token),
    SecureStore.setItemAsync(REFRESH_KEY, session.refresh_token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user)),
  ]);
}

async function claimLocalDataForUser(userId: string): Promise<void> {
  const currentOwner = await AsyncStorage.getItem(LOCAL_OWNER_KEY);
  if (currentOwner && currentOwner !== userId) await deleteAllRiseData();
  await AsyncStorage.setItem(LOCAL_OWNER_KEY, userId);
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body && typeof body.detail === "string") return body.detail;
  return fallback;
}

class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function rawRequest<T>(path: string, init: RequestInit = {}, accessToken?: string | null): Promise<T> {
  if (!isApiConfigured()) throw new Error("RISE account service needs a public HTTPS API for this build.");
  const controller = new AbortController();
  // Free beta hosts can cold-start after inactivity. Give the first request
  // enough time to wake while keeping subsequent failures bounded.
  const timeout = setTimeout(() => controller.abort(), 75_000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers },
      signal: controller.signal,
    });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(errorMessage(body, `Request failed (${response.status})`), response.status);
    return body as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("RISE could not wake the account service. Check your connection and try once more.");
    if (error instanceof TypeError) throw new Error("RISE could not connect. Check your internet connection and try again.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

let pendingRefresh: Promise<AuthResponse | null> | null = null;

async function refreshSession(): Promise<AuthResponse | null> {
  if (pendingRefresh) return pendingRefresh;
  pendingRefresh = performRefresh();
  try { return await pendingRefresh; }
  finally { pendingRefresh = null; }
}

async function performRefresh(): Promise<AuthResponse | null> {
  const refreshToken = await getStored(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const session = await rawRequest<AuthResponse>("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) });
    await storeSession(session);
    return session;
  } catch (error) {
    // Temporary network failures must not erase a recoverable session.
    if (error instanceof ApiError && error.status === 401) {
      await storeSession(null);
      return null;
    }
    throw error;
  }
}

async function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let accessToken = await getStored(ACCESS_KEY);
  if (!accessToken) throw new Error("Sign in to sync your RISE progress.");
  try {
    return await rawRequest<T>(path, init, accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const session = await refreshSession();
    if (!session) throw new ApiError("Your session expired. Sign in again.", 401);
    accessToken = session.access_token;
    return rawRequest<T>(path, init, accessToken);
  }
}

export async function register(input: { email: string; password: string; displayName: string; foundingCode?: string; signupElapsedSeconds?: number; usageAnalyticsOptIn?: boolean }): Promise<RegistrationResult> {
  const session = await rawRequest<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ email: input.email.trim().toLowerCase(), password: input.password, display_name: input.displayName.trim(), founding_code: input.foundingCode?.trim() || null, signup_elapsed_seconds: input.usageAnalyticsOptIn ? input.signupElapsedSeconds ?? null : null, usage_analytics_opt_in: input.usageAnalyticsOptIn ?? false }) });
  await claimLocalDataForUser(session.user.id);
  await storeSession(session);
  usageAnalyticsConsent = Boolean(input.usageAnalyticsOptIn);
  usageAnalyticsEnabledAt = usageAnalyticsConsent ? Date.now() : 0;
  return { user: session.user, verificationEmailSent: session.verification_email_sent === true };
}

export async function login(email: string, password: string): Promise<RiseUser> {
  const session = await rawRequest<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
  usageAnalyticsConsent = false;
  usageAnalyticsEnabledAt = 0;
  await claimLocalDataForUser(session.user.id);
  await storeSession(session);
  void getUsageAnalyticsConsent();
  return session.user;
}

export async function requestPasswordReset(email: string): Promise<string> {
  const result = await rawRequest<{ message: string }>("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase() }) });
  return result.message;
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await rawRequest("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token: token.trim(), new_password: newPassword }) });
}

export async function getEmailVerificationStatus(): Promise<boolean> {
  const result = await authenticatedRequest<{ verified: boolean }>("/users/me/email-verification");
  return result.verified;
}

export async function requestEmailVerification(): Promise<string> {
  const result = await authenticatedRequest<{ message: string }>("/users/me/email-verification", { method: "POST" });
  return result.message;
}

export async function confirmEmailVerification(token: string): Promise<void> {
  await rawRequest("/auth/email-verification/confirm", { method: "POST", body: JSON.stringify({ token: token.trim() }) });
}

export async function getCurrentUser(): Promise<RiseUser | null> {
  const stored = await getStored(USER_KEY);
  if (!stored) return null;
  try {
    const user = await authenticatedRequest<RiseUser>("/users/me");
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    try { return JSON.parse(stored) as RiseUser; } catch { return null; }
  }
}

export async function logout(): Promise<void> {
  const refreshToken = await getStored(REFRESH_KEY);
  if (refreshToken && API_URL) {
    await rawRequest("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }).catch(() => undefined);
  }
  await storeSession(null);
}

export async function deleteCloudAccount(): Promise<void> {
  await authenticatedRequest("/users/me", { method: "DELETE" });
  await storeSession(null);
}

export async function syncUserProfile(profile: { selectedGoals: string[]; customGoal: string; weeklySkill?: string; focusSkills?: string[]; commitment?: string; availableTime?: string; experience?: string }): Promise<void> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return;
  await queueProfile({ selected_goals: profile.selectedGoals.slice(0, 64), custom_goal: profile.customGoal.slice(0, 200), weekly_skill: (profile.weeklySkill || "").slice(0, 100), focus_skills: (profile.focusSkills || []).slice(0, 3), commitment: profile.commitment || "Every 7 days", available_time: profile.availableTime || "30 minutes", experience: (profile.experience || "").slice(0, 160) });
  await flushCloudSyncQueue();
}

export async function getCloudProfile(): Promise<CloudProfile | null> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return null;
  return authenticatedRequest<CloudProfile | null>("/profiles/me");
}

export async function recordProgressEvent(event: { clientEventId: string; eventType: "skill_selected" | "mission_completed" | "quiz_completed" | "reflection_completed" | "app_session"; skillSlug: string; value?: number; minutes?: number; metadata?: Record<string, unknown> }): Promise<void> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return;
  await queueProgressEvent({ client_event_id: event.clientEventId.slice(0, 120), event_type: event.eventType, skill_slug: event.skillSlug.slice(0, 100), value: event.value || 0, minutes: event.minutes || 0, metadata: event.metadata || {} });
  await flushCloudSyncQueue();
}

let pendingOutboxFlush: Promise<{ synced: number; pending: number }> | null = null;

export async function flushCloudSyncQueue(): Promise<{ synced: number; pending: number }> {
  if (pendingOutboxFlush) return pendingOutboxFlush;
  pendingOutboxFlush = performOutboxFlush();
  try { return await pendingOutboxFlush; }
  finally { pendingOutboxFlush = null; }
}

async function performOutboxFlush(): Promise<{ synced: number; pending: number }> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return { synced: 0, pending: await getPendingSyncCount() };
  let synced = 0;
  for (const item of await listSyncOutbox()) {
    try {
      if (item.kind === "profile") {
        await authenticatedRequest("/profiles/me", { method: "PUT", body: JSON.stringify(item.payload) });
      } else {
        await authenticatedRequest("/progress/events", { method: "POST", body: JSON.stringify(item.payload) });
      }
      await removeSyncOutboxItem(item.id);
      synced += 1;
    } catch (error) {
      // Invalid or no-longer-authorized analytics events must not block later progress forever.
      if (error instanceof ApiError && item.kind === "event" && item.payload.event_type === "app_session" && [403, 422].includes(error.status)) {
        await removeSyncOutboxItem(item.id);
        continue;
      }
      break;
    }
  }
  return { synced, pending: await getPendingSyncCount() };
}

export { getPendingSyncCount };

export async function getProgressDashboard(): Promise<ProgressDashboard | null> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return null;
  return authenticatedRequest<ProgressDashboard>("/users/me/dashboard");
}

export async function getCloudDataExport(): Promise<Record<string, unknown> | null> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return null;
  return authenticatedRequest<Record<string, unknown>>("/users/me/export");
}

export type FeedbackSubmissionResult = { received: boolean; emailNotified: boolean };

export async function submitProductFeedback(input: { category: "idea" | "bug" | "confusing" | "mission" | "accessibility"; rating: 1 | 2 | 3 | 4 | 5; message: string; appVersion: string }): Promise<FeedbackSubmissionResult> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return { received: false, emailNotified: false };
  const result = await authenticatedRequest<{ received: boolean; email_notified: boolean }>("/feedback", { method: "POST", body: JSON.stringify({ category: input.category, rating: input.rating, message: input.message.slice(0, 1000), app_version: input.appVersion.slice(0, 24) }) });
  return { received: result.received, emailNotified: result.email_notified };
}

export async function getPublicConfig(): Promise<{ founding_redemption_enabled: boolean }> {
  if (!API_URL) return { founding_redemption_enabled: false };
  try { return await rawRequest("/config/public"); } catch { return { founding_redemption_enabled: false }; }
}

export async function claimFoundingMembership(code: string): Promise<RiseUser> {
  const user = await authenticatedRequest<RiseUser>("/users/me/founding-claim", { method: "POST", body: JSON.stringify({ founding_code: code.trim() }) });
  if (Platform.OS === "web" && webSession) webSession = { ...webSession, user };
  else if (Platform.OS !== "web") await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  return user;
}

export async function getLeaderboard(): Promise<LeaderboardSnapshot | null> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return null;
  return authenticatedRequest("/users/me/leaderboard");
}

export async function setLeaderboardOptIn(optIn: boolean): Promise<LeaderboardSnapshot> {
  return authenticatedRequest("/users/me/leaderboard", { method: optIn ? "PUT" : "DELETE" });
}

export const isUsageAnalyticsEnabled = () => usageAnalyticsConsent;
export const getUsageAnalyticsEnabledAt = () => usageAnalyticsEnabledAt;

export async function getUsageAnalyticsConsent(): Promise<boolean> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) { usageAnalyticsConsent = false; return false; }
  try {
    const result = await authenticatedRequest<{ opted_in: boolean }>("/users/me/usage-analytics");
    if (result.opted_in && !usageAnalyticsConsent) usageAnalyticsEnabledAt = Date.now();
    usageAnalyticsConsent = result.opted_in;
    return usageAnalyticsConsent;
  } catch { usageAnalyticsConsent = false; return false; }
}

export async function setUsageAnalyticsConsent(optIn: boolean): Promise<boolean> {
  const result = await authenticatedRequest<{ opted_in: boolean }>("/users/me/usage-analytics", { method: optIn ? "PUT" : "DELETE" });
  if (result.opted_in && !usageAnalyticsConsent) usageAnalyticsEnabledAt = Date.now();
  usageAnalyticsConsent = result.opted_in;
  if (!result.opted_in) await discardQueuedUsageAnalytics();
  return usageAnalyticsConsent;
}

const FALLBACK_SKILLS: PopularSkill[] = [
  { slug: "react-native", name: "React Native", category: "Career", description: "Build useful mobile apps with guided practice.", default_goal: "software-engineer", popularity_rank: 1 },
  { slug: "youtube-storytelling", name: "YouTube Storytelling", category: "Creator", description: "Create stronger hooks, stories, and retention.", default_goal: "youtube", popularity_rank: 2 },
  { slug: "barbering-fades", name: "Barbering Fades", category: "Trade", description: "Practice consultation, blending, and finish quality.", default_goal: "barbering", popularity_rank: 3 },
  { slug: "strength-basics", name: "Strength Basics", category: "Fitness", description: "Build safe form, recovery, and progression.", default_goal: "fitness", popularity_rank: 4 },
  { slug: "graphic-design", name: "Graphic Design", category: "Creative", description: "Learn hierarchy, type, color, layout, and critique.", default_goal: "graphic-design", popularity_rank: 5 },
  { slug: "focus-habits", name: "Focus & Habits", category: "Personal", description: "Create a repeatable system for attention and follow-through.", default_goal: "personal", popularity_rank: 6 },
];

export async function getPopularSkills(): Promise<PopularSkill[]> {
  if (!API_URL) return FALLBACK_SKILLS;
  try { return await rawRequest<PopularSkill[]>("/skills/popular"); } catch { return FALLBACK_SKILLS; }
}
