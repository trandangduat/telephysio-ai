/**
 * TrainingScreen — Live Workout Session
 *
 * Supports toggling between Full-Screen (Compact) and Normal (Detailed) modes.
 * Integrates real-time human pose estimation via MediaPipe BlazePose (WebView).
 */

import React, { useState, useEffect, useCallback,useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientAssignments, startRecording, pauseRecording, resumeRecording, stopRecording } from '../../services/firebase';
import type { Assignment, Exercise } from '../../services/firebase/types';
import { PoseEstimationView, PoseAnalyzer } from '../../components/PoseEstimationView';
import type { PoseLandmark } from '../../components/PoseEstimationView';

type TrainingProps = NativeStackScreenProps<RootStackParamList, 'Training'>;

export const TrainingScreen: React.FC<TrainingProps> = ({ route, navigation }) => {
    const { assignmentId, exerciseIndex, recordVideo } = route.params || { assignmentId: '', exerciseIndex: 0, recordVideo: false };
    const { uid } = useAuth();
    const [isFullScreen, setIsFullScreen] = useState(true); // Toggle state
    const [currentRep, setCurrentRep] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [formAccuracy, setFormAccuracy] = useState(95);
    const [averageAccuracy, setAverageAccuracy] = useState(95);
    const isFinishingRef = useRef(false);
    const [paused, setPaused] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isResting, setIsResting] = useState(false);
    const [restTimeLeft, setRestTimeLeft] = useState(0);

    const [completedSets, setCompletedSets] = useState<{
        setNumber: number;
        repsCompleted: number;
        durationSec: number;
        accuracy: number;
    }[]>([]);
    const [lastSetElapsed, setLastSetElapsed] = useState(0);

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [exercise, setExercise] = useState<Exercise | null>(null);

    const totalReps = exercise?.reps || 12;
    const totalSets = exercise?.sets || 3;

    // ── Pose estimation state ─────────────────────────────────────────────────
    const [poseDetected, setPoseDetected] = useState(false);
    const [liveFps, setLiveFps] = useState(0);
    const [poseError, setPoseError] = useState<string | null>(null);
    const [coachFeedback, setCoachFeedback] = useState("Ready to start!");

    const poseAnalyzerRef = useRef<PoseAnalyzer | null>(null);

    const handlePoseDetected = useCallback((landmarks: PoseLandmark[], fps: number) => {
        setPoseDetected(true);
        setLiveFps(fps);
        
        if (paused || isResting || isFinishing) return;
        
        if (poseAnalyzerRef.current) {
            const result = poseAnalyzerRef.current.analyze(landmarks, totalReps);
            const displayedReps = Math.min(result.reps, totalReps);
            setCurrentRep(displayedReps);
            setFormAccuracy(result.formAccuracy);
            setAverageAccuracy(result.averageAccuracy);
            setCoachFeedback(result.feedback);
        }
    }, [paused, isResting, isFinishing, totalReps]);

    const handlePoseError = useCallback((msg: string) => {
        setPoseError(msg);
        console.warn('[PoseEstimation] error:', msg);
    }, []);

    useEffect(() => {
        async function loadData() {
            if (!uid || !assignmentId) return;
            const assignments = await getPatientAssignments(uid, 'active');
            const active = assignments.find(a => a.id === assignmentId);
            if (active && active.exercises[exerciseIndex]) {
                setAssignment(active);
                setExercise(active.exercises[exerciseIndex]);
            }
        }
        loadData();
    }, [uid, assignmentId, exerciseIndex]);

    useEffect(() => {
        if (exercise?.name) {
            console.log(`[TrainingScreen] Initializing PoseAnalyzer for: ${exercise.name}`);
            poseAnalyzerRef.current = new PoseAnalyzer(exercise.name);
            setCoachFeedback("Align your body in the frame.");
        }
    }, [exercise?.name]);

    // totalReps and totalSets have been moved up to resolve reference issues in callbacks

    // Simulate timers
    useEffect(() => {
        if (paused) return;

        if (isResting) {
            const timer = setInterval(() => {
                setRestTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsResting(false);
                        setCurrentSet(s => s + 1);
                        setCurrentRep(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        } else {
            const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
            return () => clearInterval(timer);
        }
    }, [paused, isResting]);

    // Live Video Recording effects
    useEffect(() => {
        let isMounted = true;
        async function initRecording() {
            if (recordVideo && assignmentId) {
                try {
                    console.log(`[TrainingScreen] Mounting: auto-starting video recording for ${assignmentId}`);
                    await startRecording(assignmentId);
                } catch (err) {
                    console.error("[TrainingScreen] Failed to start recording on mount:", err);
                }
            }
        }
        initRecording();
        return () => {
            isMounted = false;
            if (recordVideo) {
                stopRecording().catch(err => console.warn("[TrainingScreen] Failed to stop recording on unmount:", err));
            }
        };
    }, [assignmentId, recordVideo]);

    useEffect(() => {
        if (!recordVideo) return;
        if (paused) {
            console.log("[TrainingScreen] Session paused: pausing recording");
            pauseRecording();
        } else {
            console.log("[TrainingScreen] Session resumed: resuming recording");
            resumeRecording();
        }
    }, [paused, recordVideo]);

    const handleStop = useCallback(() => { navigation.goBack(); }, [navigation]);

    const handleNextExercise = useCallback(async (finalSets: any[]) => {
        if (!uid || !exercise) return;
        if (isFinishingRef.current) return;
        isFinishingRef.current = true;
        setIsFinishing(true);
        setPaused(true);
        
        // Calculate dynamic overall average accuracy over completed sets
        const avgAccuracy = finalSets.length > 0 
            ? Math.round(finalSets.reduce((sum, s) => sum + s.accuracy, 0) / finalSets.length)
            : averageAccuracy;

        // Calculate total reps completed
        const totalRepsCompleted = finalSets.reduce((sum, s) => sum + s.repsCompleted, 0);

        if (recordVideo) {
            try {
                console.log("[TrainingScreen] Stopping video recording...");
                await stopRecording();
            } catch (err) {
                console.error("[TrainingScreen] Failed to stop recording inside handleNextExercise:", err);
            }
        }

        try {
            // Just navigate to ExerciseResult
            navigation.replace('ExerciseResult', {
                assignmentId,
                exerciseIndex,
                accuracy: avgAccuracy,
                durationSeconds: elapsed,
                reps: totalRepsCompleted,
                sets: finalSets.length,
                recordVideo,
                setsData: finalSets,
            });
        } catch (error) {
            console.error('Failed to finish exercise:', error);
            Alert.alert('Error', 'Failed to save exercise progress.');
            setPaused(false);
            isFinishingRef.current = false;
        } finally {
            setIsFinishing(false);
        }
    }, [uid, exercise, assignmentId, exerciseIndex, averageAccuracy, elapsed, recordVideo, navigation]);

    const handleCompleteSet = useCallback(() => {
        if (isFinishingRef.current || isResting || isFinishing) {
            console.log("[TrainingScreen] handleCompleteSet skipped: already resting or finishing");
            return;
        }
        const currentSetDuration = elapsed - lastSetElapsed;
        const currentSetData = {
            setNumber: currentSet,
            repsCompleted: currentRep,
            durationSec: currentSetDuration,
            accuracy: averageAccuracy,
        };

        const updatedSets = [...completedSets, currentSetData];
        setCompletedSets(updatedSets);
        setLastSetElapsed(elapsed);

        if (currentSet < totalSets) {
            setIsResting(true);
            setRestTimeLeft(exercise?.restBetweenSets || 30);
            if (poseAnalyzerRef.current) {
                poseAnalyzerRef.current.reset();
            }
            setCurrentRep(0);
            setFormAccuracy(95);
            setAverageAccuracy(95);
        } else {
            handleNextExercise(updatedSets);
        }
    }, [currentSet, totalSets, exercise, elapsed, lastSetElapsed, currentRep, averageAccuracy, completedSets, handleNextExercise, isResting, isFinishing]);

    const handleCompleteSetRef = useRef(handleCompleteSet);
    useEffect(() => {
        handleCompleteSetRef.current = handleCompleteSet;
    }, [handleCompleteSet]);

    // Auto-complete set when reps reach totalReps goal
    useEffect(() => {
        if (exercise && currentRep > 0 && currentRep >= totalReps && !isResting && !isFinishing && !paused) {
            console.log(`[TrainingScreen] Auto-completing set: ${currentRep}/${totalReps} reached.`);
            const timer = setTimeout(() => {
                handleCompleteSetRef.current();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentRep, totalReps, isResting, isFinishing, paused, exercise]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const remainingSets = Math.max(totalSets - currentSet, 0);

    // ---------------------------------------------------------------------------
    // FULL SCREEN MODE (Compact)
    // ---------------------------------------------------------------------------
    if (isFullScreen) {
        return (
            <View style={styles.fsContainer}>
                {/* REAL CAMERA VIEW + POSE ESTIMATION (Background) */}
                <PoseEstimationView
                    style={StyleSheet.absoluteFillObject}
                    onPoseDetected={handlePoseDetected}
                    onError={handlePoseError}
                />

                {/* Pose detection status badge */}
                <View style={styles.skeletonCenter}>
                    {poseError ? (
                        <View style={[styles.poseBadge, styles.poseBadgeError]}>
                            <Ionicons name="warning-outline" size={14} color="#fca5a5" />
                            <AppText variant="labelMd" style={{ color: '#fca5a5', marginLeft: 4 }}>Camera Unavailable</AppText>
                        </View>
                    ) : poseDetected ? (
                        <View style={styles.poseBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#a7f3d0" />
                            <AppText variant="labelMd" style={{ color: '#fff', marginLeft: 4 }}>Pose Detected · {liveFps} fps</AppText>
                        </View>
                    ) : (
                        <View style={[styles.poseBadge, styles.poseBadgeLoading]}>
                            <ActivityIndicator size="small" color="#fde68a" />
                            <AppText variant="labelMd" style={{ color: '#fde68a', marginLeft: 6 }}>Starting AI…</AppText>
                        </View>
                    )}
                </View>

                {/* TOP OVERLAY (Controls & Timer) */}
                <SafeAreaView style={styles.topOverlay} edges={['top']}>
                    <View style={styles.topBar}>
                        {/* Left empty (no button on left) */}
                        <View style={{ width: 40 }} />

                        <View style={styles.timerContainer}>
                            <View style={styles.fsLiveBadge}>
                                <View style={styles.fsLiveDot} />
                                <AppText variant="labelSm" style={{ color: '#fff', fontWeight: '700' }}>LIVE</AppText>
                            </View>
                            <AppText variant="bodyMd" style={styles.timerText}>{formatTime(elapsed)}</AppText>
                        </View>

                        {/* Right button finishes session */}
                        <TouchableOpacity style={[styles.iconButton, { backgroundColor: 'rgba(220,38,38,0.3)' }]} onPress={handleStop}>
                            <Ionicons name="stop" size={20} color="#f87171" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                {/* BOTTOM SHEET */}
                <View style={styles.bottomSheet}>
                    <View style={styles.sheetHeader}>
                        <AppText variant="labelMd" style={styles.grayLabel}>CURRENT SET</AppText>
                        <AppText variant="labelMd" style={styles.grayLabel}>REPS</AppText>
                    </View>

                    <View style={styles.dataRow}>
                        <View style={{ flex: 1 }}>
                            <AppText variant="headlineXl" style={styles.exerciseName}>{exercise?.name || 'Exercise'}</AppText>
                            <AppText variant="bodySm" style={{ color: '#64748b', marginTop: 2, fontWeight: '600' }}>Remaining: {remainingSets} sets</AppText>
                        </View>
                        <View style={styles.repContainer}>
                            <AppText style={styles.repBig}>{currentRep}</AppText>
                            <AppText style={styles.repSmall}> /{totalReps}</AppText>
                        </View>
                    </View>

                    {/* AI Feedback Bubble */}
                    <View style={styles.fsFeedbackCard}>
                        <View style={styles.fsFeedbackPulse}>
                            <View style={styles.fsFeedbackDot} />
                        </View>
                        <AppText variant="bodySm" style={styles.fsFeedbackText}>
                            {poseError ? 'Camera unavailable' : poseDetected ? coachFeedback : 'Starting posture tracking...'}
                        </AppText>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <AppText variant="labelMd" style={styles.grayLabel}>Form Accuracy</AppText>
                            <AppText variant="labelMd" style={styles.accuracyValue}>{formAccuracy}%</AppText>
                        </View>
                        <View style={styles.progressBarTrack}>
                            <View style={[styles.progressBarFill, { width: `${formAccuracy}%` }]} />
                        </View>
                    </View>

                    <View style={styles.mediaControls}>
                        {/* Left button removed as requested */}
                        <View style={{ width: 56 }} />

                        <TouchableOpacity style={styles.playPauseButton} onPress={() => setPaused(!paused)}>
                            <Ionicons name={paused ? "play" : "pause"} size={32} color="#fff" />
                        </TouchableOpacity>

                        {/* Right button is used to complete current set / finish exercise */}
                        <TouchableOpacity 
                            style={[styles.skipButton, { backgroundColor: '#10b981' }]} 
                            onPress={handleCompleteSet} 
                            disabled={isFinishing}
                        >
                            {isFinishing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="checkmark-done" size={24} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {isResting && (
                    <View style={styles.restOverlay}>
                        <View style={styles.restIconCircle}>
                            <Ionicons name="stopwatch-outline" size={36} color={colors.primary} />
                        </View>
                        
                        <AppText variant="labelMd" style={styles.restLabel}>RESTING PERIOD</AppText>
                        
                        <AppText variant="headlineXl" style={styles.restTimerDigits}>
                            {formatTime(restTimeLeft)}
                        </AppText>
                        
                        <AppText variant="bodySm" style={styles.restSubtext}>
                            Up Next: Set {currentSet + 1} of {totalSets}
                        </AppText>

                        <View style={styles.restActionRow}>
                            <TouchableOpacity 
                                style={styles.addTimeButton} 
                                onPress={() => setRestTimeLeft(p => p + 20)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add-outline" size={16} color="#fff" />
                                <AppText variant="labelSm" style={{ color: '#fff', fontWeight: '700' }}>20s</AppText>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.skipRestBtnPremium} 
                                onPress={() => setRestTimeLeft(0)}
                                activeOpacity={0.8}
                            >
                                <AppText variant="labelSm" style={{ color: '#fff', fontWeight: '700' }}>Skip Rest</AppText>
                                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    }

    // ---------------------------------------------------------------------------
    // NORMAL MODE (Detailed)
    // ---------------------------------------------------------------------------
    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.normalTopBar}>
                <TouchableOpacity onPress={handleStop}>
                    <Ionicons name="arrow-back" size={28} color={colors.primary} />
                </TouchableOpacity>
                <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
                <TouchableOpacity style={styles.avatar}>
                    <Ionicons name="person" size={16} color={colors.onPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* REAL CAMERA VIEW + POSE ESTIMATION */}
                <View style={styles.videoContainer}>
                    {/* Pose estimation WebView fills the container */}
                    <PoseEstimationView
                        style={StyleSheet.absoluteFillObject}
                        onPoseDetected={handlePoseDetected}
                        onError={handlePoseError}
                    />

                    {/* Top Row: Badges & Expand Button */}
                    <View style={styles.videoTopRow}>
                        <View style={styles.badgeGroup}>
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <AppText variant="labelSm" style={styles.badgeText}>LIVE</AppText>
                            </View>
                            {poseDetected ? (
                                <View style={styles.trackingBadge}>
                                    <Ionicons name="radio-outline" size={14} color="#fff" />
                                    <AppText variant="labelSm" style={styles.badgeText}>AI Active · {liveFps} fps</AppText>
                                </View>
                            ) : (
                                <View style={[styles.trackingBadge, { backgroundColor: 'rgba(245,158,11,0.8)' }]}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <AppText variant="labelSm" style={[styles.badgeText, { marginLeft: 6 }]}>Loading AI…</AppText>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.expandButton} onPress={() => setIsFullScreen(true)}>
                            <Ionicons name="expand" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Form Analysis Overlay */}
                    <View style={styles.analysisCard}>
                        <View style={styles.checkCircle}>
                            <Ionicons name={poseDetected ? "checkmark" : "hourglass-outline"} size={16} color={poseDetected ? '#047857' : '#d97706'} />
                        </View>
                        <View style={styles.analysisTextCol}>
                            <AppText variant="labelMd" style={styles.analysisLabel}>POSE ANALYSIS</AppText>
                            <AppText variant="bodySm" style={styles.analysisText}>
                                {poseError ? 'Camera access required for AI tracking' : poseDetected ? coachFeedback : 'Waiting for AI model to load…'}
                            </AppText>
                        </View>
                    </View>
                </View>

                {/* CURRENT EXERCISE CARD */}
                <View style={styles.card}>
                    <AppText variant="labelMd" style={styles.grayLabel}>CURRENT EXERCISE</AppText>
                    <View style={styles.exerciseRow}>
                        <AppText style={styles.exerciseName}>{exercise?.name || 'Exercise'}</AppText>
                        <AppText style={styles.setInfo}>Remaining: {remainingSets} sets</AppText>
                    </View>

                    <View style={styles.progressBarTrackNormal}>
                        <View style={[styles.progressBarFillNormal, { width: `${(currentRep / totalReps) * 100}%` }]} />
                    </View>

                    <View style={styles.repInfoRow}>
                        <AppText variant="labelSm" style={styles.repInfoText}>{currentRep} Reps Completed</AppText>
                        <AppText variant="labelSm" style={styles.repInfoText}>{totalReps} Reps Goal</AppText>
                    </View>
                </View>

                {/* STATS ROW */}
                <View style={styles.statsRow}>
                    <View style={[styles.card, styles.statCard]}>
                        <Ionicons name="refresh" size={24} color={colors.primary} style={styles.statIcon} />
                        <AppText variant="labelMd" style={styles.statLabel}>REPS</AppText>
                        <AppText style={styles.statValue}>{currentRep}</AppText>
                    </View>

                    <View style={[styles.card, styles.statCard]}>
                        <Ionicons name="stats-chart" size={24} color="#047857" style={styles.statIcon} />
                        <AppText variant="labelMd" style={styles.statLabel}>ACCURACY</AppText>
                        <AppText style={[styles.statValue, { color: '#047857' }]}>{formAccuracy}%</AppText>
                    </View>
                </View>

                {/* CONTROLS */}
                <View style={styles.controlsRow}>
                    {/* Left control removed as requested */}
                    <View style={{ width: 56 }} />

                    <TouchableOpacity style={styles.pauseButton} onPress={() => setPaused(!paused)}>
                        <Ionicons name={paused ? "play" : "pause"} size={20} color="#fff" style={{ marginRight: 8 }} />
                        <AppText variant="labelMd" style={{ color: '#fff', fontWeight: '700' }}>
                            {paused ? "RESUME" : "PAUSE"}
                        </AppText>
                    </TouchableOpacity>

                    {/* Right Button ONLY (Completes set / finishes) */}
                    <TouchableOpacity 
                        style={[styles.skipButton, { backgroundColor: '#10b981' }]} 
                        onPress={handleCompleteSet} 
                        disabled={isFinishing}
                    >
                        {isFinishing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="checkmark-done" size={24} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>

                {isResting && (
                    <View style={[styles.restOverlay, { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 100 }]}>
                        <View style={styles.restIconCircle}>
                            <Ionicons name="stopwatch-outline" size={36} color={colors.primary} />
                        </View>
                        
                        <AppText variant="labelMd" style={styles.restLabel}>RESTING PERIOD</AppText>
                        
                        <AppText variant="headlineXl" style={styles.restTimerDigits}>
                            {formatTime(restTimeLeft)}
                        </AppText>
                        
                        <AppText variant="bodySm" style={styles.restSubtext}>
                            Up Next: Set {currentSet + 1} of {totalSets}
                        </AppText>

                        <View style={styles.restActionRow}>
                            <TouchableOpacity 
                                style={styles.addTimeButton} 
                                onPress={() => setRestTimeLeft(p => p + 20)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add-outline" size={16} color="#fff" />
                                <AppText variant="labelSm" style={{ color: '#fff', fontWeight: '700' }}>20s</AppText>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.skipRestBtnPremium} 
                                onPress={() => setRestTimeLeft(0)}
                                activeOpacity={0.8}
                            >
                                <AppText variant="labelSm" style={{ color: '#fff', fontWeight: '700' }}>Skip Rest</AppText>
                                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // === SHARED ===
    grayLabel: {
        color: '#64748b',
        fontWeight: '700',
        letterSpacing: 0.5,
        fontSize: 10,
        marginBottom: spacing.xs,
    },
    exerciseName: {
        fontFamily: typography.headlineMd.fontFamily,
        fontSize: 28,
        fontWeight: '700',
        color: '#0f172a',
    },
    skipButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // === FULL SCREEN STYLES ===
    fsContainer: { flex: 1, backgroundColor: '#111827' },
    skeletonCenter: { position: 'absolute', top: '35%', left: 0, right: 0, alignItems: 'center' },
    poseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    poseBadgeLoading: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 0.5)' },
    poseBadgeError: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.5)' },
    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.gutter, paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.md },
    iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
    timerContainer: { alignItems: 'center', gap: 4 },
    fsLiveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 6 },
    fsLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
    timerText: { color: '#fff', fontVariant: ['tabular-nums'], letterSpacing: 1 },
    bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: spacing.xl * 2, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 20 },
    fsFeedbackCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 12,
        marginBottom: spacing.md,
        gap: 8,
    },
    fsFeedbackPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fsFeedbackDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    fsFeedbackText: {
        color: '#166534',
        fontWeight: '600',
        fontSize: 13,
        flex: 1,
    },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    repContainer: { flexDirection: 'row', alignItems: 'baseline' },
    repBig: { fontFamily: typography.headlineXl.fontFamily, fontSize: 36, fontWeight: '700', color: colors.primary },
    repSmall: { fontFamily: typography.bodyMd.fontFamily, fontSize: 18, color: '#64748b', fontWeight: '600' },
    progressContainer: { marginBottom: spacing.xl },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    accuracyValue: { color: '#10b981', fontWeight: '700' },
    progressBarTrack: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 5 },
    mediaControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xl },
    playPauseButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },

    // === NORMAL MODE STYLES ===
    safe: { flex: 1, backgroundColor: '#f8fafd' },
    normalTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
    logoText: { color: colors.primary, fontSize: 16, letterSpacing: 0.5, fontWeight: '700' },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
    scroll: { flex: 1 },
    content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
    videoContainer: { height: 380, borderRadius: 20, backgroundColor: '#1f2937', overflow: 'hidden', position: 'relative', justifyContent: 'space-between', padding: spacing.md },
    videoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 },
    badgeGroup: { flexDirection: 'row', gap: 8 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, gap: 6 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
    badgeText: { color: '#fff', fontWeight: '600' },
    trackingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, gap: 6 },
    expandButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    analysisCard: { backgroundColor: '#fff', borderRadius: 16, padding: spacing.md, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
    checkCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    analysisTextCol: { flex: 1 },
    analysisLabel: { color: '#047857', fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
    analysisText: { color: '#0f172a', fontWeight: '500' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
    setInfo: { fontFamily: typography.headlineMd.fontFamily, fontSize: 18, color: colors.primary },
    progressBarTrackNormal: { height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: spacing.sm },
    progressBarFillNormal: { height: '100%', backgroundColor: '#0f766e', borderRadius: 6 },
    repInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    repInfoText: { color: '#475569', fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: spacing.lg },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl },
    statIcon: { marginBottom: spacing.sm },
    statLabel: { color: '#475569', fontWeight: '700', fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },
    statValue: { fontFamily: typography.headlineXl.fontFamily, fontSize: 36, color: '#0f172a' },
    controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm },
    pauseButton: { flexDirection: 'row', height: 56, paddingHorizontal: spacing.xl, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    restOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(15, 23, 42, 0.96)', 
        zIndex: 100, 
        alignItems: 'center', 
        justifyContent: 'center',
    },
    restIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primary + '20',
        borderWidth: 1,
        borderColor: colors.primary + '40',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    restLabel: {
        color: '#94a3b8',
        letterSpacing: 2,
        fontWeight: '800',
        fontSize: 12,
    },
    restTimerDigits: {
        color: '#fff',
        fontSize: 56,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
        marginVertical: spacing.xs,
    },
    restSubtext: {
        color: '#64748b',
        fontWeight: '500',
        marginBottom: spacing.xl,
    },
    restActionRow: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'center',
    },
    addTimeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        gap: 4,
    },
    skipRestBtnPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 100,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
});

