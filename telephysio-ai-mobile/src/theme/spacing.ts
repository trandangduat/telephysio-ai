/**
 * @file spacing.ts
 * @description Token khoảng cách, bo góc và đổ bóng (shadow) cho hệ thống thiết kế Clinical Vitality.
 *
 * Đơn vị cơ sở: 4px
 * Phong cách đổ bóng: "flat-plus" theo clinical design
 */

/**
 * @constant spacing
 * @description Các giá trị khoảng cách chuẩn dựa trên đơn vị cơ sở 4px.
 * Dùng cho margin, padding và các khoảng cách trong layout.
 */
// Khoảng cách — đơn vị cơ sở 4px
export const spacing = {
    xs:     4,
    sm:     8,
    md:     16,
    lg:     24,
    xl:     32,
    gutter: 16,   // margin ngang mobile
} as const;

/**
 * @constant radius
 * @description Bán kính bo góc cho các phần tử UI (nút, card, input, v.v.).
 */
// Bán kính bo góc
export const radius = {
    sm:   4,     // 0.25rem
    md:   8,     // 0.5rem  — nút bấm, ô nhập liệu
    lg:   12,    // 0.75rem
    xl:   16,    // 1rem
    xxl:  24,    // 1.5rem  — thẻ lớn, cửa sổ video
    full: 9999,  // hình viên thuốc / chip
} as const;

/**
 * @constant shadows
 * @description Xu đổ bóng theo phong cách "flat-plus". Level 1 dùng viền thay bóng;
 * Level 2 dùng bóng mỜm lan tỏa màu xanh y tế cho phần tử floating.
 */
// Độ cao — "flat-plus" theo hệ thống thiết kế
export const shadows = {
    // Cấp độ 1: Thẻ tiêu chuẩn — dùng viền thay vì đổ bóng
    card: {
        borderWidth: 1,
        borderColor: '#c2c6d4', // outlineVariant
    },
    // Cấp độ 2: Đang hoạt động / Nổi — bóng đổ màu xanh dịu nhẹ lan tỏa
    floating: {
        shadowColor:   '#005eb8', // primaryContainer
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius:  12,
        elevation:     4,         // Android
    },
} as const;
