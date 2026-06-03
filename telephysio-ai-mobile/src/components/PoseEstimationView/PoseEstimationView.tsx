/**
 * @file PoseEstimationView.tsx
 * @description Component React Native hiển thị toàn màn hình WebView để:
 *   1. Mở camera thiết bị qua getUserMedia (mặc định camera trước)
 *   2. Chạy MediaPipe BlazePose (WASM/JS qua CDN) để ước tính tư thế người theo thời gian thực
 *   3. Vẽ khung xương (skeleton) và các khớp lên canvas chồng trên luồng video
 *   4. Báo cáo dữ liệu landmark tư thế về component cha thông qua callback onPoseDetected
 *
 * Cách dùng:
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

/**
 * @interface PoseLandmark
 * @description Đại diện cho một điểm mốc (landmark) tư thế của BlazePose.
 * Mỗi landmark tương ứng với một khớp hoặc điểm giải phẫu trên cơ thể người.
 */
export interface PoseLandmark {
    /** Tọa độ ngang, chuẩn hóa về [0..1] theo chiều rộng khung hình */
    x: number;         // normalised [0..1] relative to frame width
    /** Tọa độ dọc, chuẩn hóa về [0..1] theo chiều cao khung hình */
    y: number;         // normalised [0..1] relative to frame height
    /** Độ sâu tương đối (dấu có ý nghĩa, không phải giá trị tuyệt đối) */
    z: number;         // depth (relative, sign matters, not absolute)
    /** Độ tin cậy phát hiện, trong khoảng [0..1] */
    visibility: number; // confidence [0..1]
}

/**
 * @interface PoseEstimationViewProps
 * @description Các props được truyền vào component PoseEstimationView.
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
   * Callback được gọi khi khởi tạo camera hoặc mô hình thất bại.
   * @param message Thông báo lỗi mô tả nguyên nhân
   */
    onError?: (message: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * @component PoseEstimationView
 * @description Component chính hiển thị WebView nhúng HTML ước tính tư thế MediaPipe.
 * Xử lý các quyền camera cho cả Android và iOS, nhận kết quả landmark qua
 * postMessage từ WebView.
 *
 * @param {PoseEstimationViewProps} props - Props của component
 * @returns {JSX.Element} Một View chứa WebView chạy BlazePose
 */
export const PoseEstimationView: React.FC<PoseEstimationViewProps> = ({
    style,
    onPoseDetected,
    onError,
}) => {
    const webViewRef = useRef<WebView>(null);

    /**
   * @function handleMessage
   * @description Xử lý các tin nhắn postMessage nhận được từ bên trong WebView.
   * Hỗ trợ hai loại tin nhắn: POSE_LANDMARKS (kết quả tư thế) và CAMERA_ERROR (lỗi camera).
   *
   * @param {WebViewMessageEvent} event - Sự kiện chứa dữ liệu JSON từ WebView
   */
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
