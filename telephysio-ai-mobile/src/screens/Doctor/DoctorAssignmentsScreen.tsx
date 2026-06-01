/**
 * DoctorAssignmentsScreen — Create and edit reusable exercise templates.
 */

import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";

import { AppText } from "../../components/ui";
import { NotificationBell } from "../../components/NotificationBell";
import { colors, spacing } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type {
    DoctorStackParamList,
    DoctorTabParamList,
} from "../../navigation/types";
import {
    getExerciseTemplates,
    deleteExerciseTemplate,
} from "../../services/firebase";
import type { ExerciseTemplate } from "../../services/firebase/types";

type AssignmentsNavProp = CompositeNavigationProp<
    BottomTabNavigationProp<DoctorTabParamList, "Assignments">,
    NativeStackNavigationProp<DoctorStackParamList>
>;

export const DoctorAssignmentsScreen: React.FC = () => {
    const navigation = useNavigation<AssignmentsNavProp>();
    const { t } = useTranslation();
    const { uid } = useAuth();

    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const loadData = async () => {
        if (!uid) {
            setLoading(false);
            return;
        }
        try {
            const fetchedTemplates = await getExerciseTemplates(uid);
            setTemplates(fetchedTemplates);
        } catch (error) {
            console.error("Error loading templates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [uid]);

    // Refresh when screen is focused (after navigating back from editor)
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            if (uid) loadData();
        });
        return unsubscribe;
    }, [navigation, uid]);

    const handleDeleteTemplate = (tpl: ExerciseTemplate) => {
        const doDelete = async () => {
            try {
                await deleteExerciseTemplate(tpl.id);
                setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
                if (Platform.OS !== "web")
                    Alert.alert("Deleted", "Template deleted successfully.");
            } catch (error) {
                console.error("Error deleting template:", error);
                if (Platform.OS !== "web")
                    Alert.alert("Error", "Failed to delete template.");
            }
        };

        if (Platform.OS === "web") {
            // eslint-disable-next-line no-alert
            if (
                window.confirm(
                    `${t("doctor.assignments.deleteConfirmTitle")}: "${tpl.name}"?`,
                )
            ) {
                doDelete();
            }
        } else {
            Alert.alert(
                t("doctor.assignments.deleteConfirmTitle"),
                t("doctor.assignments.deleteConfirmMessage", {
                    name: tpl.name,
                }),
                [
                    { text: t("doctor.assignments.cancel"), style: "cancel" },
                    {
                        text: t("doctor.assignments.delete"),
                        style: "destructive",
                        onPress: doDelete,
                    },
                ],
            );
        }
    };

    const filteredTemplates = templates.filter((template) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;

        return (
            template.name.toLowerCase().includes(query) ||
            (template.description || "").toLowerCase().includes(query)
        );
    });

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
                {/* Header */}
                <View style={styles.header}>
                    <AppText variant="headlineLg" style={styles.pageTitle}>
                        {t("doctor.assignments.title")}
                    </AppText>
                    <AppText variant="bodyMd" style={styles.pageSubtitle}>
                        {t("doctor.assignments.subtitle")}
                    </AppText>
                </View>

                {loading ? (
                    <ActivityIndicator
                        size="large"
                        color={colors.primary}
                        style={{ marginTop: spacing.xl }}
                    />
                ) : (
                    <>
                        <View style={styles.toolbarRow}>
                            <View style={styles.searchBox}>
                                <Ionicons
                                    name="search-outline"
                                    size={18}
                                    color="#94a3b8"
                                />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder={t(
                                        "doctor.assignments.searchPlaceholder",
                                    )}
                                    placeholderTextColor="#94a3b8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoCapitalize="none"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => setSearchQuery("")}
                                        activeOpacity={0.75}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={18}
                                            color="#94a3b8"
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() =>
                                    navigation.navigate("TemplateEditor", {})
                                }
                                activeOpacity={0.85}
                            >
                                <Ionicons
                                    name="add"
                                    size={18}
                                    color={colors.onPrimary}
                                />
                                <AppText
                                    variant="labelMd"
                                    style={styles.createBtnTitle}
                                    numberOfLines={1}
                                >
                                    {t("doctor.assignments.createTemplate")}
                                </AppText>
                            </TouchableOpacity>
                        </View>

                        {/* Template Cards */}
                        {filteredTemplates.length > 0 ? (
                            filteredTemplates.map((tpl) => {
                                const exerciseCount =
                                    tpl.exercises?.length || 0;
                                const patientCount = tpl.patientCount || 0;
                                const duration = tpl.totalDuration || "0 min";

                                return (
                                    <View key={tpl.id} style={styles.card}>
                                        <TouchableOpacity
                                            style={styles.cardPressArea}
                                            onPress={() =>
                                                navigation.navigate(
                                                    "TemplateEditor",
                                                    { templateId: tpl.id },
                                                )
                                            }
                                            activeOpacity={0.85}
                                        >
                                            <View style={styles.cardTopRow}>
                                                <View
                                                    style={styles.templateIcon}
                                                >
                                                    <Ionicons
                                                        name="barbell-outline"
                                                        size={24}
                                                        color={colors.primary}
                                                    />
                                                </View>
                                                <View
                                                    style={styles.templateInfo}
                                                >
                                                    <AppText
                                                        variant="labelMd"
                                                        style={
                                                            styles.templateName
                                                        }
                                                        numberOfLines={2}
                                                    >
                                                        {tpl.name}
                                                    </AppText>
                                                    <View
                                                        style={
                                                            styles.templateStats
                                                        }
                                                    >
                                                        <View
                                                            style={
                                                                styles.templateStatItem
                                                            }
                                                        >
                                                            <Ionicons
                                                                name="fitness-outline"
                                                                size={13}
                                                                color="#0f766e"
                                                            />
                                                            <AppText
                                                                variant="labelSm"
                                                                style={
                                                                    styles.templateStatText
                                                                }
                                                                numberOfLines={
                                                                    1
                                                                }
                                                            >
                                                                {t(
                                                                    "doctor.assignments.exercisesCount",
                                                                    {
                                                                        count: exerciseCount,
                                                                    },
                                                                )}
                                                            </AppText>
                                                        </View>
                                                        <View
                                                            style={
                                                                styles.templateStatItem
                                                            }
                                                        >
                                                            <Ionicons
                                                                name="time-outline"
                                                                size={13}
                                                                color="#c2410c"
                                                            />
                                                            <AppText
                                                                variant="labelSm"
                                                                style={
                                                                    styles.templateStatText
                                                                }
                                                                numberOfLines={
                                                                    1
                                                                }
                                                            >
                                                                {duration}
                                                            </AppText>
                                                        </View>
                                                        <View
                                                            style={
                                                                styles.templateStatItem
                                                            }
                                                        >
                                                            <Ionicons
                                                                name="people-outline"
                                                                size={13}
                                                                color="#2563eb"
                                                            />
                                                            <AppText
                                                                variant="labelSm"
                                                                style={
                                                                    styles.templateStatText
                                                                }
                                                                numberOfLines={
                                                                    1
                                                                }
                                                            >
                                                                {t(
                                                                    "doctor.assignments.patientsCount",
                                                                    {
                                                                        count: patientCount,
                                                                    },
                                                                )}
                                                            </AppText>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteCornerBtn}
                                            onPress={() =>
                                                handleDeleteTemplate(tpl)
                                            }
                                            activeOpacity={0.85}
                                        >
                                            <Ionicons
                                                name="trash-outline"
                                                size={17}
                                                color="#ef4444"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        ) : (
                            <AppText
                                variant="bodyMd"
                                style={{
                                    color: "#64748b",
                                    padding: spacing.md,
                                    textAlign: "center",
                                }}
                            >
                                {templates.length > 0
                                    ? t("doctor.assignments.noTemplatesMatch")
                                    : t("doctor.assignments.noTemplates")}
                            </AppText>
                        )}
                    </>
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

    header: { marginBottom: spacing.xs },
    pageTitle: {
        color: colors.primary,
        fontWeight: "800",
        fontSize: 24,
        marginBottom: 4,
    },
    pageSubtitle: { color: "#64748b" },

    toolbarRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    searchBox: {
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#dbe7f3",
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 46,
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        fontSize: 14,
        color: "#0f172a",
    },
    createBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderColor: "#0b5aa3",
        borderRadius: 16,
        paddingHorizontal: 10,
        height: 46,
        width: 176,
        flexShrink: 0,
    },
    createBtnTitle: {
        color: colors.onPrimary,
        fontWeight: "800",
        fontSize: 12,
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#dbe7f3",
        position: "relative",
    },
    cardPressArea: {
        paddingHorizontal: 22,
        paddingVertical: 26,
        paddingRight: 48,
    },
    cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    templateIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#eef6ff",
        borderWidth: 1,
        borderColor: "#bfdbfe",
    },
    templateInfo: { flex: 1 },
    templateName: {
        color: "#0f172a",
        fontWeight: "800",
        fontSize: 15,
        marginBottom: 7,
    },
    templateStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    templateStatItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        flexShrink: 1,
    },
    templateStatText: { color: "#64748b", fontWeight: "700", fontSize: 11 },
    deleteCornerBtn: {
        position: "absolute",
        top: 20,
        right: 12,
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff1f2",
        borderWidth: 1,
        borderColor: "#fecdd3",
    },
});
