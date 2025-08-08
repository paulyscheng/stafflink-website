import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      />
      {children}
    </View>
  );
};

// Preset skeleton components
export const SkeletonCard = ({ style }) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardHeader}>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <View style={styles.cardHeaderText}>
        <SkeletonLoader width={120} height={16} />
        <SkeletonLoader width={80} height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
    <SkeletonLoader height={100} style={{ marginTop: 12 }} />
    <View style={styles.cardFooter}>
      <SkeletonLoader width={60} height={12} />
      <SkeletonLoader width={60} height={12} />
    </View>
  </View>
);

export const SkeletonList = ({ count = 3, renderItem }) => (
  <View>
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={{ marginBottom: 12 }}>
        {renderItem ? renderItem() : <SkeletonCard />}
      </View>
    ))}
  </View>
);

export const SkeletonText = ({ lines = 3, style }) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        width={index === lines - 1 ? '60%' : '100%'}
        height={14}
        style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  card: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});

export default SkeletonLoader;