import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Session: undefined;
};

type SessionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Session'>;

interface Props {
  navigation: SessionScreenNavigationProp;
}

export const SessionScreen: React.FC<Props> = ({ navigation }) => {
  const [reps, setReps] = useState(0);

  // Mocking real-time pose updates
  useEffect(() => {
    const timer = setInterval(() => {
      setReps(prev => {
        if (prev >= 10) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bài tập gập khuỷu tay</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Dừng tập</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraPreview}>
        {/* Real-time PoseNet Skeleton goes here */}
        <Text style={styles.counterText}>{reps} / 10</Text>
        <Text style={styles.feedbackText}>
          {reps === 10 ? "Xuất sắc! Đã hoàn thành mục tiêu." : "Tiếp tục! Giữ thẳng lưng."}
        </Text>
      </View>

      {reps === 10 && (
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Lưu kết quả</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    color: '#E74C3C',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#F1C40F',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  feedbackText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
