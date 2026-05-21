/**
 * PoseEstimationView
 *
 * Renders a full-screen WebView that:
 * 1. Opens the device camera via getUserMedia (front-facing by default)
 * 2. Runs MediaPipe BlazePose (WASM/JS, CDN) for real-time human pose estimation
 * 3. Draws skeleton joints + connections as a canvas overlay on the video feed
 * 4. Reports pose landmark data back via onPoseDetected callback
 *
 * Usage:
 *   <PoseEstimationView
 *     style={{ flex: 1 }}
 *     onPoseDetected={(landmarks) => console.log(landmarks)}
 *     onError={(msg) => console.error(msg)}
 *   />
 */

import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { POSE_HTML } from './pose-html';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PoseLandmark {
  x: number;         // normalised [0..1] relative to frame width
  y: number;         // normalised [0..1] relative to frame height
  z: number;         // depth (relative, sign matters, not absolute)
  visibility: number; // confidence [0..1]
}

interface PoseEstimationViewProps {
  style?: StyleProp<ViewStyle>;
  /** Called every frame a pose is detected, with 33 BlazePose landmarks */
  onPoseDetected?: (landmarks: PoseLandmark[], fps: number) => void;
  /** Called when camera or model initialisation fails */
  onError?: (message: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const PoseEstimationView: React.FC<PoseEstimationViewProps> = ({
  style,
  onPoseDetected,
  onError,
}) => {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'POSE_LANDMARKS') {
          onPoseDetected?.(data.landmarks as PoseLandmark[], data.fps as number);
        } else if (data.type === 'CAMERA_ERROR') {
          onError?.(data.error as string);
        }
      } catch (_) {
        // ignore malformed messages
      }
    },
    [onPoseDetected, onError],
  );

  // On Android, mediaPlaybackRequiresUserAction must be false and
  // allowsInlineMediaPlayback must be true for camera / video to work.
  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: POSE_HTML }}
        style={styles.webview}
        // ── Media / Camera permissions ──────────────────────────────────────
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        // @ts-ignore: onPermissionRequest is valid for Android but missing in WebView type definition
        onPermissionRequest={(request: any) => request.grant(request.resources)}
        // iOS – grant camera permission inside WKWebView
        allowsProtectedMedia={true}
        // ── Network / security ───────────────────────────────────────────────
        // Required to load CDN scripts in the inline HTML
        mixedContentMode="always"
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // ── Messaging ────────────────────────────────────────────────────────
        onMessage={handleMessage}
        // ── UX ──────────────────────────────────────────────────────────────
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        // ── Error handling ───────────────────────────────────────────────────
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          onError?.(`WebView error: ${nativeEvent.description}`);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          onError?.(`HTTP ${nativeEvent.statusCode}: ${nativeEvent.url}`);
        }}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
