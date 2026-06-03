/**
 * @file ProfileScreen.tsx
 * @description Màn hình hồ sơ cá nhân và cài đặt tài khoản người dùng.
 * Cho phép xem thông tin cá nhân, chỉnh sửa hồ sơ, cài đặt giao diện, ngôn ngữ và đăng xuất.
 */
import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type { RootStackParamList } from "../../navigation/types";
import { updateUserProfile } from "../../services/firebase";

/**
 * Màn hình hồ sơ người dùng.
 * Hiển thị avatar, tên, vai trò, thông tin cá nhân và các mục cài đặt (giao diện, ngôn ngữ).
 * Hỗ trợ chỉnh sửa thông tin qua modal và đăng xuất tài khoản.
 *
 * @return Component JSX màn hình ProfileScreen.
 */
export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { t, i18n } = useTranslation();
    const { user, userName, uid, role, logout, setUser } = useAuth();

    const [isDark, setIsDark] = useState(false);

    // Trạng thái modal chỉnh sửa
    const [editModal, setEditModal] = useState(false);
    const [editName, setEditName] = useState(userName || "");
    const [editPhone, setEditPhone] = useState((user as any)?.phone || "");
    const [editDOB, setEditDOB] = useState((user as any)?.dateOfBirth || "");
    const [saving, setSaving] = useState(false);

    // Đồng bộ khi user/userName thay đổi
    useEffect(() => {
        setEditName(userName || "");
        setEditPhone((user as any)?.phone || "");
        setEditDOB((user as any)?.dateOfBirth || "");
    }, [userName, user]);

    /**
   * Chuyển đổi ngôn ngữ hiển thị giữa tiếng Việt và tiếng Anh.
   * Sử dụng i18n của react-i18next để thay đổi ngôn ngữ toàn ứng dụng.
   */
    const toggleLanguage = () => {
        const nextLang = i18n.language === "vi" ? "en" : "vi";
        i18n.changeLanguage(nextLang);
    };

    /**
   * Lưu thông tin hồ sơ người dùng lên Firebase.
   * Validate tên hiển thị trước khi gọi API cập nhật.
   * Cập nhật state của AuthContext ngay lập tức sau khi lưu thành công.
   */
    const handleSaveProfile = async () => {
        if (!uid) return;
        if (!editName.trim()) {
            Alert.alert("Error", "Display name cannot be empty.");
            return;
        }
        setSaving(true);
        try {
            const updates = {
                displayName: editName.trim(),
                phone: editPhone.trim(),
                dateOfBirth: editDOB.trim(),
            };
            await updateUserProfile(uid, updates);
            // Cập nhật AuthContext ngay lập tức để màn hình phản ánh các thay đổi
            if (user) {
                setUser({ ...user, ...updates });
            }
            setEditModal(false);
        } catch (e) {
            console.error("Profile save error:", e);
            Alert.alert("Error", "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    // Giao diện (Theme)
    const bgTheme = isDark ? "#0f172a" : "#f8fafd";
    const cardTheme = isDark ? "#1e293b" : "#fff";
    const textTheme = isDark ? "#f8fafc" : "#0f172a";
    const textSub = isDark ? "#94a3b8" : "#64748b";
    const borderColor = isDark ? "#334155" : "#e2e8f0";
    const inputBg = isDark ? "#0f172a" : "#f8fafc";

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bgTheme }]} edges={["top"]}>
            {/* Nav */}
            <View style={[styles.navBar, { backgroundColor: bgTheme }]}>
                <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <AppText variant="headlineMd" style={[styles.navTitle, { color: textTheme }]}>
          Profile & Settings
                </AppText>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatarLarge, { backgroundColor: isDark ? "#334155" : "#dbeafe" }]}>
                            <AppText style={{ fontSize: 40, fontWeight: "800", color: colors.primary }}>
                                {(userName || "U")[0].toUpperCase()}
                            </AppText>
                        </View>
                        <TouchableOpacity
                            style={[styles.editAvatarBtn, { borderColor: bgTheme }]}
                            onPress={() => setEditModal(true)}
                        >
                            <Ionicons name="pencil" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <AppText variant="headlineMd" style={[styles.profileName, { color: textTheme }]}>
                        {userName || "User"}
                    </AppText>
                    <View style={styles.badgeRow}>
                        <View style={styles.roleBadge}>
                            <Ionicons
                                name={role === "doctor" ? "medical-outline" : "person-outline"}
                                size={12}
                                color="#fff"
                            />
                            <AppText variant="labelSm" style={{ color: "#fff", fontWeight: "700" }}>
                                {role === "doctor" ? "Doctor" : "Patient"}
                            </AppText>
                        </View>
                    </View>
                </View>

                {/* ─── Personal Information ─── */}
                <View style={[styles.card, { backgroundColor: cardTheme, borderColor }]}>
                    <View style={styles.cardHeader}>
                        <AppText variant="labelMd" style={[styles.cardTitle, { color: textTheme }]}>
              Personal Information
                        </AppText>
                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => setEditModal(true)}
                        >
                            <Ionicons name="pencil" size={14} color={colors.primary} />
                            <AppText variant="labelSm" style={{ color: colors.primary, fontWeight: "600" }}>
                Edit
                            </AppText>
                        </TouchableOpacity>
                    </View>

                    {/* Email — read-only */}
                    <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
                        <View style={[styles.infoIcon, { backgroundColor: "#dbeafe" }]}>
                            <Ionicons name="mail-outline" size={16} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText variant="bodySm" style={{ color: textSub, marginBottom: 2 }}>Email</AppText>
                            <AppText variant="bodyMd" style={{ color: textTheme, fontWeight: "500" }}>
                                {user?.email || "N/A"}
                            </AppText>
                        </View>
                        <View style={styles.lockedBadge}>
                            <Ionicons name="lock-closed" size={11} color="#94a3b8" />
                        </View>
                    </View>

                    {/* Phone */}
                    <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
                        <View style={[styles.infoIcon, { backgroundColor: "#dcfce7" }]}>
                            <Ionicons name="call-outline" size={16} color="#16a34a" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText variant="bodySm" style={{ color: textSub, marginBottom: 2 }}>Phone</AppText>
                            <AppText variant="bodyMd" style={{ color: textTheme, fontWeight: "500" }}>
                                {(user as any)?.phone || "Not set"}
                            </AppText>
                        </View>
                    </View>

                    {/* Date of Birth */}
                    <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                        <View style={[styles.infoIcon, { backgroundColor: "#fef3c7" }]}>
                            <Ionicons name="calendar-outline" size={16} color="#d97706" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText variant="bodySm" style={{ color: textSub, marginBottom: 2 }}>Date of Birth</AppText>
                            <AppText variant="bodyMd" style={{ color: textTheme, fontWeight: "500" }}>
                                {(user as any)?.dateOfBirth || "Not set"}
                            </AppText>
                        </View>
                    </View>
                </View>

                {/* ─── Settings ─── */}
                <View style={[styles.card, { backgroundColor: cardTheme, borderColor }]}>
                    <AppText variant="labelMd" style={[styles.cardTitle, { color: textTheme, marginBottom: spacing.sm }]}>
            Settings
                    </AppText>

                    {/* Appearance */}
                    <TouchableOpacity
                        style={[styles.settingRow, { borderBottomColor: borderColor }]}
                        onPress={() => setIsDark(!isDark)}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: isDark ? "#1e3a5f" : "#e0f2fe" }]}>
                            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={18} color={isDark ? "#38bdf8" : "#0284c7"} />
                        </View>
                        <AppText variant="bodyMd" style={[styles.settingLabel, { color: textTheme }]}>
              Appearance
                        </AppText>
                        <View style={[styles.settingValuePill, { backgroundColor: isDark ? "#334155" : "#f1f5f9" }]}>
                            <AppText variant="labelSm" style={{ color: textSub, fontSize: 12 }}>
                                {isDark ? "Dark" : "Light"}
                            </AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={borderColor} />
                    </TouchableOpacity>

                    {/* Language */}
                    <TouchableOpacity
                        style={[styles.settingRow, { borderBottomWidth: 0 }]}
                        onPress={toggleLanguage}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: "#f0fdf4" }]}>
                            <Ionicons name="globe-outline" size={18} color="#16a34a" />
                        </View>
                        <AppText variant="bodyMd" style={[styles.settingLabel, { color: textTheme }]}>
              Language
                        </AppText>
                        <View style={[styles.settingValuePill, { backgroundColor: isDark ? "#334155" : "#f1f5f9" }]}>
                            <AppText variant="labelSm" style={{ color: textSub, fontSize: 12 }}>
                                {i18n.language === "vi" ? "Tiếng Việt" : "English"}
                            </AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={borderColor} />
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => {
                        /**
                         * Thực hiện đăng xuất tài khoản
                         * @returns Không có giá trị trả về
                         */
                        const doLogout = () => logout();
                        if (Platform.OS === "web") {
                            if (window.confirm("Are you sure you want to log out?")) doLogout();
                        } else {
                            Alert.alert("Log Out", "Are you sure you want to log out?", [
                                { text: "Cancel", style: "cancel" },
                                { text: "Log Out", style: "destructive", onPress: doLogout },
                            ]);
                        }
                    }}
                >
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    <AppText variant="labelMd" style={styles.logoutText}>Log Out</AppText>
                </TouchableOpacity>
            </ScrollView>

            {/* ─── Edit Profile Modal ─── */}
            <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModal(false)}>
                <SafeAreaView style={[styles.modalSafe, { backgroundColor: bgTheme }]} edges={["top"]}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                        {/* Modal Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: borderColor, backgroundColor: cardTheme }]}>
                            <TouchableOpacity onPress={() => setEditModal(false)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={22} color={textSub} />
                            </TouchableOpacity>
                            <AppText variant="headlineMd" style={{ fontWeight: "700", color: textTheme, fontSize: 17 }}>
                Edit Profile
                            </AppText>
                            <TouchableOpacity
                                onPress={handleSaveProfile}
                                disabled={saving}
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            >
                                {saving
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <AppText variant="labelMd" style={{ color: "#fff", fontWeight: "700" }}>Save</AppText>
                                }
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: bgTheme }]} showsVerticalScrollIndicator={false}>
                            {/* Email — display-only */}
                            <View style={styles.fieldGroup}>
                                <View style={styles.fieldLabelRow}>
                                    <AppText variant="labelSm" style={[styles.fieldLabel, { color: textSub }]}>EMAIL</AppText>
                                    <View style={styles.lockedBadge}>
                                        <Ionicons name="lock-closed" size={11} color="#94a3b8" />
                                        <AppText style={{ fontSize: 10, color: "#94a3b8", marginLeft: 3 }}>Read-only</AppText>
                                    </View>
                                </View>
                                <View style={[styles.fieldInput, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor }]}>
                                    <AppText style={{ color: textSub, fontSize: 15 }}>{user?.email || "—"}</AppText>
                                </View>
                            </View>

                            {/* Display Name */}
                            <View style={styles.fieldGroup}>
                                <AppText variant="labelSm" style={[styles.fieldLabel, { color: textSub }]}>DISPLAY NAME</AppText>
                                <TextInput
                                    style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textTheme }]}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Your name"
                                    placeholderTextColor={textSub}
                                />
                            </View>

                            {/* Phone */}
                            <View style={styles.fieldGroup}>
                                <AppText variant="labelSm" style={[styles.fieldLabel, { color: textSub }]}>PHONE NUMBER</AppText>
                                <TextInput
                                    style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textTheme }]}
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                    placeholder="+84 xxx xxx xxx"
                                    placeholderTextColor={textSub}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Date of Birth */}
                            <View style={styles.fieldGroup}>
                                <AppText variant="labelSm" style={[styles.fieldLabel, { color: textSub }]}>DATE OF BIRTH</AppText>
                                <TextInput
                                    style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textTheme }]}
                                    value={editDOB}
                                    onChangeText={setEditDOB}
                                    placeholder="DD/MM/YYYY"
                                    placeholderTextColor={textSub}
                                />
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },

    navBar: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm,
    },
    navBackBtn: { padding: 4 },
    navTitle: { fontWeight: "700", fontSize: 18 },

    scroll: { flex: 1 },
    content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: 60 },

    // Phần đầu hồ sơ
    profileHeader: { alignItems: "center", paddingVertical: spacing.md },
    avatarContainer: { position: "relative", marginBottom: spacing.md },
    avatarLarge: {
        width: 96, height: 96, borderRadius: 48,
        alignItems: "center", justifyContent: "center",
    },
    editAvatarBtn: {
        position: "absolute", bottom: 0, right: 0,
        backgroundColor: colors.primary, width: 32, height: 32,
        borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 3,
    },
    profileName: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
    badgeRow: { flexDirection: "row", gap: 8 },
    roleBadge: {
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100,
    },

    // Thẻ
    card: { borderRadius: 24, padding: spacing.lg, borderWidth: 1 },
    cardHeader: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: spacing.md,
    },
    cardTitle: { fontSize: 17, fontWeight: "700" },
    editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },

    // Các hàng thông tin
    infoRow: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingVertical: spacing.md, borderBottomWidth: 1,
    },
    infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    lockedBadge: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100,
    },

    // Các hàng cài đặt
    settingRow: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingVertical: spacing.md, borderBottomWidth: 1,
    },
    settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    settingLabel: { flex: 1, fontWeight: "500" },
    settingValuePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginRight: 4 },

    // Đăng xuất
    logoutBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        backgroundColor: "#fef2f2", paddingVertical: spacing.md, borderRadius: 16,
    },
    logoutText: { color: "#ef4444", fontWeight: "700" },

    // Modal chỉnh sửa
    modalSafe: { flex: 1 },
    modalHeader: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: spacing.gutter, paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    saveBtn: {
        backgroundColor: colors.primary, paddingHorizontal: 16,
        paddingVertical: 8, borderRadius: 10,
    },
    modalContent: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: 60 },

    fieldGroup: { gap: 8 },
    fieldLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    fieldLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
    fieldInput: {
        borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
        fontSize: 15,
    },
});
