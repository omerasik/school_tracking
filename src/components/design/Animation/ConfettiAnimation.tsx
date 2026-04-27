import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

const ConfettiAnimation: React.FC<ConfettiProps> = ({ show, onComplete }) => {
  const confettiPieces = useRef(
    Array.from({ length: 30 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (show) {
      const animations = confettiPieces.map((piece, index) => {
        const randomDuration = 1500 + Math.random() * 1000;
        const randomDelay = Math.random() * 200;

        return Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 100,
            duration: randomDuration,
            delay: randomDelay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotation, {
            toValue: Math.random() > 0.5 ? 360 : -360,
            duration: randomDuration,
            delay: randomDelay,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(piece.scale, {
              toValue: 1.2,
              duration: randomDuration / 2,
              delay: randomDelay,
              useNativeDriver: true,
            }),
            Animated.timing(piece.scale, {
              toValue: 0,
              duration: randomDuration / 2,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      Animated.parallel(animations).start(() => {
        onComplete?.();
      });
    }
  }, [show, confettiPieces, onComplete]);

  if (!show) return null;

  const colors = [
    "#FFD700",
    "#FF6347",
    "#4CAF50",
    "#2196F3",
    "#FF69B4",
    "#FFA500",
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece, index) => {
        const rotation = piece.rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ["0deg", "360deg"],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                left: piece.x,
                backgroundColor: colors[index % colors.length],
                transform: [
                  { translateY: piece.y },
                  { rotate: rotation },
                  { scale: piece.scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default ConfettiAnimation;
