const DEFAULT_PUBLIC_BETA_URL = "https://testflight.apple.com/join/gwYy6GNr";

function validPublicBetaUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const RISE_PUBLIC_BETA_URL = validPublicBetaUrl(process.env.EXPO_PUBLIC_TESTFLIGHT_URL) || DEFAULT_PUBLIC_BETA_URL;

export function buildRiseInviteMessage(url = RISE_PUBLIC_BETA_URL): string {
  return `Build one skill at a time with a focused daily mission. Join the free RISE TestFlight beta: ${url}`;
}
