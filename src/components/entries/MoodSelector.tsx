import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { MoodType } from '@/types';
import { moodList } from '@/constants/moods';

interface MoodSelectorProps {
  selectedMood?: MoodType;
  onSelectMood: (mood: MoodType | undefined) => void;
  compact?: boolean;
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
        {moodList.map((mood) => {
          const isSelected = selectedMood === mood.type;
          return (
            <Pressable
              key={mood.type}
              style={({ pressed }) => [
                styles.moodButton,
                {
                  backgroundColor: isSelected
                    ? `${mood.color}20`
                    : theme.colors.surface,
                  borderColor: isSelected ? mood.color : theme.colors.border,
                  borderWidth: isSelected ? 2 : 1,
                  opacity: pressed ? 0.7 : 1,
                  transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
                },
              ]}
              onPress={() => handlePress(mood.type)}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
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
            </Pressable>
          );
        })}
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
    minWidth: 60,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
  },
});
