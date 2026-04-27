import { createContext } from "react";
import type { AppSettings } from "@/src/core/utils/settings";

export type SettingsContextType = {
  settings: AppSettings;
  updateSoundSetting: (enabled: boolean) => Promise<void>;
  updateVibrationSetting: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
};

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);
