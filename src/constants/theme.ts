import { colors } from './colors';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  shadow: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeTypography {
  h1: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700';
    lineHeight: number;
  };
  h2: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700';
    lineHeight: number;
  };
  h3: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700';
    lineHeight: number;
  };
  body: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700';
    lineHeight: number;
  };
  bodySmall: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700';
    lineHeight: number;
  };
  caption: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700';
    lineHeight: number;
  };
  label: {
    fontSize: number;
    fontWeight: '400' | '500' | '600' | '700';
    lineHeight: number;
  };
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  isDark: boolean;
}

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const typography: ThemeTypography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
};

const borderRadius: ThemeBorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const lightTheme: Theme = {
  colors: {
    background: '#FFFDF7',  // Warm paper-like off-white
    surface: '#FFFEFA',     // Slightly warmer white for cards
    surfaceElevated: '#FFFFFF',
    primary: colors.teal[600],
    primaryLight: colors.teal[100],
    primaryDark: colors.teal[700],
    secondary: colors.amber[500],
    secondaryLight: colors.amber[100],
    text: colors.stone[900],
    textSecondary: colors.stone[600],
    textTertiary: colors.stone[400],
    textInverse: '#FFFFFF',
    border: colors.stone[200],
    borderLight: colors.stone[100],
    error: colors.error.main,
    errorLight: colors.error.light,
    success: colors.success.main,
    successLight: colors.success.light,
    warning: colors.warning.main,
    warningLight: colors.warning.light,
    shadow: 'rgba(28, 25, 23, 0.08)',
  },
  spacing,
  typography,
  borderRadius,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    background: colors.stone[900],
    surface: colors.stone[800],
    surfaceElevated: colors.stone[700],
    primary: colors.teal[400],
    primaryLight: colors.teal[900],
    primaryDark: colors.teal[300],
    secondary: colors.amber[400],
    secondaryLight: colors.amber[900],
    text: colors.stone[50],
    textSecondary: colors.stone[400],
    textTertiary: colors.stone[500],
    textInverse: colors.stone[900],
    border: colors.stone[700],
    borderLight: colors.stone[800],
    error: '#F87171',
    errorLight: 'rgba(248, 113, 113, 0.15)',
    success: '#34D399',
    successLight: 'rgba(52, 211, 153, 0.15)',
    warning: '#FBBF24',
    warningLight: 'rgba(251, 191, 36, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  spacing,
  typography,
  borderRadius,
  isDark: true,
};
