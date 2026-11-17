import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "RISE_CONSENT";
const LEGACY_STORAGE_KEY = "RISE_BETA_CONSENT";
export const CURRENT_POLICY_VERSION = "2026-11-16" as const;

export type RiseConsent = {
  age13Plus: true;
  acknowledgedEducationalLimits: true;
  policyVersion: string;
  acceptedAt: string;
};

async function loadConsent(): Promise<RiseConsent | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<RiseConsent>;
    if (value.age13Plus !== true || value.acknowledgedEducationalLimits !== true || typeof value.policyVersion !== "string" || typeof value.acceptedAt !== "string") return null;
    return value as RiseConsent;
  } catch {
    return null;
  }
}

export const consentRepository = {
  load: loadConsent,

  async hasCurrentConsent(): Promise<boolean> {
    const consent = await loadConsent();
    return consent?.policyVersion === CURRENT_POLICY_VERSION;
  },

  async save(): Promise<RiseConsent> {
    const consent: RiseConsent = {
      age13Plus: true,
      acknowledgedEducationalLimits: true,
      policyVersion: CURRENT_POLICY_VERSION,
      acceptedAt: new Date().toISOString(),
    };
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(consent)),
      AsyncStorage.removeItem(LEGACY_STORAGE_KEY),
    ]);
    return consent;
  },
};
