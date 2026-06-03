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

// ── Kiểu dữ liệu ────────────────────────────────────────────────────────────

/**
 * @interface PoseLandmark
 * @description Đại diện cho một điểm mốc (landmark) tư thế của BlazePose.
 * Mỗi landmark tương ứng với một khớp hoặc điểm giải phẫu trên cơ thể người.
 */
export interface PoseLandmark {
    /** Tọa độ ngang, chuẩn hóa về [0..1] theo chiều rộng khung hình */
    x: number;         // chuẩn hóa [0..1] so với chiều rộng khung hình
    /** Tọa độ dọc, chuẩn hóa về [0..1] theo chiều cao khung hình */
    y: number;         // chuẩn hóa [0..1] so với chiều cao khung hình
    /** Độ sâu tương đối (dấu có ý nghĩa, không phải giá trị tuyệt đối) */
    z: number;         // độ sâu (tương đối, có xét dấu, không phải tuyệt đối)
    /** Độ tin cậy phát hiện, trong khoảng [0..1] */
    visibility: number; // độ tin cậy [0..1]
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

// ── Thành phần ─────────────────────────────────────────────────────────────────

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
   * @returns Không có giá trị trả về
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
                // bỏ qua các tin nhắn bị định dạng sai
            }
        },
        [onPoseDetected, onError],
    );

    // Trên Android, mediaPlaybackRequiresUserAction phải là false và
    // allowsInlineMediaPlayback phải là true để camera / video hoạt động.
    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                source={{ html: POSE_HTML }}
                style={styles.webview}
                // ── Quyền Camera / Media ──────────────────────────────────────────
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                // @ts-ignore: onPermissionRequest hợp lệ trên Android nhưng bị thiếu trong định nghĩa kiểu WebView
                onPermissionRequest={(request: any) => request.grant(request.resources)}
                // iOS – cấp quyền camera bên trong WKWebView
                allowsProtectedMedia={true}
                // ── Mạng / bảo mật ───────────────────────────────────────────────
                // Bắt buộc để tải các script CDN trong HTML nội tuyến
                mixedContentMode="always"
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                // ── Nhắn tin ────────────────────────────────────────────────────────
                onMessage={handleMessage}
                // ── UX ──────────────────────────────────────────────────────────────
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                // ── Xử lý lỗi ───────────────────────────────────────────────────
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

// ── Kiểu dáng ────────────────────────────────────────────────────────────────────

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
