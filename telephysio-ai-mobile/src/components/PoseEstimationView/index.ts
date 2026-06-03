/**
 * @file index.ts
 * @description Barrel export cho module PoseEstimationView.
 * Tập trung xuất component chính, kiểu dữ liệu landmark và bộ phân tích tư thế
 * để các màn hình khác chỉ cần import từ một đầu mối duy nhất.
 */
export { PoseEstimationView } from './PoseEstimationView';
export type { PoseLandmark } from './PoseEstimationView';
export { PoseAnalyzer } from './poseAnalyzer';
export type { PoseAnalysisResult } from './poseAnalyzer';
