/**
 * AppNavigator — Root navigator with Auth → Role-based routing.
 *
 * Flow:
 *   isLoading?  → Splash (ActivityIndicator)
 *   !isAuthenticated? → AuthNavigator (Login / SignUp)
 *   role=patient → PatientNavigator
 *   role=doctor  → DoctorNavigator
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';

// Auth screens
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { SignUpScreen } from '../screens/Auth/SignUpScreen';

// Patient screens
import { BottomTabNavigator } from './BottomTabNavigator';
import { CalibrationScreen } from '../screens/Calibration/CalibrationScreen';
import { TrainingScreen } from '../screens/Training/TrainingScreen';
import { DoctorChatScreen } from '../screens/Feedback/DoctorChatScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';

// Doctor screens
import { DoctorTabNavigator } from './DoctorTabNavigator';
import { PatientDetailScreen } from '../screens/Doctor/PatientDetailScreen';
import { TemplateEditorScreen } from '../screens/Doctor/TemplateEditorScreen';
import { AssignTemplateScreen } from '../screens/Doctor/AssignTemplateScreen';

import { colors, typography } from '../theme';
import type { AuthStackParamList, RootStackParamList, DoctorStackParamList } from './types';

// ── Auth Stack ──────────────────────────────────────
const Auth = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => (
  <Auth.Navigator screenOptions={{ headerShown: false }}>
    <Auth.Screen name="Login" component={LoginScreen} />
    <Auth.Screen name="SignUp" component={SignUpScreen} />
  </Auth.Navigator>
);

// ── Patient Stack ───────────────────────────────────
const PatientStack = createNativeStackNavigator<RootStackParamList>();

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
      <PatientStack.Screen name="MainTabs" component={BottomTabNavigator} options={{ headerShown: false }} />
      <PatientStack.Screen name="Calibration" component={CalibrationScreen} options={{ headerShown: false }} />
      <PatientStack.Screen name="Training" component={TrainingScreen} options={{ headerShown: false }} />
      <PatientStack.Screen name="DoctorChat" component={DoctorChatScreen} options={{ headerShown: false }} />
      <PatientStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </PatientStack.Navigator>
  );
};

// ── Doctor Stack ────────────────────────────────────
const DoctorStack = createNativeStackNavigator<DoctorStackParamList>();

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
        headerTintColor: '#0f766e',
      }}
    >
      <DoctorStack.Screen name="DoctorTabs" component={DoctorTabNavigator} options={{ headerShown: false }} />
      <DoctorStack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ headerShown: false }} />
      <DoctorStack.Screen name="DoctorProfile" component={ProfileScreen} options={{ headerShown: false }} />
      <DoctorStack.Screen name="DoctorChat" component={DoctorChatScreen} options={{ headerShown: false }} />
      <DoctorStack.Screen name="TemplateEditor" component={TemplateEditorScreen} options={{ headerShown: false }} />
      <DoctorStack.Screen name="AssignTemplate" component={AssignTemplateScreen} options={{ headerShown: false }} />
    </DoctorStack.Navigator>
  );
};

// ── Root: Auth → Role-based ─────────────────────────
export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, role, uid } = useAuth();

  // Show splash while checking Firebase Auth state
  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not logged in → show Login/SignUp
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Logged in → show role-based navigator
  return role === 'doctor' ? <DoctorNavigator /> : <PatientNavigator />;
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
