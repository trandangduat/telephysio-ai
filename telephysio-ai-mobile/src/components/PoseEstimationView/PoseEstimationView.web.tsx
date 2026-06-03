/**
 * @file PoseEstimationView.web.tsx
 * @description Phiên bản triển khai của PoseEstimationView cho nền tảng WEB.
 *
 * Metro tự động chọn file này thay vì PoseEstimationView.tsx khi
 * bundle cho nền tảng web (expo start --web).
 *
 * Sử dụng thẻ <iframe> nà tiếu với srcdoc để tải HTML MediaPipe BlazePose.
 * Truy cập camera yêu cầu thuộc tính allow="camera" trên iframe.
 * Tin nhắn từ iframe được nhận qua window.addEventListener('message').
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { POSE_HTML } from './pose-html';
import type { PoseLandmark } from './PoseEstimationView';

// ── Props (same interface as the native version) ──────────────────────────────

/**
 * @interface PoseEstimationViewProps
 * @description Các props truyền vào component (giống hệt phiên bản native).
 */
interface PoseEstimationViewProps {
  /** Style tùy chỉnh cho container bên ngoài */
  style?: StyleProp<ViewStyle>;
  /**
   * Callback được gọi mỗi khung hình khi phát hiện tư thế.
   * @param landmarks Mảng 33 điểm mốc BlazePose
   * @param fps Số khung hình trên giây hiện tại
   */
  onPoseDetected?: (landmarks: PoseLandmark[], fps: number) => void;
  /**
   * Callback được gọi khi xảy ra lỗi khởi tạo camera.
   * @param message Thông báo lỗi
   */
  onError?: (message: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * @component PoseEstimationView
 * @description Phiên bản Web của PoseEstimationView, sử dụng iframe DOM để
 * nhúng trang HTML BlazePose. Quản lý vòng đời iframe, lắng nghe tin nhắn
 * từ iframe và chuyển tiếp kết quả landmark/lỗi lên component cha.
 *
 * @param {PoseEstimationViewProps} props - Props của component
 * @returns {JSX.Element} Một View (div DOM) chứa iframe BlazePose
 */
export const PoseEstimationView: React.FC<PoseEstimationViewProps> = ({
  style,
  onPoseDetected,
  onError,
}) => {
  // Use a stable DOM id to locate the container after mount
  const containerId = useRef(
    `pose-view-${Math.random().toString(36).slice(2)}`,
  ).current;

  // Use refs to keep callbacks stable and prevent iframe from being destroyed & re-created
  const onPoseDetectedRef = useRef(onPoseDetected);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onPoseDetectedRef.current = onPoseDetected;
    onErrorRef.current = onError;
  }, [onPoseDetected, onError]);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // ── Create iframe ─────────────────────────────────────────────────────────
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'width:100%;height:100%;border:none;display:block;background:#111827;';
    // Grant camera + microphone permissions to the iframe origin
    iframe.allow = 'camera; microphone; autoplay';
    iframe.setAttribute('allowfullscreen', '');
    // Inject the entire HTML via srcdoc (no separate server required)
    iframe.srcdoc = POSE_HTML;

    container.appendChild(iframe);

    if (typeof window !== 'undefined') {
      (window as any).__poseIframe = iframe.contentWindow;
    }

    // ── Listen for messages posted from inside the iframe ─────────────────────
    const handleMessage = (event: MessageEvent) => {
      // Only handle messages from our iframe
      if (event.source !== iframe.contentWindow) return;
      try {
        const data =
          typeof event.data === 'string'
            ? JSON.parse(event.data)
            : event.data;

        if (data.type === 'POSE_LANDMARKS') {
          onPoseDetectedRef.current?.(data.landmarks as PoseLandmark[], data.fps as number);
        } else if (data.type === 'CAMERA_ERROR') {
          onErrorRef.current?.(data.error as string);
        } else if (data.type === 'RECORDING_COMPLETE') {
          // Receive raw ArrayBuffer from iframe and create blob URL in parent context.
          // This is critical: blob URLs created inside srcdoc iframes get revoked
          // when the iframe is destroyed, so we must recreate the blob here.
          if (data.buffer instanceof ArrayBuffer) {
            const blob = new Blob([data.buffer], { type: data.mimeType || 'video/webm' });
            const blobUrl = URL.createObjectURL(blob);
            console.log("[PoseEstimationView.web] Created parent-context blob URL:", blobUrl, "size:", blob.size, "mime:", blob.type);
            if (typeof window !== 'undefined') {
              (window as any).__lastRecordedVideoUrl = blobUrl;
              (window as any).__recordedVideos = (window as any).__recordedVideos || {};
              (window as any).__recordedVideos['latest'] = blobUrl;
            }
          } else {
            console.warn("[PoseEstimationView.web] RECORDING_COMPLETE received without ArrayBuffer — video will not be available.");
          }
        }
      } catch (_) {
        // ignore malformed messages
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__poseIframe = null;
      }
      window.removeEventListener('message', handleMessage);
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
        console.log("[PoseEstimationView.web] Iframe cleaned up cleanly on unmount.");
      }
    };
  }, [containerId]);

  // React Native Web renders <View> as a <div> — nativeID becomes the DOM id
  return (
    <View
      nativeID={containerId}
      style={[styles.container, style]}
    />
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
});
