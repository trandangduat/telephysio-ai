import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Services
import { subscribeToAuthState, fetchUserProfile } from './src/services/auth';
import { useAuthStore } from './src/store/authStore';

// Auth Screens
import { LoginScreen } from './src/screens/Auth/LoginScreen';
import { RegisterScreen } from './src/screens/Auth/RegisterScreen';

// Patient Screens
import { HomeScreen } from './src/screens/Home/HomeScreen';
import { ExerciseLibraryScreen } from './src/screens/Library/ExerciseLibraryScreen';
import { CalibrationScreen } from './src/screens/Calibration/CalibrationScreen';
import { SessionScreen } from './src/screens/Session/SessionScreen';
import { ProgressScreen } from './src/screens/Progress/ProgressScreen';
import { FeedbackScreen } from './src/screens/Feedback/FeedbackScreen';

// Doctor Screens
import { DoctorDashboardScreen } from './src/screens/Doctor/DoctorDashboardScreen';
import { PatientDetailScreen } from './src/screens/Doctor/PatientDetailScreen';
import { AssignExerciseScreen } from './src/screens/Doctor/AssignExerciseScreen';
import { DoctorFeedbackScreen } from './src/screens/Doctor/DoctorFeedbackScreen';

// Theme
import { colors, typography } from './src/theme';

const AuthStack = createNativeStackNavigator();
const PatientStack = createNativeStackNavigator();
const DoctorStack = createNativeStackNavigator();
const PatientTab = createBottomTabNavigator();
const DoctorTab = createBottomTabNavigator();

// ─── Auth Navigator ───────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Tab Icon Helper ──────────────────────────────────────────────────────────

const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
);

// ─── Patient Tab Navigator ────────────────────────────────────────────────────

function PatientTabNavigator() {
  return (
    <PatientTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest,
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          boxShadow: '0px -4px 12px rgba(0, 94, 184, 0.08)',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: { ...typography.labelSm, marginTop: 2 },
      }}
    >
      <PatientTab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <PatientTab.Screen
        name="LibraryTab"
        component={LibraryStack}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <PatientTab.Screen
        name="ProgressTab"
        component={ProgressStack}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <PatientTab.Screen
        name="FeedbackTab"
        component={FeedbackStack}
        options={{
          tabBarLabel: 'Feedback',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
    </PatientTab.Navigator>
  );
}

function HomeStack() {
  return (
    <PatientStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceContainerLowest },
        headerTintColor: colors.primary,
        headerTitleStyle: { ...typography.headlineMd, color: colors.onSurface },
        headerShadowVisible: false,
      }}
    >
      <PatientStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'TelePhysioAI', headerShown: false }}
      />
      <PatientStack.Screen
        name="Calibration"
        component={CalibrationScreen}
        options={{ title: 'Camera Setup' }}
      />
      <PatientStack.Screen
        name="Session"
        component={SessionScreen}
        options={{ headerShown: false }}
      />
    </PatientStack.Navigator>
  );
}

function LibraryStack() {
  return (
    <PatientStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceContainerLowest },
        headerTintColor: colors.primary,
        headerTitleStyle: { ...typography.headlineMd, color: colors.onSurface },
        headerShadowVisible: false,
      }}
    >
      <PatientStack.Screen
        name="Library"
        component={ExerciseLibraryScreen}
        options={{ title: 'Exercise Library' }}
      />
      <PatientStack.Screen
        name="Calibration"
        component={CalibrationScreen}
        options={{ title: 'Camera Setup' }}
      />
      <PatientStack.Screen
        name="Session"
        component={SessionScreen}
        options={{ headerShown: false }}
      />
    </PatientStack.Navigator>
  );
}

function ProgressStack() {
  return (
    <PatientStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceContainerLowest },
        headerTintColor: colors.primary,
        headerTitleStyle: { ...typography.headlineMd, color: colors.onSurface },
        headerShadowVisible: false,
      }}
    >
      <PatientStack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: 'Recovery Progress', headerShown: false }}
      />
    </PatientStack.Navigator>
  );
}

function FeedbackStack() {
  return (
    <PatientStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceContainerLowest },
        headerTintColor: colors.primary,
        headerTitleStyle: { ...typography.headlineMd, color: colors.onSurface },
        headerShadowVisible: false,
      }}
    >
      <PatientStack.Screen
        name="FeedbackMain"
        component={FeedbackScreen}
        options={{ title: 'Doctor Feedback' }}
      />
    </PatientStack.Navigator>
  );
}

// ─── Doctor Tab Navigator ─────────────────────────────────────────────────────

function DoctorTabNavigator() {
  return (
    <DoctorTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest,
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          boxShadow: '0px -4px 12px rgba(0, 94, 184, 0.08)',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: { ...typography.labelSm, marginTop: 2 },
      }}
    >
      <DoctorTab.Screen
        name="DoctorHome"
        component={DoctorHomeStack}
        options={{
          tabBarLabel: 'Patients',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
    </DoctorTab.Navigator>
  );
}

function DoctorHomeStack() {
  return (
    <DoctorStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceContainerLowest },
        headerTintColor: colors.primary,
        headerTitleStyle: { ...typography.headlineMd, color: colors.onSurface },
        headerShadowVisible: false,
      }}
    >
      <DoctorStack.Screen
        name="DoctorDashboard"
        component={DoctorDashboardScreen}
        options={{ title: 'TelePhysioAI', headerShown: false }}
      />
      <DoctorStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={({ route }) => ({
          title: (route.params as any)?.patientName ?? 'Patient Details',
        })}
      />
      <DoctorStack.Screen
        name="AssignExercise"
        component={AssignExerciseScreen}
        options={({ route }) => ({
          title: `Assign – ${(route.params as any)?.patientName ?? ''}`,
        })}
      />
      <DoctorStack.Screen
        name="DoctorFeedback"
        component={DoctorFeedbackScreen}
        options={({ route }) => ({
          title: `Feedback – ${(route.params as any)?.patientName ?? ''}`,
        })}
      />
    </DoctorStack.Navigator>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <Text style={loadingStyles.logo}>
        <Text style={{ color: colors.primary }}>TelePhysio</Text>
        <Text style={{ color: colors.tertiary }}>AI</Text>
      </Text>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 32 }} />
      <Text style={loadingStyles.loadingText}>Starting up...</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 8,
  },
});

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const { user, isInitialized, setUser, setInitialized } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchUserProfile(firebaseUser.uid);
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setInitialized();
    });
    return unsubscribe;
  }, []);

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        {!user ? (
          <AuthNavigator />
        ) : user.role === 'doctor' ? (
          <DoctorTabNavigator />
        ) : (
          <PatientTabNavigator />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
