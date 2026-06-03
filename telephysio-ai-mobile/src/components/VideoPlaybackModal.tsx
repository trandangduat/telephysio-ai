/**
 * @file VideoPlaybackModal.tsx
 * @description Component modal để phát video bài tập.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { AppText } from './ui';

interface VideoPlaybackModalProps {
  visible: boolean;
  videoUri: string;
  onClose: () => void;
  title?: string;
}

/**
 * Component hiển thị cửa sổ (modal) phát video
 * @param props - Các thuộc tính truyền vào component
 * @param props.visible - Cờ quyết định modal hiển thị hay ẩn
 * @param props.videoUri - Đường dẫn URI của video cần phát
 * @param props.onClose - Hàm callback khi đóng modal
 * @param props.title - Tiêu đề của video (tuỳ chọn)
 * @returns Component React Modal chứa trình phát video
 */
export const VideoPlaybackModal: React.FC<VideoPlaybackModalProps> = ({ visible, videoUri, onClose, title }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <AppText variant="labelMd" style={styles.modalTitle}>
              {title || 'VIDEO PLAYBACK'}
            </AppText>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.modalVideoContainer}>
            {videoUri ? (
              <Video
                source={{ uri: videoUri }}
                style={styles.modalVideo}
                resizeMode={ResizeMode.COVER}
                useNativeControls
                shouldPlay
              />
            ) : (
              <View style={[styles.modalVideo, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="videocam-off" size={48} color="#475569" />
                <AppText style={{ color: '#94a3b8', marginTop: 16 }}>Video not available</AppText>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, zIndex: 10 },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { color: '#fff', fontWeight: '700', letterSpacing: 1 },
  modalVideoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalVideo: { width: '100%', height: '100%' },
});

