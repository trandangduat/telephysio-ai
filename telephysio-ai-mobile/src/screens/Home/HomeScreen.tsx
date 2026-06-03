/**
 * HomeScreen - Màn hình chính được thiết kế lại (Clinical Vitality).
 * Màn hình này hiển thị tổng quan về kế hoạch điều trị, tiến độ và các bài tập hàng ngày của bệnh nhân.
 */

import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { AppText } from "../../components/ui";
import { colors, spacing, typography } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type {
    RootStackParamList,
    BottomTabParamList,
} from "../../navigation/types";
import {
    getActiveTreatmentPlan,
    getLatestProgress,
    getPatientAssignments,
} from "../../services/firebase";
import type {
    TreatmentPlan,
    ProgressSnapshot,
    Assignment,
    IncompleteSession,
} from "../../services/firebase/types";
import { getIncompleteSession } from "../../services/firebase";
import { NotificationBell } from "../../components/NotificationBell";
import { useTranslation } from "react-i18next";

type HomeNavProp = CompositeNavigationProp<
    BottomTabNavigationProp<BottomTabParamList, "Home">,
    NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
    navigation: HomeNavProp;
}

/**
 * Thành phần (Component) đại diện cho màn hình chính của ứng dụng.
 * 
 * @param {Props} props Các thuộc tính của thành phần.
 * @returns {JSX.Element} Giao diện người dùng của màn hình chính.
 */
export const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const { userName, uid } = useAuth();

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<TreatmentPlan | null>(null);
    const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(
        null,
    );
    const [incompleteSession, setIncompleteSession] =
        useState<IncompleteSession | null>(null);
    const [progress, setProgress] = useState<ProgressSnapshot | null>(null);

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation, uid]);

    async function loadData() {
        if (!uid) {
            setLoading(false);
            return;
        }
        try {
            const [fetchedPlan, fetchedProgress, assignments] =
                await Promise.all([
                    getActiveTreatmentPlan(uid),
                    getLatestProgress(uid),
                    getPatientAssignments(uid, "active"),
                ]);
            setPlan(fetchedPlan);
            setProgress(fetchedProgress);
            if (assignments && assignments.length > 0) {
                setActiveAssignment(assignments[0]);
                const incSession = await getIncompleteSession(
                    uid,
                    assignments[0].id,
                );
                setIncompleteSession(incSession);
            } else {
                setActiveAssignment(null);
                setIncompleteSession(null);
            }
        } catch (error) {
            console.error("Error loading home data:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [uid]);

    if (loading) {
        return (
            <SafeAreaView
                style={[
                    styles.safe,
                    { justifyContent: "center", alignItems: "center" },
                ]}
            >
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    const protocolTitle =
        activeAssignment?.templateName ||
        plan?.condition ||
        t("home.noActiveProtocol");
    const protocolSubtitle = activeAssignment
        ? t("home.setsReps", {
              sets: activeAssignment.exercises.length,
              reps: activeAssignment.totalDuration || "0 min",
          })
        : plan
          ? `Phase ${plan.currentPhase}, Week ${plan.currentWeek}`
          : t("home.contactDoctor");

    const movementScore = progress?.movementScore || 0;
    const timeActive = progress?.timeActiveMinutes || 0;
    const dailyGoalPercent = progress?.dailyGoalPercent || 0;
    const sessionsCompleted = progress?.sessionsCompleted || 0;
    const sessionsTarget = progress?.sessionsTarget || 3;
    const aiInsight = progress?.aiInsight || t("progress.aiInsight");

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Thanh điều hướng trên cùng thống nhất */}
            <View style={styles.topBar}>
                <View style={styles.logoRow}>
                    <Ionicons name="medical" size={20} color={colors.primary} />
                    <AppText variant="labelMd" style={styles.logoText}>
                        TelePhysioAI
                    </AppText>
                </View>
                <View style={styles.topBarIcons}>
                    <NotificationBell />
                    <TouchableOpacity
                        style={styles.avatarBtn}
                        onPress={() => navigation.navigate("Profile" as any)}
                    >
                        <Ionicons name="person" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Lời chào ở phần đầu */}
                <View style={styles.header}>
                    <AppText variant="headlineXl" style={styles.greetingTitle}>
                        {t("home.goodMorning", { name: userName || "there" })}
                    </AppText>
                    <AppText
                        variant="bodySm"
                        color={colors.onSurfaceVariant}
                        style={styles.greetingSubtitle}
                    >
                        {t("home.dailyOverview")}
                    </AppText>
                </View>

                {/* Thẻ bài tập nổi bật */}
                <View style={styles.heroCard}>
                    <View style={styles.heroCardContent}>
                        <View style={styles.heroLeftCol}>
                            <View style={styles.heroTag}>
                                <Ionicons
                                    name="flash"
                                    size={12}
                                    color={colors.primary}
                                />
                                <AppText
                                    variant="labelSm"
                                    style={styles.heroTagText}
                                >
                                    {t("home.todaysPlan")}
                                </AppText>
                            </View>
                            <AppText
                                variant="headlineMd"
                                style={styles.heroTitle}
                                numberOfLines={2}
                            >
                                {activeAssignment
                                    ? activeAssignment.templateName
                                    : t("home.restDay")}
                            </AppText>

                            <View style={styles.heroMeta}>
                                {activeAssignment ? (
                                    <>
                                        <View style={styles.heroMetaItem}>
                                            <Ionicons
                                                name="barbell-outline"
                                                size={14}
                                                color="#64748b"
                                            />
                                            <AppText
                                                variant="bodySm"
                                                style={styles.heroMetaText}
                                            >
                                                {
                                                    activeAssignment.exercises
                                                        .length
                                                }{" "}
                                                {t("common.sets")}
                                            </AppText>
                                        </View>
                                        <View style={styles.heroMetaItem}>
                                            <Ionicons
                                                name="time-outline"
                                                size={14}
                                                color="#64748b"
                                            />
                                            <AppText
                                                variant="bodySm"
                                                style={styles.heroMetaText}
                                            >
                                                {activeAssignment.totalDuration}
                                            </AppText>
                                        </View>
                                    </>
                                ) : (
                                    <AppText
                                        variant="bodySm"
                                        style={{ color: "#64748b" }}
                                    >
                                        {t("home.noRoutine")}
                                    </AppText>
                                )}
                            </View>
                        </View>

                        <View style={styles.heroRightCol}>
                            {activeAssignment ? (
                                <TouchableOpacity
                                    style={styles.heroPlayButton}
                                    activeOpacity={0.8}
                                    onPress={() =>
                                        navigation.navigate("Workout")
                                    }
                                >
                                    <Ionicons
                                        name={
                                            incompleteSession
                                                ? "play-forward"
                                                : "play"
                                        }
                                        size={28}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.heroRestIcon}>
                                    <Ionicons
                                        name="cafe"
                                        size={28}
                                        color="#94a3b8"
                                    />
                                </View>
                            )}
                        </View>
                    </View>

                    {activeAssignment && (
                        <TouchableOpacity
                            style={styles.heroFooter}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate("Workout")}
                        >
                            <AppText
                                variant="labelSm"
                                style={styles.heroFooterText}
                            >
                                {incompleteSession
                                    ? t("home.inProgressTap")
                                    : t("home.readyTap")}
                            </AppText>
                            <Ionicons
                                name="chevron-forward"
                                size={14}
                                color={colors.primary}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#f8fafd",
    },
    scroll: {
        flex: 1,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.gutter,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    devSwitch: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#ccfbf1",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    logoText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
    topBarIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconBtn: { padding: 4 },
    avatarBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        padding: spacing.gutter,
        gap: spacing.lg,
        paddingBottom: spacing.xl * 2,
    },
    header: {
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    greetingTitle: {
        fontFamily: typography.headlineXl.fontFamily,
        fontSize: 32,
        fontWeight: "700",
        color: "#0f172a",
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    greetingSubtitle: {
        fontSize: 15,
        color: "#64748b",
    },
    heroCard: {
        backgroundColor: "#ffffff",
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 4,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        overflow: "hidden",
    },
    heroCardContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: spacing.xl,
    },
    heroLeftCol: {
        flex: 1,
        paddingRight: spacing.md,
    },
    heroRightCol: {
        justifyContent: "center",
        alignItems: "center",
    },
    heroTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eff6ff",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
        marginBottom: spacing.sm,
        gap: 4,
    },
    heroTagText: {
        color: colors.primary,
        fontWeight: "700",
        letterSpacing: 0.5,
        fontSize: 11,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#0f172a",
        letterSpacing: -0.3,
        marginBottom: spacing.md,
    },
    heroMeta: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
    },
    heroMetaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    heroMetaText: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "500",
    },
    heroPlayButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    heroRestIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
    },
    heroFooter: {
        backgroundColor: "#fafafa",
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingVertical: 12,
        paddingHorizontal: spacing.xl,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    heroFooterText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
    },
});
