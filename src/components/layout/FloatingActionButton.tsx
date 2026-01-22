import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function FloatingActionButton({
  icon,
  onPress,
  style,
}: FloatingActionButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Bounce in animation on mount
    scale.value = withDelay(
      300,
      withSpring(1, {
        damping: 12,
        stiffness: 180,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.primary,
          shadowColor: theme.colors.shadow,
        },
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={[styles.icon, { color: theme.colors.textInverse }]}>
        {icon}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 28,
    fontWeight: '400',
  },
});
