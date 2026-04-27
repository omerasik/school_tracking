import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

interface AnimatedTabViewProps {
  children: React.ReactNode;
}

const AnimatedTabView: React.FC<AnimatedTabViewProps> = ({ children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      // Reset animations when tab becomes focused
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, isFocused, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AnimatedTabView;
