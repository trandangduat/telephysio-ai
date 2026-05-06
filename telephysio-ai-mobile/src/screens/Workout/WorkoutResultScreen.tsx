import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVideoPlayer, VideoView } from 'expo-video';

import { AppText } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'WorkoutResult'>;
interface Props { navigation: NavProp; }

// Use a mock local video source
const mockVideoSource = require('../../../videos/videoplayback2.mp4');

export const WorkoutResultScreen: React.FC<Props> = ({ navigation }) => {
  const player = useVideoPlayer(mockVideoSource, player => {
    player.loop = true;
    player.play();
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={styles.headerTitle}>Workout Results</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Results Summary Card */}
        <View style={styles.card}>
          <View style={styles.resultHeader}>
            <Ionicons name="trophy" size={32} color="#f59e0b" />
            <AppText variant="headlineLg" style={styles.congratsText}>Great Job!</AppText>
            <AppText variant="bodyMd" style={styles.subtitle}>You've completed your exercise.</AppText>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <AppText variant="headlineMd" style={styles.statValue}>15m</AppText>
              <AppText variant="labelSm" style={styles.statLabel}>DURATION</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="headlineMd" style={styles.statValue}>12/12</AppText>
              <AppText variant="labelSm" style={styles.statLabel}>REPS</AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="headlineMd" style={[styles.statValue, { color: '#047857' }]}>95%</AppText>
              <AppText variant="labelSm" style={styles.statLabel}>ACCURACY</AppText>
            </View>
          </View>
        </View>

        {/* Video Feedback */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam-outline" size={20} color="#0f172a" />
            <AppText variant="headlineSm" style={styles.sectionTitle}>Session Recording</AppText>
          </View>
          <AppText variant="bodySm" style={styles.sectionDesc}>Review your form from the last exercise.</AppText>
          
          <View style={styles.videoContainer}>
            <VideoView
              style={styles.video}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
            />
          </View>
        </View>

        {/* Form Feedback */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={20} color="#0f172a" />
            <AppText variant="headlineSm" style={styles.sectionTitle}>Form Feedback</AppText>
          </View>
          <View style={styles.feedbackItem}>
            <Ionicons name="checkmark-circle" size={20} color="#047857" />
            <AppText variant="bodyMd" style={styles.feedbackText}>Excellent depth on your squats.</AppText>
          </View>
          <View style={styles.feedbackItem}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <AppText variant="bodyMd" style={styles.feedbackText}>Keep your chest up during the movement.</AppText>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('Workout')}
        >
          <AppText variant="labelMd" style={{ color: '#fff' }}>Choose Another Exercise</AppText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <AppText variant="labelMd" style={{ color: colors.primary }}>Return to Home</AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.gutter, paddingVertical: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { color: '#0f172a', fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  resultHeader: { alignItems: 'center', marginBottom: spacing.lg },
  congratsText: { color: '#0f172a', fontWeight: '800', marginTop: spacing.sm },
  subtitle: { color: '#64748b', marginTop: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafd', borderRadius: 16, padding: spacing.md },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: '#0f172a', fontWeight: '700', fontSize: 24 },
  statLabel: { color: '#64748b', fontWeight: '600', letterSpacing: 0.5, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { color: '#0f172a', fontWeight: '700' },
  sectionDesc: { color: '#64748b', marginBottom: spacing.md },
  videoContainer: { width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1e293b' },
  video: { width: '100%', height: '100%' },
  feedbackItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: spacing.md, padding: spacing.md, backgroundColor: '#f8fafd', borderRadius: 12 },
  feedbackText: { color: '#334155', flex: 1 },
  footer: { padding: spacing.gutter, gap: spacing.md, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  button: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  primaryButton: { backgroundColor: colors.primary },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
});
