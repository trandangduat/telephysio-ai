/**
 * @file index.ts
 * @description Barrel export cho module theme của ứng dụng TelePhysioAI.
 * Import tất cả các token thiết kế (màu sắc, kiểu chữ, khoảng cách) từ một nơi duy nhất.
 *
 * Cách sử dụng:
 *   import { colors, palette, typography, spacing, radius, shadows } from '../theme';
 */

export { colors, palette }          from './colors';
export { typography }               from './typography';
export { spacing, radius, shadows } from './spacing';
