import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E0E0E0",
  },
});

export const AttendanceCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
        <View style={styles.cardHeaderText}>
          <SkeletonLoader width="70%" height={16} />
          <SkeletonLoader width="50%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={styles.cardDetails}>
        <SkeletonLoader width="40%" height={14} style={{ marginTop: 8 }} />
        <SkeletonLoader width="60%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardDetails: {
    marginTop: 12,
  },
});

Object.assign(styles, cardStyles);

export default SkeletonLoader;
