import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Switch } from "react-native";

interface AnimatedSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (value !== undefined) {
      // Bounce animation on change
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [value]);

  const handleToggle = async (newValue: boolean) => {
    // Trigger haptic feedback
    await Haptics.impactAsync(
      newValue
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
    onValueChange(newValue);
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: bounceAnim }],
      }}
    >
      <Switch
        value={value}
        onValueChange={handleToggle}
        disabled={disabled}
        trackColor={{ false: "#767577", true: "#4CAF50" }}
        thumbColor={value ? "#fff" : "#f4f3f4"}
      />
    </Animated.View>
  );
};

export default AnimatedSwitch;
