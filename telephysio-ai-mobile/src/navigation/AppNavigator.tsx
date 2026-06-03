/**
 * AppNavigator — Bộ điều hướng gốc kết hợp xác thực (Auth) và phân quyền (Role-based).
 *
 * Luồng điều hướng (Flow):
 *   isLoading?        → Màn hình chờ (Splash - ActivityIndicator)
 *   !isAuthenticated? → Điều hướng Xác thực (AuthNavigator: Đăng nhập / Đăng ký)
 *   role=patient      → Điều hướng dành cho Bệnh nhân (PatientNavigator)
 *   role=doctor       → Điều hướng dành cho Bác sĩ (DoctorNavigator)
 */

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { useAuth } from "../contexts/AuthContext";

// Màn hình xác thực
import { LoginScreen } from "../screens/Auth/LoginScreen";
import { SignUpScreen } from "../screens/Auth/SignUpScreen";

// Màn hình bệnh nhân
import { BottomTabNavigator } from "./PatienttabNavigator";
import { CalibrationScreen } from "../screens/Calibration/CalibrationScreen";
import { TrainingScreen } from "../screens/Training/TrainingScreen";
import { ExerciseResultScreen } from "../screens/Training/ExerciseResultScreen";
import { WorkoutSummaryScreen } from "../screens/Training/WorkoutSummaryScreen";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { MyAssignmentsScreen } from "../screens/Workout/MyAssignmentsScreen";
import { WorkoutDetailScreen } from "../screens/Workout/WorkoutDetailScreen";
import { NotificationsScreen } from "../screens/Notifications/NotificationsScreen";

// Màn hình bác sĩ
import { DoctorTabNavigator } from "./DoctorTabNavigator";
import { PatientDetailScreen } from "../screens/Doctor/PatientDetailScreen";
import { TemplateEditorScreen } from "../screens/Doctor/TemplateEditorScreen";
import { AssignTemplateScreen } from "../screens/Doctor/AssignTemplateScreen";
import { DoctorSessionDetailScreen } from "../screens/Doctor/DoctorSessionDetailScreen";

import { colors, typography } from "../theme";
import type {
    AuthStackParamList,
    RootStackParamList,
    DoctorStackParamList,
} from "./types";

// ── Stack Xác thực (Auth) ──────────────────────────
const Auth = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
        <Auth.Screen name="Login" component={LoginScreen} />
        <Auth.Screen name="SignUp" component={SignUpScreen} />
    </Auth.Navigator>
);

// ── Stack Bệnh nhân ───────────────────────────────
const PatientStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Điều hướng dành cho Bệnh nhân.
 * Quản lý các màn hình như Trang chủ, Luyện tập, Hồ sơ cá nhân của bệnh nhân, v.v.
 * 
 * @return React.FC Component chứa Stack Navigator của Bệnh nhân
 */
const PatientNavigator: React.FC = () => {
    const { t } = useTranslation();
    return (
        <PatientStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
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
            <PatientStack.Screen
                name="MainTabs"
                component={BottomTabNavigator}
                options={{ headerShown: false }}
            />
            <PatientStack.Screen
                name="Calibration"
                component={CalibrationScreen}
                options={{ headerShown: false }}
            />
            <PatientStack.Screen
                name="Training"
                component={TrainingScreen}
                options={{ headerShown: false }}
            />
            <PatientStack.Screen
                name="ExerciseResult"
                component={ExerciseResultScreen}
                options={{ headerShown: false }}
            />
            <PatientStack.Screen
                name="WorkoutSummary"
                component={WorkoutSummaryScreen}
                options={{ headerShown: false }}
            />
            <PatientStack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
            <PatientStack.Screen
                name="MyAssignments"
                component={MyAssignmentsScreen}
                options={{ headerShown: false }}
            />
            <PatientStack.Screen
                name="WorkoutDetail"
                component={WorkoutDetailScreen}
                options={{ headerShown: false }}
            />
            <PatientStack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ headerShown: false }}
            />
        </PatientStack.Navigator>
    );
};

// ── Stack Bác sĩ ──────────────────────────────────
const DoctorStack = createNativeStackNavigator<DoctorStackParamList>();

/**
 * Điều hướng dành cho Bác sĩ.
 * Quản lý các màn hình như Quản lý bệnh nhân, Tạo mẫu bài tập (Template), v.v.
 * 
 * @return React.FC Component chứa Stack Navigator của Bác sĩ
 */
const DoctorNavigator: React.FC = () => {
  const { t } = useTranslation();
  return (
    <DoctorStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontFamily: typography.headlineMd.fontFamily,
          fontSize: typography.headlineMd.fontSize,
          fontWeight: typography.headlineMd.fontWeight,
          color: colors.onSurface,
        },
        headerShadowVisible: false,
        headerTintColor: "#0f766e",
      }}
    >
      <DoctorStack.Screen
        name="DoctorTabs"
        component={DoctorTabNavigator}
        options={{ headerShown: false }}
      />
      <DoctorStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ headerShown: false }}
      />
      <DoctorStack.Screen
        name="DoctorProfile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <DoctorStack.Screen
        name="TemplateEditor"
        component={TemplateEditorScreen}
        options={{ headerShown: false }}
      />
      <DoctorStack.Screen
        name="AssignTemplate"
        component={AssignTemplateScreen}
        options={{ headerShown: false }}
      />
      <DoctorStack.Screen
        name="DoctorSessionDetail"
        component={DoctorSessionDetailScreen}
        options={{ headerShown: false }}
      />
      <DoctorStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
    </DoctorStack.Navigator>
  );
};

// ── Gốc: Xác thực → Dựa trên vai trò ──────────────
/**
 * Component gốc xử lý luồng điều hướng dựa trên trạng thái xác thực và phân quyền.
 * Hiển thị màn hình tải (loading) trong lúc chờ kiểm tra xác thực.
 * 
 * @return React.FC Component AppNavigator
 */
export const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading, role, uid } = useAuth();

    // Hiển thị màn hình chờ trong khi kiểm tra trạng thái xác thực Firebase
    if (isLoading) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Chưa đăng nhập → hiển thị Đăng nhập/Đăng ký
    if (!isAuthenticated) {
        return <AuthNavigator />;
    }

    // Đã đăng nhập → hiển thị bộ điều hướng theo vai trò
    return role === "doctor" ? <DoctorNavigator /> : <PatientNavigator />;
};

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
});
