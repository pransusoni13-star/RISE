import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "RISE_PRODUCT_FEEDBACK";

export type ProductFeedback = {
  id: string;
  category: "idea" | "bug" | "confusing" | "mission" | "accessibility";
  rating: 1 | 2 | 3 | 4 | 5;
  message: string;
  createdAt: string;
  appVersion: string;
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
  async add(input: Omit<ProductFeedback, "id" | "createdAt" | "appVersion">) {
    const current = await list();
    const feedback: ProductFeedback = {
      ...input,
      id: `feedback-${Date.now()}`,
      createdAt: new Date().toISOString(),
      appVersion: "1.0.0",
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([feedback, ...current].slice(0, 25)));
    return feedback;
  },
};
