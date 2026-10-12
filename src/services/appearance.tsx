import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type RiseAppearanceMode = "dark" | "light";

export type RiseTheme = {
  mode: RiseAppearanceMode;
  background: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentInk: string;
  blueSurface: string;
  blueBorder: string;
};

const STORAGE_KEY = "RISE_APPEARANCE_MODE";

const themes: Record<RiseAppearanceMode, RiseTheme> = {
  dark: {
    mode: "dark",
    background: "#050806",
    surface: "#0D120F",
    surfaceStrong: "#142019",
    border: "#263129",
    text: "#F8FBF9",
    muted: "#A1ADA6",
    accent: "#56E28A",
    accentInk: "#07110B",
    blueSurface: "#101A15",
    blueBorder: "#315840",
  },
  light: {
    mode: "light",
    background: "#F7F8F4",
    surface: "#FFFFFF",
    surfaceStrong: "#EAF5ED",
    border: "#D7DED8",
    text: "#101511",
    muted: "#626E66",
    accent: "#167D45",
    accentInk: "#FFFFFF",
    blueSurface: "#EEF6F0",
    blueBorder: "#A7C8B2",
  },
};

type AppearanceContextValue = {
  mode: RiseAppearanceMode;
  theme: RiseTheme;
  setMode: (mode: RiseAppearanceMode) => Promise<void>;
  ready: boolean;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function RiseAppearanceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<RiseAppearanceMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (active && (saved === "dark" || saved === "light")) setModeState(saved);
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const value = useMemo<AppearanceContextValue>(() => ({
    mode,
    theme: themes[mode],
    ready,
    setMode: async (nextMode) => {
      setModeState(nextMode);
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    },
  }), [mode, ready]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useRiseAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useRiseAppearance must be used inside RiseAppearanceProvider");
  return value;
}
