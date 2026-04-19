import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Calibration: undefined;
  Session: undefined;
};

type CalibrationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Calibration'>;

interface Props {
  navigation: CalibrationScreenNavigationProp;
}

export const CalibrationScreen: React.FC<Props> = ({ navigation }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mock AI detecting pose
    const timer = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.cameraPreview}>
        {/* Camera Feed would go here */}
        <Text style={styles.previewText}>
          {isReady ? "✅ Đã nhận diện được toàn bộ cơ thể" : "Đang căn chỉnh... Hãy lùi lại để camera thấy toàn thân."}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.primaryButton, !isReady && styles.disabledButton]}
        onPress={() => isReady && navigation.replace('Session')}
        disabled={!isReady}
      >
        <Text style={styles.buttonText}>Bắt đầu luyện tập</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    padding: 24,
  },
  previewText: {
    color: '#FFF',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95A5A6',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
