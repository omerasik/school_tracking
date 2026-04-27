import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

interface AnimatedStatusBadgeProps {
  status: "present" | "absent" | "upcoming";
  label: string;
}

const AnimatedStatusBadge: React.FC<AnimatedStatusBadgeProps> = ({
  status,
  label,
}) => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate color transition
    Animated.timing(colorAnim, {
      toValue: status === "present" ? 1 : status === "absent" ? 2 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Pulse animation on change
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [status]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["#FFA500", "#4CAF50", "#F44336"], // upcoming, present, absent
  });

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["#FFFFFF", "#FFFFFF", "#FFFFFF"],
  });

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.Text style={[styles.badgeText, { color: textColor }]}>
        {label}
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default AnimatedStatusBadge;
