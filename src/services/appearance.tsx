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
    background: "#010807",
    surface: "#071B16",
    surfaceStrong: "#0D2F22",
    border: "#1E3A31",
    text: "#F5FFF9",
    muted: "#9FC3AF",
    accent: "#7AF5B8",
    accentInk: "#010807",
    blueSurface: "#102A3B",
    blueBorder: "#356B86",
  },
  light: {
    mode: "light",
    background: "#F4FAF6",
    surface: "#FFFFFF",
    surfaceStrong: "#E5F6EC",
    border: "#BFD8CA",
    text: "#10231A",
    muted: "#506B5D",
    accent: "#167A4A",
    accentInk: "#FFFFFF",
    blueSurface: "#E8F5FB",
    blueBorder: "#8DBACD",
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
