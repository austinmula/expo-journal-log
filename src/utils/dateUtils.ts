import { format, formatDistanceToNow, parseISO, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';

export function formatEntryDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM d, yyyy');
}

export function formatEntryTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getSmartDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;

  if (isToday(d)) {
    return `Today at ${format(d, 'h:mm a')}`;
  }

  if (isYesterday(d)) {
    return `Yesterday at ${format(d, 'h:mm a')}`;
  }

  if (isThisWeek(d)) {
    return format(d, "EEEE 'at' h:mm a");
  }

  if (isThisYear(d)) {
    return format(d, "MMM d 'at' h:mm a");
  }

  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export function toISOString(date: Date): string {
  return date.toISOString();
}

export function fromISOString(isoString: string): Date {
  return parseISO(isoString);
}

export function groupEntriesByDate<T extends { createdAt: Date }>(
  entries: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const entry of entries) {
    const dateKey = format(entry.createdAt, 'yyyy-MM-dd');
    const existing = groups.get(dateKey) || [];
    groups.set(dateKey, [...existing, entry]);
  }

  return groups;
}

export function getDateGroupLabel(dateKey: string): string {
  const date = parseISO(dateKey);

  if (isToday(date)) {
    return 'Today';
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  if (isThisWeek(date)) {
    return format(date, 'EEEE');
  }

  if (isThisYear(date)) {
    return format(date, 'MMMM d');
  }

  return format(date, 'MMMM d, yyyy');
}
