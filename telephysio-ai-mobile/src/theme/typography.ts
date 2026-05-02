/**
 * Clinical Vitality – Typography Scale
 * Manrope for headlines, Inter for body/labels
 */
import { TextStyle } from 'react-native';

export const typography = {
  headlineXl: {
    fontFamily: 'Manrope-Bold',
    fontSize: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 40,
  },
  headlineLg: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 32,
  },
  headlineMd: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
  },
  bodyLg: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
  },
  labelMd: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 0.02 * 12,
  },
  labelSm: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 14,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 16,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const shadows = {
  card: {
    boxShadow: '0px 1px 3px rgba(0,71,141,0.06), 0px 4px 12px rgba(0,71,141,0.06)',
  },
  elevated: {
    boxShadow: '0px 4px 12px rgba(0, 94, 184, 0.08)',
  },
  button: {
    boxShadow: '0px 4px 16px rgba(0, 71, 141, 0.3)',
  },
} as const;
