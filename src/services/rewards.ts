import AsyncStorage from "@react-native-async-storage/async-storage";
import { progressRepository } from "./progressRepository";
import { createSerializedMutationQueue } from "./serializedMutations";

const REDEMPTIONS_KEY = "RISE_REWARD_REDEMPTIONS";
const runRedemption = createSerializedMutationQueue();

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
    description: "A small celebration of your effort. Rest is always free—this badge is just a reminder to take it.",
    cost: 25,
  },
  {
    id: "mission-choice",
    emoji: "🎯",
    title: "Mission Explorer badge",
    description: "A badge for trying new challenges. You can choose your missions at any time, without spending coins.",
    cost: 50,
  },
  {
    id: "builder-title",
    emoji: "🏆",
    title: "1% Builder title",
    description: "A keepsake badge for consistent practice. Your value is bigger than any score or title.",
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
  return runRedemption(async () => {
    const [progress, redeemed] = await Promise.all([
      progressRepository.load(),
      loadRedemptions(),
    ]);

    const eventSource = `reward:${reward.id}`;
    const alreadyRecorded = progress.events.some((event) => event.metadata?.source === eventSource);
    if (redeemed.includes(reward.id) || alreadyRecorded) {
      if (alreadyRecorded && !redeemed.includes(reward.id)) {
        const repaired = [...redeemed, reward.id];
        await AsyncStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(repaired));
        return { ok: false as const, reason: "already" as const, progress, redeemed: repaired };
      }
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
          metadata: { coins: -reward.cost, source: eventSource },
        },
      ],
    };
    const nextRedeemed = [...redeemed, reward.id];

    await Promise.all([
      progressRepository.save(nextProgress),
      AsyncStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(nextRedeemed)),
    ]);

    return { ok: true as const, progress: nextProgress, redeemed: nextRedeemed };
  });
}
