import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Text,
} from 'react-native';

const LoadingSpinner = ({
  size = 'medium',
  color = '#3b82f6',
  text = '',
  overlay = false,
  fullScreen = false,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fade in animation
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation for text
    if (text) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          width: 24,
          height: 24,
          borderWidth: 2,
        };
      case 'large':
        return {
          width: 64,
          height: 64,
          borderWidth: 4,
        };
      default:
        return {
          width: 40,
          height: 40,
          borderWidth: 3,
        };
    }
  };

  const spinnerStyle = [
    styles.spinner,
    getSizeStyle(),
    {
      borderTopColor: color,
      borderRightColor: color,
      borderBottomColor: 'transparent',
      borderLeftColor: 'transparent',
      transform: [{ rotate: spin }],
    },
  ];

  const content = (
    <View style={styles.container}>
      <Animated.View
        style={[
          spinnerStyle,
          {
            opacity: fadeValue,
          },
        ]}
      />
      {text && (
        <Animated.Text
          style={[
            styles.text,
            {
              opacity: fadeValue,
              transform: [{ scale: pulseValue }],
            },
          ]}
        >
          {text}
        </Animated.Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <Animated.View
        style={[
          styles.fullScreen,
          {
            opacity: fadeValue,
          },
        ]}
      >
        {content}
      </Animated.View>
    );
  }

  if (overlay) {
    return (
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeValue,
          },
        ]}
      >
        {content}
      </Animated.View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    borderRadius: 50,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingSpinner;