import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { isToday, isSameMonth } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import { MoodType } from '@/types';
import { getMoodConfig } from '@/constants/moods';

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  isSelected: boolean;
  hasEntries: boolean;
  moods: MoodType[];
  onPress: (date: Date) => void;
}

function DayCellComponent({
  date,
  currentMonth,
  isSelected,
  hasEntries,
  moods,
  onPress,
}: DayCellProps) {
  const theme = useTheme();

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const dominantMood = moods.length > 0 ? getMostFrequentMood(moods) : null;

  const handlePress = () => {
    if (isCurrentMonth) {
      onPress(date);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!isCurrentMonth}
      style={({ pressed }) => [
        styles.container,
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.dayContainer,
          isSelected && {
            backgroundColor: theme.colors.primary,
          },
          isTodayDate && !isSelected && {
            borderWidth: 2,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.dayNumber,
            {
              color: isSelected
                ? theme.colors.textInverse
                : isCurrentMonth
                  ? theme.colors.text
                  : theme.colors.textTertiary,
              fontWeight: isTodayDate || isSelected ? '700' : '400',
            },
          ]}
        >
          {date.getDate()}
        </Text>
      </View>

      {/* Entry indicator */}
      {hasEntries && isCurrentMonth && (
        <View style={styles.indicators}>
          {dominantMood ? (
            <View
              style={[
                styles.moodDot,
                { backgroundColor: getMoodConfig(dominantMood)?.color || theme.colors.primary },
              ]}
            />
          ) : (
            <View style={[styles.entryDot, { backgroundColor: theme.colors.primary }]} />
          )}
        </View>
      )}
    </Pressable>
  );
}

// Get the most frequent mood from an array of moods
function getMostFrequentMood(moods: MoodType[]): MoodType {
  const frequency: Record<string, number> = {};
  let maxCount = 0;
  let mostFrequent = moods[0];

  for (const mood of moods) {
    frequency[mood] = (frequency[mood] || 0) + 1;
    if (frequency[mood] > maxCount) {
      maxCount = frequency[mood];
      mostFrequent = mood;
    }
  }

  return mostFrequent;
}

export const DayCell = memo(DayCellComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 15,
  },
  indicators: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    gap: 2,
  },
  entryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
