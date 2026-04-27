
import { Audio } from "expo-av";
import { useRef } from "react";
import useSettings from "./useSettings";

export const useSoundEffects = () => {
  const { settings } = useSettings();


  // Local asset paths
  const clickSound = require("../../../../assets/sounds/success.mp3"); // Eğer farklı bir click sesi istiyorsanız değiştirin
  const successSound = require("../../../../assets/sounds/success.mp3");
  const errorSound = require("../../../../assets/sounds/error.mp3");

  // Audio refs
  const clickRef = useRef<Audio.Sound | null>(null);
  const successRef = useRef<Audio.Sound | null>(null);
  const errorRef = useRef<Audio.Sound | null>(null);


  const playSound = async (soundRef: React.MutableRefObject<Audio.Sound | null>, source: any) => {
    if (!settings.soundEnabled) return;
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(source);
        soundRef.current = sound;
        await sound.playAsync();
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const playClick = () => playSound(clickRef, clickSound);
  const playSuccess = () => playSound(successRef, successSound);
  const playError = () => playSound(errorRef, errorSound);


  return {
    playClick,
    playSuccess,
    playError,
  };
};
