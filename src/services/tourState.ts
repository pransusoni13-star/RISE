import AsyncStorage from "@react-native-async-storage/async-storage";

const REQUIRED_TOUR_KEY = "RISE_REQUIRED_TOUR_V1";

export async function hasCompletedRequiredTour(): Promise<boolean> {
  return (await AsyncStorage.getItem(REQUIRED_TOUR_KEY)) === "complete";
}

export async function markRequiredTourCompleted(): Promise<void> {
  await AsyncStorage.setItem(REQUIRED_TOUR_KEY, "complete");
}
