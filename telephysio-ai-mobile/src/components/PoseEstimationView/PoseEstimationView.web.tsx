/**
 * PoseEstimationView — WEB platform implementation
 *
 * Metro automatically picks this file over PoseEstimationView.tsx when
 * bundling for the web platform (expo start --web).
 *
 * Uses a native <iframe> with srcdoc to load the MediaPipe BlazePose HTML.
 * Camera access requires the `allow="camera"` attribute on the iframe.
 * Messages from the iframe are received via window.addEventListener('message').
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { POSE_HTML } from './pose-html';
import type { PoseLandmark } from './PoseEstimationView';

// ── Props (same interface as the native version) ──────────────────────────────

interface PoseEstimationViewProps {
  style?: StyleProp<ViewStyle>;
  onPoseDetected?: (landmarks: PoseLandmark[], fps: number) => void;
  onError?: (message: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PoseEstimationView: React.FC<PoseEstimationViewProps> = ({
  style,
  onPoseDetected,
  onError,
}) => {
  // Use a stable DOM id to locate the container after mount
  const containerId = useRef(
    `pose-view-${Math.random().toString(36).slice(2)}`,
  ).current;

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
          onPoseDetected?.(data.landmarks as PoseLandmark[], data.fps as number);
        } else if (data.type === 'CAMERA_ERROR') {
          onError?.(data.error as string);
        }
      } catch (_) {
        // ignore malformed messages
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };
  }, [containerId, onPoseDetected, onError]);

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
