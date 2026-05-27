/**
 * Clinical Vitality — Spacing, Radius & Shadow Tokens
 *
 * base-unit: 4px
 * Elevation: "flat-plus" clinical style
 */

// Spacing — base unit 4px
export const spacing = {
  xs:     4,
  sm:     8,
  md:     16,
  lg:     24,
  xl:     32,
  gutter: 16,   // margin ngang mobile
} as const;

// Border radius
export const radius = {
  sm:   4,     // 0.25rem
  md:   8,     // 0.5rem  — buttons, inputs
  lg:   12,    // 0.75rem
  xl:   16,    // 1rem
  xxl:  24,    // 1.5rem  — large cards, video windows
  full: 9999,  // pill / chip
} as const;

// Elevation — "flat-plus" theo Design System
export const shadows = {
  // Level 1: Cards tiêu chuẩn — border thay shadow
  card: {
    borderWidth: 1,
    borderColor: '#c2c6d4', // outlineVariant
  },
  // Level 2: Active / Floating — soft diffused blue shadow
  floating: {
    shadowColor:   '#005eb8', // primaryContainer
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  12,
    elevation:     4,         // Android
  },
} as const;
