// Font family constants for the journal app
// Using Playfair Display (serif) for titles and headers
// System font for body text

export const fonts = {
  // Serif font for titles - gives a classic journal/book feel
  serif: {
    regular: 'PlayfairDisplay_400Regular',
    medium: 'PlayfairDisplay_500Medium',
    semiBold: 'PlayfairDisplay_600SemiBold',
    bold: 'PlayfairDisplay_700Bold',
  },
  // System font for body text (default React Native font)
  sans: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
} as const;

// Typography presets using the fonts
export const typography = {
  // Titles use serif font
  title: {
    fontFamily: fonts.serif.semiBold,
  },
  titleLarge: {
    fontFamily: fonts.serif.bold,
  },
  // Body text uses system font (no fontFamily needed, it's the default)
  body: {},
  bodySmall: {},
  caption: {},
} as const;
