import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "RISE_CONSENT";
const LEGACY_STORAGE_KEY = "RISE_BETA_CONSENT";

export type RiseConsent = {
  age13Plus: true;
  acknowledgedEducationalLimits: true;
  policyVersion: "2026-09-20";
  acceptedAt: string;
};

export const consentRepository = {
  async save(): Promise<RiseConsent> {
    const consent: RiseConsent = {
      age13Plus: true,
      acknowledgedEducationalLimits: true,
      policyVersion: "2026-09-20",
      acceptedAt: new Date().toISOString(),
    };
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(consent)),
      AsyncStorage.removeItem(LEGACY_STORAGE_KEY),
    ]);
    return consent;
  },
};
