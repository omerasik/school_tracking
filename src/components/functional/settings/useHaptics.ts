import * as Haptics from "expo-haptics";
import useSettings from "./useSettings";

/**
 * Hook to trigger haptic feedback throughout the app
 * Automatically respects the vibration enabled/disabled setting
 */
export const useHaptics = () => {
  const { settings } = useSettings();

  const light = async () => {
    if (!settings.vibrationEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const medium = async () => {
    if (!settings.vibrationEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const heavy = async () => {
    if (!settings.vibrationEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const success = async () => {
    if (!settings.vibrationEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const warning = async () => {
    if (!settings.vibrationEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const error = async () => {
    if (!settings.vibrationEnabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
  };
};
