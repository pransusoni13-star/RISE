import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "RISE_BETA_CONSENT";

export type BetaConsent = {
  age13Plus: true;
  acknowledgedEducationalLimits: true;
  policyVersion: "beta-2026-09-19";
  acceptedAt: string;
};

export const consentRepository = {
  async save(): Promise<BetaConsent> {
    const consent: BetaConsent = {
      age13Plus: true,
      acknowledgedEducationalLimits: true,
      policyVersion: "beta-2026-09-19",
      acceptedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    return consent;
  },
};
