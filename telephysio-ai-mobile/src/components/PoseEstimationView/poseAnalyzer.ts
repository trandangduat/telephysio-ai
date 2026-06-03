/**
 * @file poseAnalyzer.ts
 * @description Module phân tích tư thế (Pose Analysis). Chịu trách nhiệm nhận diện góc độ, 
 * đếm số lần lặp (reps) và đánh giá độ chính xác của tư thế (form accuracy).
 */
import { PoseLandmark } from './PoseEstimationView';

export interface PoseAnalysisResult {
    reps: number;
    formAccuracy: number;      // độ chính xác động THỜI GIAN THỰC cho thanh hiển thị trực tiếp
    averageAccuracy: number;   // Độ chính xác trung bình tích lũy cho các lần lặp lại đã hoàn thành
    feedback: string;
    isRepCounted: boolean;
}

/**
 * Lớp (Class) PoseAnalyzer.
 * Quản lý trạng thái phân tích tư thế cho một bài tập cụ thể.
 * Tính toán độ chính xác và đếm số lần tập thành công dựa trên các điểm ảnh (landmarks).
 */
export class PoseAnalyzer {
    private exerciseName: string;
    private reps: number = 0;
    private formAccuracySum: number = 0;
    private completedRepsCount: number = 0;
    private liveAccuracy: number = 95; // Điểm tư thế mượt mà trong thời gian thực
  
    // Trạng thái (State machine) cho các bài tập
    private repState: 'UP' | 'DOWN' = 'UP';
    private lastStateTime: number = 0;
  
    // Lịch sử dao động dọc (tọa độ y của mũi hoặc vai)
    private yHistory: number[] = [];
    private historySize = 30; // Khoảng 1-2 giây khung hình
    private lastRepTime = 0;
  
    // Lịch sử góc để làm mượt
    private kneeAngleHistory: number[] = [];
    private elbowAngleHistory: number[] = [];
  
    constructor(exerciseName: string) {
        this.exerciseName = exerciseName.toLowerCase();
        this.lastStateTime = Date.now();
        this.lastRepTime = Date.now();
    }
  
    /**
   * Khởi tạo lại trạng thái của quá trình phân tích (đặt lại số reps, điểm số, v.v. về 0).
   * 
   * @returns {void}
   */
    public reset() {
        this.reps = 0;
        this.formAccuracySum = 0;
        this.completedRepsCount = 0;
        this.liveAccuracy = 95;
        this.repState = 'UP';
        this.yHistory = [];
        this.kneeAngleHistory = [];
        this.elbowAngleHistory = [];
        this.lastRepTime = Date.now();
    }
  
    /**
   * Phân tích các điểm nhận diện (landmarks) từ khung hình hiện tại.
   * Tính toán góc, kiểm tra tư thế, cập nhật điểm chính xác và đếm số rep.
   * 
   * @param landmarks Mảng các điểm nhận diện tư thế từ MediaPipe
   * @param totalReps Tổng số lần lặp mục tiêu của hiệp tập
   * @returns PoseAnalysisResult Kết quả phân tích (số reps, độ chính xác, nhận xét)
   */
    public analyze(landmarks: PoseLandmark[], totalReps: number = 999): PoseAnalysisResult {
        let isRepCounted = false;
        let feedback = "Ready to start!";
    
        if (!landmarks || landmarks.length < 33) {
            return { 
                reps: this.reps, 
                formAccuracy: this.liveAccuracy, 
                averageAccuracy: this.getAverageAccuracy(), 
                feedback: "Align your body in the frame", 
                isRepCounted 
            };
        }
    
        // Trích xuất các điểm mốc quan trọng
        const nose = landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];
    
        // Kiểm tra xem chúng ta đang tập bài tập nào
        const isSquat = this.exerciseName.includes('squat');
        const isCurl = this.exerciseName.includes('curl') || this.exerciseName.includes('bicep');
        const isPress = this.exerciseName.includes('press') || this.exerciseName.includes('shoulder');
    
        // Tính toán độ hiển thị (visibility)
        const kneesVisible = (leftKnee?.visibility ?? 0) > 0.4 && (rightKnee?.visibility ?? 0) > 0.4;
        const hipsVisible = (leftHip?.visibility ?? 0) > 0.4 && (rightHip?.visibility ?? 0) > 0.4;
        const anklesVisible = (leftAnkle?.visibility ?? 0) > 0.4 && (rightAnkle?.visibility ?? 0) > 0.4;
    
        const elbowsVisible = (leftElbow?.visibility ?? 0) > 0.4 && (rightElbow?.visibility ?? 0) > 0.4;
        const wristsVisible = (leftWrist?.visibility ?? 0) > 0.4 && (rightWrist?.visibility ?? 0) > 0.4;
        const shouldersVisible = (leftShoulder?.visibility ?? 0) > 0.4 && (rightShoulder?.visibility ?? 0) > 0.4;
    
        // ─── 1. ĐÁNH GIÁ ĐỘ CHÍNH XÁC VÀ TƯ THẾ THỜI GIAN THỰC (cập nhật trên mỗi khung hình) ───
        let symmetryScore = 100;
    
        if (shouldersVisible) {
            const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
            // Độ nghiêng > 0.03 (khoảng 3% chiều cao camera) làm giảm độ chính xác
            if (shoulderTilt > 0.02) {
                symmetryScore -= Math.min(30, (shoulderTilt - 0.02) * 700);
            }
        }
    
        if (hipsVisible) {
            const hipTilt = Math.abs(leftHip.y - rightHip.y);
            if (hipTilt > 0.02) {
                symmetryScore -= Math.min(25, (hipTilt - 0.02) * 600);
            }
        }
    
        let depthScore = 100;
        if (isSquat && kneesVisible && hipsVisible && anklesVisible) {
            const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
            const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
            const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
      
            // Nếu đang ngồi xổm (squat), đánh giá phạm vi chuyển động của squat
            if (this.repState === 'DOWN') {
                if (kneeAngle > 120) {
                    depthScore -= Math.min(35, (kneeAngle - 120) * 0.9);
                }
            }
        } else if (isCurl && elbowsVisible && shouldersVisible && wristsVisible) {
            const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
            const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
            const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
      
            if (this.repState === 'UP' && elbowAngle < 135) {
                depthScore -= Math.min(25, (135 - elbowAngle) * 0.6);
            }
        }
    
        const frameAccuracy = Math.max(60, Math.min(100, Math.round(symmetryScore * 0.75 + depthScore * 0.25)));
    
        // Làm mượt độ chính xác trực tiếp để thanh tiến trình chuyển đổi đẹp mắt
        this.liveAccuracy = Math.round(this.liveAccuracy * 0.90 + frameAccuracy * 0.10);
    
        // ─── 2. MÔ HÌNH TRẠNG THÁI (STATE MACHINES) ĐẾM SỐ LẦN TẬP ───
        if (isSquat) {
            if (kneesVisible && hipsVisible && anklesVisible) {
                // Theo dõi góc đầu gối chính xác
                const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
                const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
                const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
        
                this.kneeAngleHistory.push(kneeAngle);
                if (this.kneeAngleHistory.length > 5) this.kneeAngleHistory.shift();
                const smoothedAngle = this.kneeAngleHistory.reduce((a, b) => a + b, 0) / this.kneeAngleHistory.length;
        
                if (this.repState === 'UP') {
                    if (smoothedAngle < 125) {
                        this.repState = 'DOWN';
                        this.lastStateTime = Date.now();
                        feedback = "Great depth, now stand up!";
                    } else if (smoothedAngle < 155) {
                        feedback = "Going down... keep chest up!";
                    } else {
                        feedback = "Squat down until thighs are parallel to floor";
                    }
                } else if (this.repState === 'DOWN') {
                    if (smoothedAngle > 160) {
                        this.repState = 'UP';
                        const duration = Date.now() - this.lastStateTime;
            
                        if (duration > 400 && Date.now() - this.lastRepTime > 1200) {
                            const repResult = this.incrementRep(`Rep {rep} counted! Form: ${this.liveAccuracy}%`, totalReps);
                            isRepCounted = repResult.isRepCounted;
                            feedback = repResult.feedback;
                        }
                    } else {
                        feedback = "Push through your heels to stand up!";
                    }
                }
            } else {
                // Dự phòng dao động dọc của Đầu/Vai
                const referenceY = shouldersVisible ? (leftShoulder.y + rightShoulder.y) / 2 : nose?.y;
        
                if (referenceY !== undefined) {
                    this.yHistory.push(referenceY);
                    if (this.yHistory.length > this.historySize) this.yHistory.shift();
          
                    if (this.yHistory.length >= 10) {
                        const minVal = Math.min(...this.yHistory);
                        const maxVal = Math.max(...this.yHistory);
                        const amplitude = maxVal - minVal;
                        const currentY = referenceY;
            
                        if (this.repState === 'UP') {
                            if (currentY > minVal + amplitude * 0.7 && amplitude > 0.03) {
                                this.repState = 'DOWN';
                                this.lastStateTime = Date.now();
                                feedback = "Squatting... keep back straight!";
                            } else {
                                feedback = "Ready. Squat down to begin!";
                            }
                        } else if (this.repState === 'DOWN') {
                            if (currentY < minVal + amplitude * 0.3 && amplitude > 0.03) {
                                this.repState = 'UP';
                                if (Date.now() - this.lastRepTime > 1500) {
                                    const repResult = this.incrementRep(`Rep {rep} counted! Good pace!`, totalReps);
                                    isRepCounted = repResult.isRepCounted;
                                    feedback = repResult.feedback;
                                }
                            } else {
                                feedback = "Powering back up!";
                            }
                        }
                    } else {
                        feedback = "Move your body up and down to start!";
                    }
                } else {
                    feedback = "Keep your head or shoulders in view";
                }
            }
        } else if (isCurl) {
            if (elbowsVisible && shouldersVisible && wristsVisible) {
                const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
                const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
                const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
        
                this.elbowAngleHistory.push(elbowAngle);
                if (this.elbowAngleHistory.length > 5) this.elbowAngleHistory.shift();
                const smoothedAngle = this.elbowAngleHistory.reduce((a, b) => a + b, 0) / this.elbowAngleHistory.length;
        
                if (this.repState === 'UP') {
                    if (smoothedAngle < 65) {
                        this.repState = 'DOWN';
                        this.lastStateTime = Date.now();
                        feedback = "Good squeeze! Control the negative phase.";
                    } else {
                        feedback = "Curl weights up towards shoulders";
                    }
                } else if (this.repState === 'DOWN') {
                    if (smoothedAngle > 140) {
                        this.repState = 'UP';
                        if (Date.now() - this.lastRepTime > 1200) {
                            const repResult = this.incrementRep(`Rep {rep} counted! Accuracy: ${this.liveAccuracy}%`, totalReps);
                            isRepCounted = repResult.isRepCounted;
                            feedback = repResult.feedback;
                        }
                    } else {
                        feedback = "Lower weights slowly and fully extend arms";
                    }
                }
            } else {
                // Dự phòng cho cuốn tạ (curls) sử dụng chuyển động tay
                const referenceY = wristsVisible ? (leftWrist.y + rightWrist.y) / 2 : (nose?.y ?? 0.5);
                this.yHistory.push(referenceY);
                if (this.yHistory.length > this.historySize) this.yHistory.shift();
        
                if (this.yHistory.length >= 10) {
                    const minVal = Math.min(...this.yHistory);
                    const maxVal = Math.max(...this.yHistory);
                    const amplitude = maxVal - minVal;
          
                    if (amplitude > 0.04) {
                        if (this.repState === 'UP') {
                            if (referenceY < minVal + amplitude * 0.3) {
                                this.repState = 'DOWN';
                                this.lastStateTime = Date.now();
                                feedback = "Hands up! Squeeze!";
                            }
                        } else if (this.repState === 'DOWN') {
                            if (referenceY > minVal + amplitude * 0.7) {
                                this.repState = 'UP';
                                if (Date.now() - this.lastRepTime > 1200) {
                                    const repResult = this.incrementRep(`Rep {rep} counted!`, totalReps);
                                    isRepCounted = repResult.isRepCounted;
                                    feedback = repResult.feedback;
                                }
                            }
                        }
                    } else {
                        feedback = "Curl your arms in front of the camera";
                    }
                }
            }
        } else if (isPress) {
            if (shouldersVisible && elbowsVisible && wristsVisible) {
                const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
                const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
                const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
        
                if (this.repState === 'UP') {
                    if (elbowAngle > 140 && leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y) {
                        this.repState = 'DOWN';
                        this.lastStateTime = Date.now();
                        feedback = "Top position! Control the descent.";
                    } else {
                        feedback = "Press weights straight up overhead";
                    }
                } else if (this.repState === 'DOWN') {
                    if (elbowAngle < 105) {
                        this.repState = 'UP';
                        if (Date.now() - this.lastRepTime > 1200) {
                            const repResult = this.incrementRep(`Rep {rep} counted! Form: ${this.liveAccuracy}%`, totalReps);
                            isRepCounted = repResult.isRepCounted;
                            feedback = repResult.feedback;
                        }
                    } else {
                        feedback = "Lower hands to shoulder level";
                    }
                }
            } else {
                // Dự phòng đẩy tạ (press) sử dụng chuyển động tay dọc
                const referenceY = wristsVisible ? (leftWrist.y + rightWrist.y) / 2 : (nose?.y ?? 0.5);
                this.yHistory.push(referenceY);
                if (this.yHistory.length > this.historySize) this.yHistory.shift();
        
                if (this.yHistory.length >= 10) {
                    const minVal = Math.min(...this.yHistory);
                    const maxVal = Math.max(...this.yHistory);
                    const amplitude = maxVal - minVal;
          
                    if (amplitude > 0.05) {
                        if (this.repState === 'UP') {
                            if (referenceY < minVal + amplitude * 0.3) {
                                this.repState = 'DOWN';
                                this.lastStateTime = Date.now();
                                feedback = "Press complete!";
                            }
                        } else if (this.repState === 'DOWN') {
                            if (referenceY > minVal + amplitude * 0.7) {
                                this.repState = 'UP';
                                if (Date.now() - this.lastRepTime > 1200) {
                                    const repResult = this.incrementRep(`Rep {rep} counted! Good press!`, totalReps);
                                    isRepCounted = repResult.isRepCounted;
                                    feedback = repResult.feedback;
                                }
                            }
                        }
                    } else {
                        feedback = "Raise hands up and down to press";
                    }
                }
            }
        } else {
            // BỘ PHÁT HIỆN CHUYỂN ĐỘNG CHUNG
            const referenceY = shouldersVisible ? (leftShoulder.y + rightShoulder.y) / 2 : (nose?.y ?? 0.5);
            this.yHistory.push(referenceY);
            if (this.yHistory.length > this.historySize) this.yHistory.shift();
      
            if (this.yHistory.length >= 12) {
                const minVal = Math.min(...this.yHistory);
                const maxVal = Math.max(...this.yHistory);
                const amplitude = maxVal - minVal;
        
                if (amplitude > 0.025) {
                    const currentY = referenceY;
                    if (this.repState === 'UP') {
                        if (currentY > minVal + amplitude * 0.7) {
                            this.repState = 'DOWN';
                            this.lastStateTime = Date.now();
                            feedback = "Keep moving, looking good!";
                        }
                    } else if (this.repState === 'DOWN') {
                        if (currentY < minVal + amplitude * 0.3) {
                            this.repState = 'UP';
                            if (Date.now() - this.lastRepTime > 1500) {
                                const repResult = this.incrementRep(`Rep {rep} counted! Keep it up!`, totalReps);
                                isRepCounted = repResult.isRepCounted;
                                feedback = repResult.feedback;
                            }
                        }
                    }
                } else {
                    feedback = "Perform your exercise in front of the camera";
                }
            } else {
                feedback = "Tracking motion...";
            }
        }
    
        return {
            reps: this.reps,
            formAccuracy: this.liveAccuracy, // Trả về độ chính xác động trực tiếp cho thanh thời gian thực!
            averageAccuracy: this.getAverageAccuracy(), // Trả về trung bình tích lũy của phiên để hoàn thành
            feedback,
            isRepCounted
        };
    }
  
    /**
   * Tăng bộ đếm số lần tập (rep) lên 1 và lưu trữ kết quả nhận xét.
   * 
   * @param feedbackMsg Tin nhắn phản hồi (có chứa {rep} để thay thế bằng số rep hiện tại)
   * @param totalReps Tổng số lần lặp mục tiêu
   * @returns {Object} Đối tượng chứa trạng thái đếm rep và tin nhắn phản hồi
   */
    private incrementRep(feedbackMsg: string, totalReps: number): { isRepCounted: boolean; feedback: string } {
        if (this.reps < totalReps) {
            this.reps += 1;
            this.lastRepTime = Date.now();
            this.addAccuracy(this.liveAccuracy);
            return { isRepCounted: true, feedback: feedbackMsg.replace('{rep}', this.reps.toString()) };
        }
        return { isRepCounted: false, feedback: `Goal of ${totalReps} reps reached! Great job!` };
    }
  
    /**
   * Lưu trữ và cộng dồn điểm số độ chính xác của tư thế.
   * 
   * @param score Điểm số độ chính xác của lần lặp (0-100)
   * @returns {void}
   */
    private addAccuracy(score: number) {
        this.formAccuracySum += score;
        this.completedRepsCount += 1;
    }
  
    /**
   * Lấy giá trị trung bình độ chính xác của tất cả các lần tập đã hoàn thành.
   * Nếu chưa hoàn thành lần nào, trả về độ chính xác tại thời điểm hiện tại.
   * 
   * @returns {number} Giá trị trung bình độ chính xác (0-100)
   */
    private getAverageAccuracy(): number {
        if (this.completedRepsCount === 0) return this.liveAccuracy;
        return Math.round(this.formAccuracySum / this.completedRepsCount);
    }
  
    /**
   * Tính toán góc tạo bởi 3 điểm nhận diện (Ví dụ: Vai, Khuỷu tay, Cổ tay).
   * 
   * @param a Điểm thứ nhất (Ví dụ: Vai)
   * @param b Điểm đỉnh góc (Ví dụ: Khuỷu tay)
   * @param c Điểm thứ ba (Ví dụ: Cổ tay)
   * @returns number Góc tính bằng độ (từ 0 đến 180)
   */
    private calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) {
            angle = 360.0 - angle;
        }
        return angle;
    }
}
