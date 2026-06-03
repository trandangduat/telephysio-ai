/**
 * @file SkeletonLoader.tsx
 * @description Component placeholder có hiệu ứng shimmer (nhấp nháy mờ) trong khi
 * nội dung đang được tải. Sử dụng Animated API của React Native với
 * vòng lặp opacity từ 0.3 đến 1.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';

/**
 * Props của component SkeletonLoader.
 * @param width        Chiều rộng của placeholder (mặc định: '100%').
 * @param height       Chiều cao của placeholder tính bằng px (mặc định: 16).
 * @param borderRadius Bán kính góc bo (mặc định: radius.md từ theme).
 * @param style        Style ViewStyle bổ sung ghi đè.
 */
interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

/**
 * Component placeholder hiển thị hiệu ứng shimmer trong lúc nội dung đang tải.
 *
 * @param width        Chiều rộng (số px hoặc chuỗi phần trăm, mặc định: '100%').
 * @param height       Chiều cao tính bằng px (mặc định: 16).
 * @param borderRadius Bán kính góc bo (mặc định: radius.md).
 * @param style        Style bổ sung.
 * @return             Animated.View với hiệu ứng opacity nấp nhô liên tục.
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    width = '100%',
    height = 16,
    borderRadius = radius.md,
    style,
}) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width: width as number,
                    height,
                    borderRadius,
                    backgroundColor: colors.surfaceContainerHigh,
                    opacity,
                },
                style,
            ]}
        />
    );
};
