/**
 * BottomTabNavigator — 4 tabs: Home, Workout, Library, Progress.
 *
 * Styling follows Clinical Vitality Design System:
 * - Active: primary (Medical Blue), stroke-based icons
 * - Inactive: onSurfaceVariant
 * - Label: typography.labelSm (Inter 11px/500)
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { HomeScreen } from '../screens/Home/HomeScreen';
import { WorkoutScreen } from '../screens/Workout/WorkoutScreen';
import { FeedbackScreen } from '../screens/Feedback/FeedbackScreen';
import { LibraryScreen } from '../screens/Library/LibraryScreen';
import { ProgressScreen } from '../screens/Progress/ProgressScreen';
import { colors, typography } from '../theme';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<keyof BottomTabParamList, { active: string; inactive: string }> = {
  Home:     { active: 'home',           inactive: 'home-outline' },
  Workout:  { active: 'barbell',        inactive: 'barbell-outline' },
  Sessions: { active: 'checkmark-circle', inactive: 'checkmark-circle-outline' },
  Library:  { active: 'library',        inactive: 'library-outline' },
  Progress: { active: 'trending-up',    inactive: 'trending-up-outline' },
};

export const BottomTabNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest,
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: typography.labelSm.fontFamily,
          fontSize: typography.labelSm.fontSize,
          fontWeight: typography.labelSm.fontWeight,
        },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontFamily: typography.headlineMd.fontFamily,
          fontSize: typography.headlineMd.fontSize,
          fontWeight: typography.headlineMd.fontWeight,
          color: colors.onSurface,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('tabs.home', 'Home'), headerShown: false }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{ title: t('tabs.workout', 'Workout'), headerShown: false }}
      />
      <Tab.Screen
        name="Sessions"
        component={FeedbackScreen}
        options={{ title: t('tabs.sessions', 'Sessions'), headerShown: false }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ title: t('tabs.library', 'Library'), headerShown: false }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: t('tabs.progress', 'Progress'), headerShown: false }}
      />
    </Tab.Navigator>
  );
};
