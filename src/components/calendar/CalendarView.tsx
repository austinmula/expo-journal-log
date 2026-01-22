import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
} from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import { useCalendarData } from '@/hooks/useSearch';
import { MoodType } from '@/types';
import { MonthHeader } from './MonthHeader';
import { DayCell } from './DayCell';

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarViewProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  style?: ViewStyle;
}

export function CalendarView({ selectedDate, onDateSelect, style }: CalendarViewProps) {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get calendar data (dates with entries and moods)
  const { datesWithEntries, moodsByDate, isLoading } = useCalendarData(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Split days into weeks for grid layout
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleTodayPress = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  }, [onDateSelect]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      onDateSelect(date);
    },
    [onDateSelect]
  );

  return (
    <View style={[styles.container, style]}>
      <MonthHeader
        currentDate={currentMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onTodayPress={handleTodayPress}
      />

      {/* Weekday headers */}
      <View style={styles.weekdayHeader}>
        {WEEKDAY_NAMES.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: theme.colors.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((date) => {
              const dayOfMonth = date.getDate();
              const hasEntries = datesWithEntries.has(dayOfMonth);
              const moods = moodsByDate.get(dayOfMonth) || [];
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

              return (
                <DayCell
                  key={date.toISOString()}
                  date={date}
                  currentMonth={currentMonth}
                  isSelected={isSelected}
                  hasEntries={hasEntries}
                  moods={moods}
                  onPress={handleDateSelect}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: theme.colors.borderLight }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
            Has entries
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: theme.colors.primary,
              },
            ]}
          />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Today</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    paddingHorizontal: 8,
  },
  weekRow: {
    flexDirection: 'row',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
    marginTop: 8,
    marginHorizontal: 16,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});
