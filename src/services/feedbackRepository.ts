import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const STORAGE_KEY = "RISE_PRODUCT_FEEDBACK";

export type ProductFeedback = {
  id: string;
  category: "idea" | "bug" | "confusing" | "mission" | "accessibility";
  rating: 1 | 2 | 3 | 4 | 5;
  message: string;
  createdAt: string;
  appVersion: string;
  deliveryStatus: "pending" | "received" | "emailed";
  lastAttemptAt?: string;
};

async function list(): Promise<ProductFeedback[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export const feedbackRepository = {
  list,
  async add(input: Omit<ProductFeedback, "id" | "createdAt" | "appVersion" | "deliveryStatus" | "lastAttemptAt">) {
    const current = await list();
    const feedback: ProductFeedback = {
      ...input,
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
      appVersion: `${Constants.expoConfig?.version || "unknown"} (${Constants.expoConfig?.ios?.buildNumber || "dev"})`,
      deliveryStatus: "pending",
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([feedback, ...current].slice(0, 25)));
    return feedback;
  },
  async markDelivery(id: string, deliveryStatus: ProductFeedback["deliveryStatus"]) {
    const current = await list();
    const updated = current.map((item) => item.id === id ? { ...item, deliveryStatus, lastAttemptAt: new Date().toISOString() } : item);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated.find((item) => item.id === id) ?? null;
  },
  async updatePending(id: string, input: Pick<ProductFeedback, "category" | "rating" | "message">) {
    const current = await list();
    const updated = current.map((item) => item.id === id && item.deliveryStatus === "pending" ? { ...item, ...input } : item);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated.find((item) => item.id === id) ?? null;
  },
};
