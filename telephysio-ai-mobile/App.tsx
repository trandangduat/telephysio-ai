/**
 * Điểm bắt đầu (Entry point) của ứng dụng — TelePhysioAI.
 *
 * Hàm này chịu trách nhiệm tải các phông chữ Manrope + Inter, 
 * sau đó render bộ điều hướng (navigator) chính của toàn bộ ứng dụng.
 */

// Initialise i18n before any component renders
import './src/i18n';

import React, { useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { colors } from './src/theme';
import { GlobalNotificationToast } from './src/components/GlobalNotificationToast';

/**
 * Component chính của ứng dụng.
 * Khởi tạo Context xác thực, theo dõi font chữ, 
 * và chứa cấu trúc điều hướng toàn cục.
 * 
 * @return React.JSX.Element Giao diện chính của ứng dụng
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
        <GlobalNotificationToast />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
