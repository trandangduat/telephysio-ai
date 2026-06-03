/**
 * @file colors.ts
 * @description Bảng màu token cho hệ thống thiết kế Clinical Vitality.
 * Nguồn: DESIGN.md
 *
 * Nguyên tắc sử dụng:
 *   - Không hardcode giá trị hex trực tiếp trong component.
 *   - Chỉ import `colors` hoặc `palette` từ file này.
 */
/**
 * @description Đối tượng chứa tất cả các màu cơ bản (token) của hệ thống thiết kế.
 */
export const colors = {
    // Bề mặt
    surface:                '#f5faff',
    surfaceDim:             '#d1dbe4',
    surfaceBright:          '#f5faff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow:    '#ebf5fd',
    surfaceContainerHigh:   '#dfeaf2',
    surfaceContainerHighest:'#dae4ec',
    surfaceContainer:       '#e5eff8',

    // Trên bề mặt (văn bản / biểu tượng trên bề mặt)
    onSurface:              '#131d23',
    onSurfaceVariant:       '#424752',
    inverseSurface:         '#283238',
    inverseOnSurface:       '#e8f2fb',

    // Đường viền
    outline:                '#727783',
    outlineVariant:         '#c2c6d4',

    // Chính — Xanh Y tế
    surfaceTint:            '#005db6',
    primary:                '#00478d',
    onPrimary:              '#ffffff',
    primaryContainer:       '#005eb8',
    onPrimaryContainer:     '#c8daff',
    inversePrimary:         '#a9c7ff',
    primaryFixed:           '#d6e3ff',
    primaryFixedDim:        '#a9c7ff',
    onPrimaryFixed:         '#001b3d',
    onPrimaryFixedVariant:  '#00468c',

    // Phụ — Xanh nhạt (Wash Blue)
    secondary:              '#566067',
    onSecondary:            '#ffffff',
    secondaryContainer:     '#dae4ed',
    onSecondaryContainer:   '#5c666d',
    secondaryFixed:         '#dae4ed',
    secondaryFixedDim:      '#bec8d0',
    onSecondaryFixed:       '#131d23',
    onSecondaryFixedVariant:'#3e484f',

    // Thứ ba — Xanh lá (Thành công)
    tertiary:               '#00541e',
    onTertiary:             '#ffffff',
    tertiaryContainer:      '#006f2b',
    onTertiaryContainer:    '#7df38e',
    tertiaryFixed:          '#85fb96',
    tertiaryFixedDim:       '#69de7c',
    onTertiaryFixed:        '#002108',
    onTertiaryFixedVariant: '#00531e',

    // Lỗi
    error:                  '#ba1a1a',
    onError:                '#ffffff',
    errorContainer:         '#ffdad6',
    onErrorContainer:       '#93000a',

    // Nền
    background:             '#f5faff',
    onBackground:           '#131d23',
    surfaceVariant:         '#dae4ec',
} as const;

/**
 * @constant palette
 * @description Alias ngắn gọn cho các màu được dùng thường xuyên nhất trong component.
 * Giúp viết code ngắn hơn bằng cách nhóm các token quan trọng dưới tên sử dụng ngắn.
 */
export const palette = {
    primary:   colors.primary,
    success:   colors.tertiary,
    error:     colors.error,
    bg:        colors.background,
    card:      colors.surfaceContainerLowest,
    border:    colors.outlineVariant,
    textMain:  colors.onSurface,
    textMuted: colors.onSurfaceVariant,
} as const;
