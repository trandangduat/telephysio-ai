import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Placeholder Screens
import { HomeScreen } from './src/screens/Home/HomeScreen';
import { CalibrationScreen } from './src/screens/Calibration/CalibrationScreen';
import { SessionScreen } from './src/screens/Session/SessionScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Bảng điều khiển' }} 
        />
        <Stack.Screen 
          name="Calibration" 
          component={CalibrationScreen} 
          options={{ title: 'Hiệu chỉnh Camera' }} 
        />
        <Stack.Screen 
          name="Session" 
          component={SessionScreen} 
          options={{ title: 'Phòng luyện tập AI', headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
