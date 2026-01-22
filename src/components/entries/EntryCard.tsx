import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Badge } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { JournalEntry } from '@/types';
import { getSmartDate, getPreview } from '@/utils';
import { getMoodConfig } from '@/constants/moods';
import { config } from '@/constants/config';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface EntryCardProps {
  entry: JournalEntry;
  onPress: (entry: JournalEntry) => void;
  index?: number;
}

// Default accent color when no mood is set
const DEFAULT_ACCENT_COLOR = colors.stone[300];

export function EntryCard({ entry, onPress, index = 0 }: EntryCardProps) {
  const theme = useTheme();
  const moodConfig = getMoodConfig(entry.mood);
  const accentColor = moodConfig?.color || DEFAULT_ACCENT_COLOR;

  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Stagger the animation based on index (max 5 items animated)
    const delay = Math.min(index, 5) * 50;

    const timer = setTimeout(() => {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: pressScale.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={() => onPress(entry)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.cardOuter,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
          shadowColor: theme.colors.shadow,
        },
        animatedStyle,
      ]}
    >
      {/* Mood accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Card content */}
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {entry.title || 'Untitled'}
          </Text>
          {moodConfig && (
            <Text style={styles.mood}>{moodConfig.emoji}</Text>
          )}
        </View>

        <Text
          style={[styles.preview, { color: theme.colors.textSecondary }]}
          numberOfLines={2}
        >
          {getPreview(entry.content, config.previewMaxLength)}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
            {getSmartDate(entry.createdAt)}
          </Text>
          {entry.tags.length > 0 && (
            <View style={styles.tags}>
              {entry.tags.slice(0, config.maxTagsOnCard).map((tag) => (
                <Badge
                  key={tag.id}
                  label={tag.name}
                  color={tag.color}
                  size="small"
                />
              ))}
              {entry.tags.length > config.maxTagsOnCard && (
                <Text style={[styles.moreTags, { color: theme.colors.textTertiary }]}>
                  +{entry.tags.length - config.maxTagsOnCard}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.serif.semiBold,
    flex: 1,
    marginRight: 8,
  },
  mood: {
    fontSize: 20,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreTags: {
    fontSize: 12,
    marginLeft: 4,
  },
});
