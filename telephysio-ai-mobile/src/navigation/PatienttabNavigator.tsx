/**
 * @file PatienttabNavigator.tsx
 * @description Điều hướng thanh tab phía dưới dành cho vai trò Bệnh nhân.
 */


import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { HomeScreen } from "../screens/Home/HomeScreen";
import { WorkoutScreen } from "../screens/Workout/WorkoutScreen";
import { SessionScreen } from "../screens/Session/SessionScreen";
// import { LibraryScreen } from "../screens/Library/LibraryScreen";
import { ProgressScreen } from "../screens/Progress/ProgressScreen";
import { colors, typography } from "../theme";
import type { BottomTabParamList } from "./types";

const Tab = createBottomTabNavigator<BottomTabParamList>();

/**
 * Bảng ánh xạ tên tab sang tên icon Ionicons tương ứng cho bệnh nhân.
 *
 * <p>Mỗi tab có hai trạng thái icon:
 * <ul>
 *   <li>{@code active} — icon đầy/filled khi tab đang được chọn</li>
 *   <li>{@code inactive} — icon outline khi tab không được chọn</li>
 * </ul>
 * </p>
 */
const TAB_ICONS: Record<
keyof BottomTabParamList,
{ active: string; inactive: string }
> = {
    Home: { active: "home", inactive: "home-outline" },
    Workout: { active: "barbell", inactive: "barbell-outline" },
    Sessions: {
        active: "checkmark-circle",
        inactive: "checkmark-circle-outline",
    },
    Library: { active: "library", inactive: "library-outline" },
    Progress: { active: "trending-up", inactive: "trending-up-outline" },
};

/**
 * Component điều hướng bottom-tab dành cho bệnh nhân.
 *
 * <p>Hiển thị thanh tab phía dưới màn hình gồm các tab Workout và Sessions.
 * Sử dụng hook {@code useTranslation} để hỗ trợ đa ngôn ngữ cho nhãn tab.
 * Áp dụng style theo hệ thống thiết kế Clinical Vitality với header không có bóng đổ.</p>
 *
 * <p>Một số tab (Home gốc, Library, Progress) hiện đang bị vô hiệu hóa (commented out)
 * chờ hoàn thiện màn hình tương ứng.</p>
 *
 * @return JSX element chứa {@code Tab.Navigator} với các màn hình bệnh nhân
 */
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
            {/* <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t("tabs.home", "Home"), headerShown: false }}
      /> */}
            <Tab.Screen
                name="Home"
                component={WorkoutScreen}
                options={{ title: t("tabs.workout", "Workout"), headerShown: false }}
            />
            <Tab.Screen
                name="Sessions"
                component={SessionScreen}
                options={{ title: t("tabs.sessions", "Sessions"), headerShown: false }}
            />
            {/* <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ title: t('tabs.library', 'Library'), headerShown: false }}
      /> */}
            {/* <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: t("tabs.progress", "Progress"), headerShown: false }}
      /> */}
        </Tab.Navigator>
    );
};
