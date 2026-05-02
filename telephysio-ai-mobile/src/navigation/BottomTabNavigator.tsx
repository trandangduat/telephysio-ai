/**
 * BottomTabNavigator — 4 tabs: Home, Library, Report, Feedback.
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
import { LibraryScreen } from '../screens/Library/LibraryScreen';
import { ReportScreen } from '../screens/Report/ReportScreen';
import { FeedbackScreen } from '../screens/Feedback/FeedbackScreen';
import { colors, typography } from '../theme';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<keyof BottomTabParamList, { active: string; inactive: string }> = {
  Home:     { active: 'home',           inactive: 'home-outline' },
  Library:  { active: 'barbell',        inactive: 'barbell-outline' },
  Report:   { active: 'stats-chart',    inactive: 'stats-chart-outline' },
  Feedback: { active: 'chatbubble',     inactive: 'chatbubble-outline' },
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
        options={{ title: t('tabs.home'), headerShown: false }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ title: t('tabs.library'), headerShown: false }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{ title: t('tabs.report'), headerShown: false }}
      />
      <Tab.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ title: t('tabs.feedback'), headerShown: false }}
      />
    </Tab.Navigator>
  );
};
