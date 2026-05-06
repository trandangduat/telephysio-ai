/**
 * DoctorTabNavigator — Bottom tabs for Doctor role.
 *
 * Tabs:
 *   - Dashboard (overview)
 *   - Assignments (exercise protocols)
 *   - Chat/Feedback (patient messages)
 *   - Patients (progress tracking)
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { DoctorDashboardScreen } from "../screens/Doctor/DoctorDashboardScreen";
import { DoctorAssignmentsScreen } from "../screens/Doctor/DoctorAssignmentsScreen";
import { DoctorSessionScreen } from "../screens/Doctor/DoctorSessionScreen";
import { DoctorPatientsScreen } from "../screens/Doctor/DoctorPatientsScreen";
import { colors, typography } from "../theme";
import type { DoctorTabParamList } from "./types";

const Tab = createBottomTabNavigator<DoctorTabParamList>();

const TAB_ICONS: Record<
  keyof DoctorTabParamList,
  { active: string; inactive: string }
> = {
  Dashboard: { active: "grid", inactive: "grid-outline" },
  Assignments: { active: "clipboard", inactive: "clipboard-outline" },
  DoctorFeedback: { active: "chatbubbles", inactive: "chatbubbles-outline" },
  Patients: { active: "people", inactive: "people-outline" },
};

export const DoctorTabNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#0f766e",
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
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DoctorDashboardScreen}
        options={{ title: "Dashboard", headerShown: false }}
      />
      <Tab.Screen
        name="Assignments"
        component={DoctorAssignmentsScreen}
        options={{ title: "Assignments", headerShown: false }}
      />
      <Tab.Screen
        name="DoctorFeedback"
        component={DoctorSessionScreen}
        options={{ title: "Chat", headerShown: false }}
      />
      <Tab.Screen
        name="Patients"
        component={DoctorPatientsScreen}
        options={{ title: "Patients", headerShown: false }}
      />
    </Tab.Navigator>
  );
};
