const DEFAULT_PUBLIC_RISE_URL = "https://rise-daily-skill-missions.vercel.app";

function validPublicRiseUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const RISE_PUBLIC_URL = validPublicRiseUrl(process.env.EXPO_PUBLIC_SHARE_URL) || DEFAULT_PUBLIC_RISE_URL;

export function buildRiseInviteMessage(url = RISE_PUBLIC_URL): string {
  return `Build one skill at a time with a focused daily mission. Try RISE free: ${url}`;
}
