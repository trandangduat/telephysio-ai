/**
 * DoctorDashboardScreen — Màn hình Bảng điều khiển dành cho Bác sĩ.
 * Hiển thị danh sách bệnh nhân cùng với trạng thái hoàn thành bài tập trong ngày.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { AppText } from "../../components/ui";
import { colors, spacing, typography } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type {
    DoctorStackParamList,
    DoctorTabParamList,
} from "../../navigation/types";
import { useTranslation } from "react-i18next";
import { getUser, getDoctorAssignments } from "../../services/firebase";
import type { UserProfile, Assignment } from "../../services/firebase/types";
import { NotificationBell } from "../../components/NotificationBell";

type DashboardNavProp = CompositeNavigationProp<
    BottomTabNavigationProp<DoctorTabParamList, "Dashboard">,
    NativeStackNavigationProp<DoctorStackParamList>
>;

interface PatientCard {
    profile: UserProfile;
    assignments: Assignment[];
    todayCompleted: number;
    todayTotal: number;
}

/**
 * Component Màn hình chính của Bác sĩ (DoctorDashboardScreen).
 * Lấy danh sách các bệnh nhân đang được bác sĩ quản lý và trạng thái luyện tập của họ.
 * 
 * @return React.FC Component DoctorDashboardScreen
 */
export const DoctorDashboardScreen: React.FC = () => {
    const navigation = useNavigation<DashboardNavProp>();
    const { userName, uid } = useAuth();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [patients, setPatients] = useState<PatientCard[]>([]);

    const loadData = useCallback(async () => {
        if (!uid) {
            setLoading(false);
            return;
        }
        try {
            // Derive patients from assignments (not treatment_plans)
            // so any newly-assigned patient shows up immediately
            const allAssignments = await getDoctorAssignments(uid);
            const uniquePatientIds = [
                ...new Set(allAssignments.map((a) => a.patientId)),
            ];

            // Fetch profiles for all those patient IDs in parallel
            const profiles = await Promise.all(
                uniquePatientIds.map((id) => getUser(id)),
            );
            const validProfiles = profiles.filter(Boolean) as UserProfile[];

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const cards: PatientCard[] = validProfiles.map((profile) => {
                const patientAssignments = allAssignments.filter(
                    (a) => a.patientId === profile.uid,
                );
                const todayAssignments = patientAssignments.filter((a) => {
                    const at = (
                        (a.scheduledDate ?? a.assignedAt) as any
                    )?.toDate?.();
                    return at && at >= today && at < tomorrow;
                });
                const completed = todayAssignments.filter(
                    (a) => a.status === "completed",
                ).length;
                return {
                    profile,
                    assignments: patientAssignments,
                    todayCompleted: completed,
                    todayTotal: todayAssignments.length,
                };
            });
            // Sort: patients with today's tasks first, then alphabetically
            cards.sort((a, b) => {
                if (b.todayTotal !== a.todayTotal)
                    return b.todayTotal - a.todayTotal;
                return (a.profile.displayName || "").localeCompare(
                    b.profile.displayName || "",
                );
            });
            setPatients(cards);
        } catch (e) {
            console.error("Dashboard load error:", e);
        } finally {
            setLoading(false);
        }
    }, [uid]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData]),
    );

    const openPatientDetail = (card: PatientCard) => {
        navigation.navigate("PatientDetail", {
            patientId: card.profile.uid,
            patientName:
                card.profile.displayName || card.profile.email || "Patient",
        });
    };

    const filtered = (() => {
        const raw = searchText.trim();
        if (!raw) return patients;
        // Split query into tokens so "nguyen lta" matches both independently
        const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);
        return patients.filter((p) => {
            const email = (p.profile.email || "").toLowerCase();
            const name = (p.profile.displayName || "").toLowerCase();
            // Also search inside assignment template names
            const templateNames = p.assignments
                .map((a) => (a.templateName || "").toLowerCase())
                .join(" ");
            // Email prefix (before @) for quick typing
            const emailLocal = email.split("@")[0];
            return tokens.every(
                (token) =>
                    email.includes(token) ||
                    name.includes(token) ||
                    emailLocal.includes(token) ||
                    templateNames.includes(token),
            );
        });
    })();

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return t("doctor.dashboard.goodMorning");
        if (h < 18) return t("doctor.dashboard.goodAfternoon");
        return t("doctor.dashboard.goodEvening");
    };

    const getStatusColor = (card: PatientCard) => {
        if (card.todayTotal === 0) return "#94a3b8";
        if (card.todayCompleted === card.todayTotal) return "#10b981";
        if (card.todayCompleted > 0) return "#f59e0b";
        return "#ef4444";
    };

    const getStatusLabel = (card: PatientCard) => {
        if (card.todayTotal === 0) return t("doctor.dashboard.noTasksToday");
        if (card.todayCompleted === card.todayTotal)
            return t("doctor.dashboard.allDone");
        if (card.todayCompleted > 0)
            return t("doctor.dashboard.tasksDone", {
                completed: card.todayCompleted,
                total: card.todayTotal,
            });
        return t("doctor.dashboard.notStarted");
    };

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

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <View style={styles.logoRow}>
                    <Ionicons name="medical" size={20} color={colors.primary} />
                    <AppText variant="labelMd" style={styles.logoText}>
                        TelePhysioAI
                    </AppText>
                    <View style={styles.roleBadge}>
                        <AppText
                            variant="labelSm"
                            style={{
                                color: "#fff",
                                fontWeight: "700",
                                fontSize: 9,
                            }}
                        >
                            {t("doctor.doctorRole")}
                        </AppText>
                    </View>
                </View>
                <View style={styles.topBarIcons}>
                    <NotificationBell />
                    <TouchableOpacity
                        style={styles.avatarBtn}
                        onPress={() => navigation.navigate("DoctorProfile")}
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
                <View style={styles.header}>
                    <AppText variant="bodySm" style={styles.greeting}>
                        {getGreeting()}
                    </AppText>
                    <AppText
                        variant="headlineLg"
                        style={styles.doctorName}
                        numberOfLines={1}
                    >
                        {userName}
                    </AppText>
                </View>

                {/* Search */}
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t("doctor.searchPlaceholder")}
                        placeholderTextColor="#94a3b8"
                        value={searchText}
                        onChangeText={setSearchText}
                        autoCapitalize="none"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText("")}>
                            <Ionicons
                                name="close-circle"
                                size={18}
                                color="#94a3b8"
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <AppText variant="headlineMd" style={styles.sectionTitle}>
                        {t("doctor.dashboard.myPatients")}
                    </AppText>
                    <View style={styles.countBadge}>
                        <AppText
                            variant="labelSm"
                            style={{ color: colors.primary }}
                        >
                            {filtered.length}
                        </AppText>
                    </View>
                </View>

                {/* Patient Cards */}
                {filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons
                            name="people-outline"
                            size={48}
                            color="#cbd5e1"
                        />
                        <AppText
                            variant="bodyMd"
                            style={{ color: "#94a3b8", marginTop: 12 }}
                        >
                            {searchText
                                ? t("doctor.dashboard.noPatientsMatch")
                                : t("doctor.dashboard.noPatientsAssigned")}
                        </AppText>
                    </View>
                ) : (
                    filtered.map((card) => {
                        const statusColor = getStatusColor(card);
                        const cardCompletionRate =
                            card.todayTotal > 0
                                ? card.todayCompleted / card.todayTotal
                                : 0;

                        return (
                            <TouchableOpacity
                                key={card.profile.uid}
                                style={styles.patientCard}
                                onPress={() => openPatientDetail(card)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.patientTopRow}>
                                    <View style={styles.cardLeft}>
                                        <View style={styles.avatarCircle}>
                                            <AppText
                                                style={styles.avatarInitial}
                                            >
                                                {(card.profile.displayName ||
                                                    card.profile.email ||
                                                    "?")[0].toUpperCase()}
                                            </AppText>
                                        </View>
                                        <View style={styles.patientInfo}>
                                            <AppText
                                                variant="labelMd"
                                                style={styles.patientName}
                                                numberOfLines={1}
                                            >
                                                {card.profile.displayName ||
                                                    card.profile.email}
                                            </AppText>
                                            <AppText
                                                variant="bodySm"
                                                style={styles.patientEmail}
                                                numberOfLines={1}
                                            >
                                                {card.profile.email}
                                            </AppText>
                                        </View>
                                    </View>

                                    <View style={styles.cardRight}>
                                        <View
                                            style={[
                                                styles.statusPill,
                                                {
                                                    backgroundColor: `${statusColor}1F`,
                                                },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.statusDot,
                                                    {
                                                        backgroundColor:
                                                            statusColor,
                                                    },
                                                ]}
                                            />
                                            <AppText
                                                variant="labelSm"
                                                style={[
                                                    styles.statusText,
                                                    { color: statusColor },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {getStatusLabel(card)}
                                            </AppText>
                                        </View>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={18}
                                            color="#cbd5e1"
                                        />
                                    </View>
                                </View>

                                <View style={styles.patientMetaRow}>
                                    <View style={styles.metaChip}>
                                        <Ionicons
                                            name="clipboard-outline"
                                            size={13}
                                            color="#64748b"
                                        />
                                        <AppText
                                            variant="labelSm"
                                            style={styles.metaChipText}
                                        >
                                            {t("doctor.dashboard.assignments", {
                                                count: card.assignments.length,
                                            })}
                                        </AppText>
                                    </View>
                                    <View style={styles.metaChip}>
                                        <Ionicons
                                            name="calendar-outline"
                                            size={13}
                                            color="#64748b"
                                        />
                                        <AppText
                                            variant="labelSm"
                                            style={styles.metaChipText}
                                        >
                                            {t(
                                                "doctor.dashboard.todayTasksCount",
                                                { count: card.todayTotal },
                                            )}
                                        </AppText>
                                    </View>
                                </View>

                                {card.todayTotal > 0 && (
                                    <View style={styles.patientProgressTrack}>
                                        <View
                                            style={[
                                                styles.patientProgressFill,
                                                {
                                                    width: `${cardCompletionRate * 100}%`,
                                                    backgroundColor:
                                                        statusColor,
                                                },
                                            ]}
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f8fafd" },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.gutter,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    logoText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
    roleBadge: {
        backgroundColor: "#0f766e",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    topBarIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatarBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#0f766e",
        alignItems: "center",
        justifyContent: "center",
    },

    scroll: { flex: 1 },
    content: {
        padding: spacing.gutter,
        gap: spacing.md,
        paddingBottom: spacing.xl * 2,
    },

    header: { gap: 2, paddingTop: spacing.xs },
    greeting: { color: "#64748b", fontWeight: "600" },
    doctorName: {
        color: colors.onSurface,
        fontWeight: "800",
        fontSize: 27,
        marginTop: 2,
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#fff",
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        boxShadow: "0 1px 4px rgba(0,93,182,0.06)",
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: "#0f172a",
        fontFamily: typography.bodyMd.fontFamily,
    },

    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    sectionTitle: { color: "#0f172a", fontWeight: "700", fontSize: 18 },
    countBadge: {
        backgroundColor: "#e0f2fe",
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 100,
    },

    emptyState: { alignItems: "center", paddingVertical: 48 },

    patientCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: "#dbe7f3",
        gap: spacing.sm,
        boxShadow: "0 2px 8px rgba(0,93,182,0.06)",
    },
    patientTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    cardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
    avatarCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#dbeafe",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#bfdbfe",
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: "800",
        color: colors.primary,
        fontFamily: typography.headlineMd.fontFamily,
    },
    patientInfo: { flex: 1, minWidth: 0, gap: 2 },
    patientName: { color: "#0f172a", fontWeight: "700", fontSize: 15 },
    patientEmail: { color: "#64748b", fontSize: 12 },
    cardRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        maxWidth: 205,
        flexShrink: 0,
    },
    statusPill: {
        flexShrink: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 100,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: "800" },
    patientMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        paddingLeft: 58,
    },
    metaChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },
    metaChipText: { color: "#64748b", fontWeight: "700" },
    patientProgressTrack: {
        height: 5,
        marginLeft: 58,
        borderRadius: 999,
        backgroundColor: "#f1f5f9",
        overflow: "hidden",
    },
    patientProgressFill: { height: "100%", borderRadius: 999 },
});
