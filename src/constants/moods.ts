import { MoodType } from '@/types';
import { colors } from './colors';

export interface MoodConfig {
  type: MoodType;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const moods: Record<MoodType, MoodConfig> = {
  great: {
    type: 'great',
    label: 'Great',
    emoji: '😊',
    color: colors.mood.great,
    description: 'Feeling fantastic!',
  },
  good: {
    type: 'good',
    label: 'Good',
    emoji: '🙂',
    color: colors.mood.good,
    description: 'Feeling positive',
  },
  okay: {
    type: 'okay',
    label: 'Okay',
    emoji: '😐',
    color: colors.mood.okay,
    description: 'Feeling neutral',
  },
  bad: {
    type: 'bad',
    label: 'Bad',
    emoji: '😔',
    color: colors.mood.bad,
    description: 'Not feeling great',
  },
  terrible: {
    type: 'terrible',
    label: 'Terrible',
    emoji: '😢',
    color: colors.mood.terrible,
    description: 'Feeling really down',
  },
};

export const moodList: MoodConfig[] = [
  moods.great,
  moods.good,
  moods.okay,
  moods.bad,
  moods.terrible,
];

export function getMoodConfig(mood: MoodType | undefined): MoodConfig | undefined {
  if (!mood) return undefined;
  return moods[mood];
}
