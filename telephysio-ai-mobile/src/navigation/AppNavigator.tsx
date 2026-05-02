/**
 * AppNavigator — Root Stack navigator with role-based routing.
 *
 * Structure:
 *   AppNavigator (Stack)
 *   ├── [Patient role]
 *   │   └── BottomTabNavigator (Tabs)
 *   │       ├── HomeScreen
 *   │       ├── WorkoutScreen
 *   │       ├── FeedbackScreen
 *   │       ├── LibraryScreen
 *   │       └── ProgressScreen
 *   │   ├── CalibrationScreen
 *   │   ├── TrainingScreen
 *   │   ├── DoctorChatScreen
 *   │   └── ProfileScreen
 *   └── [Doctor role]
 *       └── DoctorTabNavigator (Tabs)
 *           ├── DashboardScreen
 *           ├── AssignmentsScreen
 *           ├── DoctorFeedbackScreen
 *           └── PatientsScreen
 *       ├── PatientDetailScreen
 *       ├── DoctorProfileScreen (reuses ProfileScreen)
 *       └── DoctorChatScreen
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';

// Patient
import { BottomTabNavigator } from './BottomTabNavigator';
import { CalibrationScreen } from '../screens/Calibration/CalibrationScreen';
import { TrainingScreen } from '../screens/Training/TrainingScreen';
import { DoctorChatScreen } from '../screens/Feedback/DoctorChatScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';

// Doctor
import { DoctorTabNavigator } from './DoctorTabNavigator';
import { PatientDetailScreen } from '../screens/Doctor/PatientDetailScreen';

import { colors, typography } from '../theme';
import type { RootStackParamList, DoctorStackParamList } from './types';

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
      <PatientStack.Screen name="Calibration" component={CalibrationScreen} options={{ title: t('nav.calibration', 'Chuẩn bị'), headerShown: false }} />
      <PatientStack.Screen name="Training" component={TrainingScreen} options={{ title: t('nav.training', 'Tập luyện'), headerShown: false }} />
      <PatientStack.Screen name="DoctorChat" component={DoctorChatScreen} options={{ title: t('nav.doctorChat', 'Doctor Feedback & Chat'), headerShown: false }} />
      <PatientStack.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile.navTitle', 'Profile & Settings'), headerShown: false }} />
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
    </DoctorStack.Navigator>
  );
};

// ── Root: Role-based ────────────────────────────────
export const AppNavigator: React.FC = () => {
  const { role } = useAuth();
  return role === 'doctor' ? <DoctorNavigator /> : <PatientNavigator />;
};
