import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/constants/fonts';
import { parseISO, format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';

interface DateSectionHeaderProps {
  dateKey: string;
}

export function DateSectionHeader({ dateKey }: DateSectionHeaderProps) {
  const theme = useTheme();
  const date = parseISO(dateKey);

  // Get the main label (Today, Yesterday, weekday name, or date)
  const getMainLabel = (): string => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    if (isThisYear(date)) return format(date, 'MMMM d');
    return format(date, 'MMMM d, yyyy');
  };

  // Get the subtitle (weekday for dates, full date for Today/Yesterday)
  const getSubtitle = (): string | null => {
    if (isToday(date) || isYesterday(date)) {
      return format(date, 'EEEE');
    }
    if (isThisWeek(date)) {
      return format(date, 'MMMM d');
    }
    // For older dates, show weekday
    return format(date, 'EEEE');
  };

  const mainLabel = getMainLabel();
  const subtitle = getSubtitle();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
      <View style={styles.labelContainer}>
        <Text style={[styles.mainLabel, { color: theme.colors.text }]}>
          {mainLabel}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.textTertiary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  line: {
    flex: 1,
    height: 1,
  },
  labelContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mainLabel: {
    fontSize: 15,
    fontFamily: fonts.serif.semiBold,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
