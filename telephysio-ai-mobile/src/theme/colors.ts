/**
 * Clinical Vitality – Design System Color Tokens
 * Based on Material Design 3 color scheme for TelePhysioAI
 */
export const colors = {
  // Primary – Medical Blue
  primary: '#00478d',
  onPrimary: '#ffffff',
  primaryContainer: '#005eb8',
  onPrimaryContainer: '#c8daff',
  primaryFixed: '#d6e3ff',
  primaryFixedDim: '#a9c7ff',
  onPrimaryFixed: '#001b3d',
  onPrimaryFixedVariant: '#00468c',
  inversePrimary: '#a9c7ff',
  surfaceTint: '#005db6',

  // Secondary – Slate
  secondary: '#566067',
  onSecondary: '#ffffff',
  secondaryContainer: '#dae4ed',
  onSecondaryContainer: '#5c666d',
  secondaryFixed: '#dae4ed',
  secondaryFixedDim: '#bec8d0',
  onSecondaryFixed: '#131d23',
  onSecondaryFixedVariant: '#3e484f',

  // Tertiary – Success Green
  tertiary: '#00541e',
  onTertiary: '#ffffff',
  tertiaryContainer: '#006f2b',
  onTertiaryContainer: '#7df38e',
  tertiaryFixed: '#85fb96',
  tertiaryFixedDim: '#69de7c',
  onTertiaryFixed: '#002108',
  onTertiaryFixedVariant: '#00531e',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Surface
  background: '#f5faff',
  onBackground: '#131d23',
  surface: '#f5faff',
  surfaceDim: '#d1dbe4',
  surfaceBright: '#f5faff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#ebf5fd',
  surfaceContainer: '#e5eff8',
  surfaceContainerHigh: '#dfeaf2',
  surfaceContainerHighest: '#dae4ec',
  onSurface: '#131d23',
  onSurfaceVariant: '#424752',
  surfaceVariant: '#dae4ec',

  // Outline
  outline: '#727783',
  outlineVariant: '#c2c6d4',

  // Inverse
  inverseSurface: '#283238',
  inverseOnSurface: '#e8f2fb',

  // Semantic aliases for convenience
  success: '#00541e',
  successLight: '#85fb96',
  warning: '#e65100',
  info: '#005db6',

  // White & Black
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
