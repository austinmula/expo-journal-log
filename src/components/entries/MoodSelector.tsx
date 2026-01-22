import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { MoodType } from '@/types';
import { moodList, getMoodConfig } from '@/constants/moods';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MoodSelectorProps {
  selectedMood?: MoodType;
  onSelectMood: (mood: MoodType | undefined) => void;
  compact?: boolean;
}

interface MoodButtonProps {
  mood: typeof moodList[0];
  isSelected: boolean;
  onPress: () => void;
  compact: boolean;
}

function MoodButton({ mood, isSelected, onPress, compact }: MoodButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Bounce animation when pressed
    scale.value = withSequence(
      withSpring(1.15, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onPress();
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.moodButton,
        {
          backgroundColor: isSelected
            ? `${mood.color}20`
            : theme.colors.surface,
          borderColor: isSelected ? mood.color : theme.colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.Text style={styles.emoji}>{mood.emoji}</Animated.Text>
      {!compact && (
        <Text
          style={[
            styles.moodLabel,
            {
              color: isSelected ? mood.color : theme.colors.textSecondary,
              fontWeight: isSelected ? '600' : '500',
            },
          ]}
        >
          {mood.label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

export function MoodSelector({
  selectedMood,
  onSelectMood,
  compact = false,
}: MoodSelectorProps) {
  const theme = useTheme();

  const handlePress = (mood: MoodType) => {
    if (selectedMood === mood) {
      onSelectMood(undefined);
    } else {
      onSelectMood(mood);
    }
  };

  return (
    <View style={styles.container}>
      {!compact && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          How are you feeling?
        </Text>
      )}
      <View style={styles.moods}>
        {moodList.map((mood) => (
          <MoodButton
            key={mood.type}
            mood={mood}
            isSelected={selectedMood === mood.type}
            onPress={() => handlePress(mood.type)}
            compact={compact}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  moods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 60,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
