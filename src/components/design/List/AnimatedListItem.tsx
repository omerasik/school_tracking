import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  delay?: number;
}

const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  delay = 50,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, index, slideAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedListItem;
