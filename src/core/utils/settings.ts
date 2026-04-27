import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SETTINGS_KEYS = {
  SOUND_ENABLED: "settings_sound_enabled",
  VIBRATION_ENABLED: "settings_vibration_enabled",
} as const;

export type AppSettings = {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
};

/**
 * Platform-aware storage: SecureStore on native, localStorage on web
 */
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
};

/**
 * Get a setting value from storage
 */
const getSettingValue = async (key: string): Promise<boolean> => {
  try {
    const value = await storage.getItem(key);
    if (value === null) {
      return key === SETTINGS_KEYS.SOUND_ENABLED
        ? DEFAULT_SETTINGS.soundEnabled
        : DEFAULT_SETTINGS.vibrationEnabled;
    }
    return value === "true";
  } catch {
    return key === SETTINGS_KEYS.SOUND_ENABLED
      ? DEFAULT_SETTINGS.soundEnabled
      : DEFAULT_SETTINGS.vibrationEnabled;
  }
};

/**
 * Set a setting value in storage
 */
const setSettingValue = async (key: string, value: boolean): Promise<void> => {
  try {
    await storage.setItem(key, value.toString());
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
  }
};

/**
 * Load all settings from secure storage
 */
export const loadSettings = async (): Promise<AppSettings> => {
  const [soundEnabled, vibrationEnabled] = await Promise.all([
    getSettingValue(SETTINGS_KEYS.SOUND_ENABLED),
    getSettingValue(SETTINGS_KEYS.VIBRATION_ENABLED),
  ]);

  return {
    soundEnabled,
    vibrationEnabled,
  };
};

/**
 * Save sound setting
 */
export const saveSoundSetting = async (enabled: boolean): Promise<void> => {
  await setSettingValue(SETTINGS_KEYS.SOUND_ENABLED, enabled);
};

/**
 * Save vibration setting
 */
export const saveVibrationSetting = async (enabled: boolean): Promise<void> => {
  await setSettingValue(SETTINGS_KEYS.VIBRATION_ENABLED, enabled);
};

/**
 * Get current sound setting
 */
export const getSoundSetting = async (): Promise<boolean> => {
  return getSettingValue(SETTINGS_KEYS.SOUND_ENABLED);
};

/**
 * Get current vibration setting
 */
export const getVibrationSetting = async (): Promise<boolean> => {
  return getSettingValue(SETTINGS_KEYS.VIBRATION_ENABLED);
};
