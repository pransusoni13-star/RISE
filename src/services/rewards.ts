import AsyncStorage from "@react-native-async-storage/async-storage";
import { progressRepository } from "./progressRepository";

const REDEMPTIONS_KEY = "RISE_REWARD_REDEMPTIONS";

export type CoinReward = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  cost: number;
};

export const COIN_REWARDS: CoinReward[] = [
  {
    id: "reset-break",
    emoji: "☕",
    title: "10-minute reset",
    description: "Redeem a guilt-free break after you submit mission proof.",
    cost: 25,
  },
  {
    id: "mission-choice",
    emoji: "🎯",
    title: "Mission choice",
    description: "Choose any mission in your current cycle as tomorrow's focus.",
    cost: 50,
  },
  {
    id: "builder-title",
    emoji: "🏆",
    title: "1% Builder title",
    description: "Unlock a permanent profile title for proven consistency.",
    cost: 100,
  },
];

export async function loadRedemptions(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(REDEMPTIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function redeemCoinReward(reward: CoinReward) {
  const [progress, redeemed] = await Promise.all([
    progressRepository.load(),
    loadRedemptions(),
  ]);

  if (redeemed.includes(reward.id)) {
    return { ok: false as const, reason: "already" as const, progress, redeemed };
  }
  if (progress.coins < reward.cost) {
    return { ok: false as const, reason: "coins" as const, progress, redeemed };
  }

  const nextProgress = {
    ...progress,
    coins: progress.coins - reward.cost,
    events: [
      ...progress.events,
      {
        id: `reward-${reward.id}-${Date.now()}`,
        type: "milestone" as const,
        amount: 0,
        title: `Reward unlocked: ${reward.title}`,
        timestamp: Date.now(),
        metadata: { coins: -reward.cost, source: `reward:${reward.id}` },
      },
    ],
  };
  const nextRedeemed = [...redeemed, reward.id];

  await Promise.all([
    progressRepository.save(nextProgress),
    AsyncStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(nextRedeemed)),
  ]);

  return { ok: true as const, progress: nextProgress, redeemed: nextRedeemed };
}
