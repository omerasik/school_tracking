import { useState, useEffect, type ReactNode } from "react";
import { SettingsContext } from "./SettingsContext";
import {
  loadSettings,
  saveSoundSetting,
  saveVibrationSetting,
  type AppSettings,
} from "@/src/core/utils/settings";

type SettingsProviderProps = {
  children: ReactNode;
};

const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const loadedSettings = await loadSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, []);

  const updateSoundSetting = async (enabled: boolean) => {
    await saveSoundSetting(enabled);
    setSettings((prev) => ({ ...prev, soundEnabled: enabled }));
  };

  const updateVibrationSetting = async (enabled: boolean) => {
    await saveVibrationSetting(enabled);
    setSettings((prev) => ({ ...prev, vibrationEnabled: enabled }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSoundSetting,
        updateVibrationSetting,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
