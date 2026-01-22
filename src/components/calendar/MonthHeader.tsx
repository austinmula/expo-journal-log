import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';

interface MonthHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onTodayPress?: () => void;
}

export function MonthHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onTodayPress,
}: MonthHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.navigation}>
        <Pressable
          onPress={onPreviousMonth}
          style={({ pressed }) => [
            styles.navButton,
            {
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          hitSlop={8}
        >
          <Text style={[styles.navIcon, { color: theme.colors.text }]}>{'<'}</Text>
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {format(currentDate, 'MMMM yyyy')}
          </Text>
        </View>

        <Pressable
          onPress={onNextMonth}
          style={({ pressed }) => [
            styles.navButton,
            {
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          hitSlop={8}
        >
          <Text style={[styles.navIcon, { color: theme.colors.text }]}>{'>'}</Text>
        </Pressable>
      </View>

      {onTodayPress && (
        <Pressable
          onPress={onTodayPress}
          style={({ pressed }) => [
            styles.todayButton,
            {
              backgroundColor: theme.colors.primaryLight,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.todayText, { color: theme.colors.primary }]}>Today</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  todayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 12,
  },
  todayText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
