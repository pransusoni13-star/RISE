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
  const raw = await AsyncStorage.getItem(REDEMPTIONS_KEY);
  if (raw === null) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(item => typeof item === "string")) {
    throw new Error("Saved rewards could not be read. They have not been replaced.");
  }
  return parsed;
}

export async function redeemCoinReward(requested: CoinReward) {
  const reward = COIN_REWARDS.find(item => item.id === requested.id);
  if (!reward) throw new Error("Choose a reward from the current rewards list.");
  return runRedemption(async () => {
    const redeemed = await loadRedemptions();
    let reason: "already" | "coins" | null = null;
    const progress = await progressRepository.update(current => {
      const eventSource = `reward:${reward.id}`;
      if (redeemed.includes(reward.id) || current.events.some(event => event.metadata?.source === eventSource)) {
        reason = "already";
        return current;
      }
      if (current.coins < reward.cost) {
        reason = "coins";
        return current;
      }
      return {...current, coins:current.coins-reward.cost, events:[...current.events, {
        id:`reward-${reward.id}-${Date.now()}`, type:"milestone", amount:0,
        title:`Reward unlocked: ${reward.title}`, timestamp:Date.now(),
        metadata:{coins:-reward.cost,source:eventSource},
      }]};
    });
    if (reason === "coins") return {ok:false as const, reason:"coins" as const, progress, redeemed};
    const nextRedeemed = redeemed.includes(reward.id) ? redeemed : [...redeemed,reward.id];
    // The durable deduction/event comes first. If this marker write fails,
    // retry repairs the marker from the event without charging a second time.
    if (nextRedeemed !== redeemed) await AsyncStorage.setItem(REDEMPTIONS_KEY,JSON.stringify(nextRedeemed));
    return reason === "already"
      ? {ok:false as const,reason:"already" as const,progress,redeemed:nextRedeemed}
      : {ok:true as const,progress,redeemed:nextRedeemed};
  });
}
