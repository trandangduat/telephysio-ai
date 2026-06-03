/**
 * @file typography.ts
 * @description Token kiểu chữ (typography) cho hệ thống thiết kế Clinical Vitality.
 *
 * Font sử dụng:
 *   - Manrope (tiêu đề - headlines)
 *   - Inter (nội dung, nhãn, dữ liệu)
 *
 * Cài đặt font: npx expo install @expo-google-fonts/manrope @expo-google-fonts/inter expo-font
 *
 * Cách sử dụng: spread vào style, ví dụ  ...typography.headlineMd
 */

/**
 * @constant typography
 * @description Tập hợp các kiểu chữ được định nghĩa sẵn cho toàn bộ ứng dụng.
 * Mỗi key là một style object có thể spread trực tiếp vào thuộc tính style của component.
 */
export const typography = {
    headlineXl: {
        fontFamily: 'Manrope_700Bold',
        fontSize:   32,
        fontWeight: '700' as const,
        lineHeight: 40,
    },
    headlineLg: {
        fontFamily: 'Manrope_600SemiBold',
        fontSize:   24,
        fontWeight: '600' as const,
        lineHeight: 32,
    },
    headlineMd: {
        fontFamily: 'Manrope_600SemiBold',
        fontSize:   20,
        fontWeight: '600' as const,
        lineHeight: 28,
    },
    bodyLg: {
        fontFamily: 'Inter_400Regular',
        fontSize:   18,
        fontWeight: '400' as const,
        lineHeight: 28,
    },
    bodyMd: {
        fontFamily: 'Inter_400Regular',
        fontSize:   16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    bodySm: {
        fontFamily: 'Inter_400Regular',
        fontSize:   14,
        fontWeight: '400' as const,
        lineHeight: 20,
    },
    labelMd: {
        fontFamily:    'Inter_600SemiBold',
        fontSize:      12,
        fontWeight:    '600' as const,
        lineHeight:    16,
        letterSpacing: 0.24, // 0.02em × 12px
    },
    labelSm: {
        fontFamily: 'Inter_500Medium',
        fontSize:   11,
        fontWeight: '500' as const,
        lineHeight: 14,
    },
} as const;
