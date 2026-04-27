import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface AnimatedQRCodeProps {
  value: string;
  size?: number;
  refreshInterval?: number; // in milliseconds
}

const AnimatedQRCode: React.FC<AnimatedQRCodeProps> = ({
  value,
  size = 250,
  refreshInterval = 30000, // 30 seconds default
}) => {
  // Pulse/breathing animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Countdown progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start pulse animation (continuous breathing effect)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  useEffect(() => {
    // Reset and start countdown animation whenever value changes
    progressAnim.setValue(0);

    const countdownAnimation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: refreshInterval,
      useNativeDriver: false,
    });

    countdownAnimation.start();

    return () => countdownAnimation.stop();
  }, [progressAnim, refreshInterval, value]);

  // Animated width for progress bar
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [150, 0],
  });

  return (
    <View style={styles.container}>
      {/* QR Code with pulse animation */}
      <Animated.View
        style={[
          styles.qrWrapper,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <QRCode value={value} size={size} />
      </Animated.View>

      {/* Countdown progress bar below QR code */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[styles.progressBarFill, { width: progressWidth }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  progressContainer: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarBackground: {
    width: 150,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
});

export default AnimatedQRCode;
