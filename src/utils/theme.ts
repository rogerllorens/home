export const lightTheme = {
  primary: '#0055AA',
  action: '#FF8800',
  background: '#FFFFFF',
  text: '#333333',
  neutral: '#F5F5F5',
  fontFamily: 'System',
  fontSizes: { sm: 14, md: 16, lg: 20 },
  spacing: { sm: 8, md: 16, lg: 24 },
} as const;

export const darkTheme = {
  primary: '#6699FF',
  action: '#FFAA44',
  background: '#212121',
  text: '#EEEEEE',
  neutral: '#121212',
  fontFamily: 'System',
  fontSizes: { sm: 14, md: 16, lg: 20 },
  spacing: { sm: 8, md: 16, lg: 24 },
} as const;

export const lowLightTheme = {
  primary: '#6699FF',
  action: '#FFAA44',
  background: '#121212',
  text: '#E0E0E0',
  neutral: '#1E1E1E',
  fontFamily: 'System',
  fontSizes: { sm: 14, md: 16, lg: 20 },
  spacing: { sm: 8, md: 16, lg: 24 },
} as const;

export const highContrastTheme = {
  primary: '#0000FF',
  action: '#FFA500',
  background: '#FFFFFF',
  text: '#000000',
  neutral: '#FFFFFF',
  fontFamily: 'System',
  fontSizes: { sm: 14, md: 16, lg: 20 },
  spacing: { sm: 8, md: 16, lg: 24 },
} as const;

export const theme = {
  light: lightTheme,
  dark: darkTheme,
  lowLight: lowLightTheme,
  highContrast: highContrastTheme,
} as const;

export type Theme = typeof theme;

export default theme;
