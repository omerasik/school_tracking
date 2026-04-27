import { useHaptics } from "../settings/useHaptics";
import { useSoundEffects } from "../settings/useSoundEffects";

/**
 * Combined hook for haptic and sound feedback
 * Provides unified methods for success, error, and warning feedback
 */
export const useFeedback = () => {
  const haptics = useHaptics();
  const sound = useSoundEffects();

  const success = async () => {
    await haptics.success();
    sound.playSuccess();
  };

  const error = async () => {
    await haptics.error();
    sound.playError();
  };

  const warning = async () => {
    await haptics.warning();
  };

  const click = async () => {
    await haptics.light();
    sound.playClick();
  };

  return {
    success,
    error,
    warning,
    click,
  };
};
