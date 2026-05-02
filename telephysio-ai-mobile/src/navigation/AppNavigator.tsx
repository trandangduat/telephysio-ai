/**
 * AppNavigator — Root Stack navigator.
 *
 * Structure:
 *   AppNavigator (Stack)
 *   └── BottomTabNavigator (Tabs)
 *       ├── HomeScreen
 *       ├── LibraryScreen
 *       ├── ReportScreen
 *       └── FeedbackScreen
 *   ├── CalibrationScreen    ← from Home "Start Workout"
 *   └── TrainingScreen       ← from Calibration "Start"
 *
 * CalibrationScreen must be visited before TrainingScreen (UC1 flow).
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { BottomTabNavigator } from './BottomTabNavigator';
import { CalibrationScreen } from '../screens/Calibration/CalibrationScreen';
import { TrainingScreen } from '../screens/Training/TrainingScreen';
import { colors, typography } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontFamily: typography.headlineMd.fontFamily,
          fontSize: typography.headlineMd.fontSize,
          fontWeight: typography.headlineMd.fontWeight,
          color: colors.onSurface,
        },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Calibration"
        component={CalibrationScreen}
        options={{ title: t('nav.calibration'), headerShown: false }}
      />
      <Stack.Screen
        name="Training"
        component={TrainingScreen}
        options={{ title: t('nav.training'), headerShown: false }}
      />
    </Stack.Navigator>
  );
};
