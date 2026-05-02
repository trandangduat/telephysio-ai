/**
 * Navigation — central type definitions & param lists.
 */

export type RootStackParamList = {
  MainTabs: undefined;
  Calibration: undefined;
  Training: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Library: undefined;
  Report: undefined;
  Feedback: undefined;
};

// Screen names as constants to avoid typo
export const SCREENS = {
  MainTabs: 'MainTabs',
  Home: 'Home',
  Calibration: 'Calibration',
  Training: 'Training',
  Library: 'Library',
  Report: 'Report',
  Feedback: 'Feedback',
} as const;
