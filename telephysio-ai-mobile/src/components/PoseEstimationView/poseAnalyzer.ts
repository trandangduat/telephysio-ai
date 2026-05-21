import { PoseLandmark } from './PoseEstimationView';

export interface PoseAnalysisResult {
  reps: number;
  formAccuracy: number;      // REAL-TIME dynamic form accuracy for the live bar
  averageAccuracy: number;   // Cumulative average form accuracy for completed reps
  feedback: string;
  isRepCounted: boolean;
}

export class PoseAnalyzer {
  private exerciseName: string;
  private reps: number = 0;
  private formAccuracySum: number = 0;
  private completedRepsCount: number = 0;
  private liveAccuracy: number = 95; // Real-time smoothed posture score
  
  // State machine for exercises
  private repState: 'UP' | 'DOWN' = 'UP';
  private lastStateTime: number = 0;
  
  // History for vertical oscillation (nose or shoulders y-coordinate)
  private yHistory: number[] = [];
  private historySize = 30; // ~1-2 seconds of frames
  private lastRepTime = 0;
  
  // Angle history for smoothing
  private kneeAngleHistory: number[] = [];
  private elbowAngleHistory: number[] = [];
  
  constructor(exerciseName: string) {
    this.exerciseName = exerciseName.toLowerCase();
    this.lastStateTime = Date.now();
    this.lastRepTime = Date.now();
  }
  
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
    
    // Extract key landmarks
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
    
    // Check which exercise we are doing
    const isSquat = this.exerciseName.includes('squat');
    const isCurl = this.exerciseName.includes('curl') || this.exerciseName.includes('bicep');
    const isPress = this.exerciseName.includes('press') || this.exerciseName.includes('shoulder');
    
    // Calculate visibilities
    const kneesVisible = (leftKnee?.visibility ?? 0) > 0.4 && (rightKnee?.visibility ?? 0) > 0.4;
    const hipsVisible = (leftHip?.visibility ?? 0) > 0.4 && (rightHip?.visibility ?? 0) > 0.4;
    const anklesVisible = (leftAnkle?.visibility ?? 0) > 0.4 && (rightAnkle?.visibility ?? 0) > 0.4;
    
    const elbowsVisible = (leftElbow?.visibility ?? 0) > 0.4 && (rightElbow?.visibility ?? 0) > 0.4;
    const wristsVisible = (leftWrist?.visibility ?? 0) > 0.4 && (rightWrist?.visibility ?? 0) > 0.4;
    const shouldersVisible = (leftShoulder?.visibility ?? 0) > 0.4 && (rightShoulder?.visibility ?? 0) > 0.4;
    
    // ─── 1. REAL-TIME ACCURACY & POSTURE EVALUATION (updates on every frame) ───
    let symmetryScore = 100;
    
    if (shouldersVisible) {
      const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
      // Tilt of > 0.03 (approx 3% of camera height) drops accuracy
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
      
      // If squatting down, evaluate squat range of motion
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
    
    // Smooth the live accuracy so the progress bar transitions beautifully
    this.liveAccuracy = Math.round(this.liveAccuracy * 0.90 + frameAccuracy * 0.10);
    
    // ─── 2. REPETITION COUNTING STATE MACHINES ───
    if (isSquat) {
      if (kneesVisible && hipsVisible && anklesVisible) {
        // Precise knee angle tracking
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
        // Head/Shoulder vertical oscillation fallback
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
        // Fallback for curls using hand motion
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
        // Press fallback using hand vertical motion
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
      // GENERAL MOTION DETECTOR
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
      formAccuracy: this.liveAccuracy, // Return dynamic live accuracy for the real-time bar!
      averageAccuracy: this.getAverageAccuracy(), // Return the cumulative session average for completion
      feedback,
      isRepCounted
    };
  }
  
  private incrementRep(feedbackMsg: string, totalReps: number): { isRepCounted: boolean; feedback: string } {
    if (this.reps < totalReps) {
      this.reps += 1;
      this.lastRepTime = Date.now();
      this.addAccuracy(this.liveAccuracy);
      return { isRepCounted: true, feedback: feedbackMsg.replace('{rep}', this.reps.toString()) };
    }
    return { isRepCounted: false, feedback: `Goal of ${totalReps} reps reached! Great job!` };
  }
  
  private addAccuracy(score: number) {
    this.formAccuracySum += score;
    this.completedRepsCount += 1;
  }
  
  private getAverageAccuracy(): number {
    if (this.completedRepsCount === 0) return this.liveAccuracy;
    return Math.round(this.formAccuracySum / this.completedRepsCount);
  }
  
  private calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360.0 - angle;
    }
    return angle;
  }
}
