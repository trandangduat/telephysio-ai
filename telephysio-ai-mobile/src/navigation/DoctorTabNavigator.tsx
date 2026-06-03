/**
 * DoctorTabNavigator — Điều hướng thanh tab phía dưới dành cho vai trò Bác sĩ.
 *
 * <p>Cung cấp giao diện điều hướng bottom-tab cho bác sĩ với các tab chính:
 * <ul>
 *   <li>Dashboard — Tổng quan danh sách bệnh nhân</li>
 *   <li>Assignments — Quản lý các phác đồ bài tập được giao</li>
 * </ul>
 * Tuân theo hệ thống thiết kế Clinical Vitality với màu sắc teal (#0f766e) cho tab đang active.
 * </p>
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { DoctorDashboardScreen } from "../screens/Doctor/DoctorDashboardScreen";
import { DoctorAssignmentsScreen } from "../screens/Doctor/DoctorAssignmentsScreen";
import { colors, typography } from "../theme";
import type { DoctorTabParamList } from "./types";

const Tab = createBottomTabNavigator<DoctorTabParamList>();

/**
 * Bảng ánh xạ tên tab sang tên icon Ionicons tương ứng.
 *
 * <p>Mỗi tab có hai trạng thái icon:
 * <ul>
 *   <li>{@code active} — icon khi tab đang được chọn</li>
 *   <li>{@code inactive} — icon khi tab không được chọn (dạng outline)</li>
 * </ul>
 * </p>
 */
const TAB_ICONS: Record<
keyof DoctorTabParamList,
{ active: string; inactive: string }
> = {
  Dashboard: { active: "grid", inactive: "grid-outline" },
  Assignments: { active: "clipboard", inactive: "clipboard-outline" },
};

/**
 * Component điều hướng bottom-tab dành cho bác sĩ.
 *
 * <p>Hiển thị thanh tab phía dưới màn hình gồm các tab Dashboard và Assignments.
 * Sử dụng hook {@code useTranslation} để hỗ trợ đa ngôn ngữ.
 * Áp dụng style theo hệ thống thiết kế Clinical Vitality:</p>
 * <ul>
 *   <li>Màu active: teal (#0f766e)</li>
 *   <li>Màu inactive: {@code colors.onSurfaceVariant}</li>
 *   <li>Font nhãn: {@code typography.labelSm} (Inter 11px/500)</li>
 * </ul>
 *
 * @return JSX element chứa {@code Tab.Navigator} với các màn hình bác sĩ
 */
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
        options={{ title: t('doctor.assignments.title'), headerShown: false }}
      />
    </Tab.Navigator>
  );
};
