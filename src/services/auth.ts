import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
const ACCESS_KEY = "RISE_AUTH_ACCESS";
const REFRESH_KEY = "RISE_AUTH_REFRESH";
const USER_KEY = "RISE_AUTH_USER";

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

export type LeaderboardSnapshot = { opted_in: boolean; rank: number | null; participants: number; missions: number };

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
  const timeout = setTimeout(() => controller.abort(), 12_000);
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
    if (error instanceof Error && error.name === "AbortError") throw new Error("RISE could not reach the server. Check your connection and try again.");
    if (error instanceof TypeError) throw new Error("RISE could not connect. Check your internet connection and try again.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshSession(): Promise<AuthResponse | null> {
  const refreshToken = await getStored(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const session = await rawRequest<AuthResponse>("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) });
    await storeSession(session);
    return session;
  } catch {
    await storeSession(null);
    return null;
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

export async function register(input: { email: string; password: string; displayName: string; foundingCode?: string; signupElapsedSeconds?: number; usageAnalyticsOptIn?: boolean }): Promise<RiseUser> {
  const session = await rawRequest<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ email: input.email.trim().toLowerCase(), password: input.password, display_name: input.displayName.trim(), founding_code: input.foundingCode?.trim() || null, signup_elapsed_seconds: input.usageAnalyticsOptIn ? input.signupElapsedSeconds ?? null : null, usage_analytics_opt_in: input.usageAnalyticsOptIn ?? false }) });
  await storeSession(session);
  usageAnalyticsConsent = Boolean(input.usageAnalyticsOptIn);
  usageAnalyticsEnabledAt = usageAnalyticsConsent ? Date.now() : 0;
  return session.user;
}

export async function login(email: string, password: string): Promise<RiseUser> {
  const session = await rawRequest<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
  usageAnalyticsConsent = false;
  usageAnalyticsEnabledAt = 0;
  await storeSession(session);
  void getUsageAnalyticsConsent();
  return session.user;
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
  await authenticatedRequest("/profiles/me", { method: "PUT", body: JSON.stringify({ selected_goals: profile.selectedGoals.slice(0, 2), custom_goal: profile.customGoal.slice(0, 200), weekly_skill: (profile.weeklySkill || "").slice(0, 100), focus_skills: (profile.focusSkills || []).slice(0, 3), commitment: profile.commitment || "Every 7 days", available_time: profile.availableTime || "30 minutes", experience: profile.experience || "" }) });
}

export async function recordProgressEvent(event: { clientEventId: string; eventType: "skill_selected" | "mission_completed" | "quiz_completed" | "reflection_completed" | "app_session"; skillSlug: string; value?: number; minutes?: number; metadata?: Record<string, unknown> }): Promise<void> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return;
  await authenticatedRequest("/progress/events", { method: "POST", body: JSON.stringify({ client_event_id: event.clientEventId, event_type: event.eventType, skill_slug: event.skillSlug.slice(0, 100), value: event.value || 0, minutes: event.minutes || 0, metadata: event.metadata || {} }) });
}

export async function getProgressDashboard(): Promise<ProgressDashboard | null> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return null;
  return authenticatedRequest<ProgressDashboard>("/users/me/dashboard");
}

export async function getCloudDataExport(): Promise<Record<string, unknown> | null> {
  if (!API_URL || !(await getStored(ACCESS_KEY))) return null;
  return authenticatedRequest<Record<string, unknown>>("/users/me/export");
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
