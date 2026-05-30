/**
 * DoctorDashboardScreen — Patient list with today's assignment status.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
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
import type { DoctorStackParamList, DoctorTabParamList } from "../../navigation/types";
import { useTranslation } from 'react-i18next';
import {
  getUser,
  getDoctorAssignments,
} from "../../services/firebase";
import { seedMockData } from "../../services/firebase/seedService";
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

export const DoctorDashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const { userName, uid } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    Alert.alert(
      "Seed Demo Data",
      "This will add demo patients, exercises, templates, and sessions. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Seed",
          onPress: async () => {
            setSeeding(true);
            try {
              const result = await seedMockData();
              if (result) {
                Alert.alert("Success", "Demo data seeded successfully! Pull to refresh.");
                loadData();
              } else {
                Alert.alert("Error", "Failed to seed data. Check console for details.");
              }
            } catch (e) {
              Alert.alert("Error", "Failed to seed data.");
            } finally {
              setSeeding(false);
            }
          },
        },
      ]
    );
  };

  const loadData = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    try {
      // Derive patients from assignments (not treatment_plans)
      // so any newly-assigned patient shows up immediately
      const allAssignments = await getDoctorAssignments(uid);
      const uniquePatientIds = [...new Set(allAssignments.map(a => a.patientId))];

      // Fetch profiles for all those patient IDs in parallel
      const profiles = await Promise.all(uniquePatientIds.map(id => getUser(id)));
      const validProfiles = profiles.filter(Boolean) as UserProfile[];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const cards: PatientCard[] = validProfiles.map((profile) => {
        const patientAssignments = allAssignments.filter(
          (a) => a.patientId === profile.uid
        );
        const todayAssignments = patientAssignments.filter((a) => {
          const at = ((a.scheduledDate ?? a.assignedAt) as any)?.toDate?.();
          return at && at >= today;
        });
        const completed = todayAssignments.filter((a) => a.status === "completed").length;
        return {
          profile,
          assignments: patientAssignments,
          todayCompleted: completed,
          todayTotal: todayAssignments.length,
        };
      });
      // Sort: patients with today's tasks first, then alphabetically
      cards.sort((a, b) => {
        if (b.todayTotal !== a.todayTotal) return b.todayTotal - a.todayTotal;
        return (a.profile.displayName || '').localeCompare(b.profile.displayName || '');
      });
      setPatients(cards);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openPatientDetail = (card: PatientCard) => {
    navigation.navigate("PatientDetail", {
      patientId: card.profile.uid,
      patientName: card.profile.displayName || card.profile.email || "Patient",
    });
  };

  const filtered = (() => {
    const raw = searchText.trim();
    if (!raw) return patients;
    // Split query into tokens so "nguyen lta" matches both independently
    const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);
    return patients.filter((p) => {
      const email = (p.profile.email || '').toLowerCase();
      const name = (p.profile.displayName || '').toLowerCase();
      // Also search inside assignment template names
      const templateNames = p.assignments.map(a => (a.templateName || '').toLowerCase()).join(' ');
      // Email prefix (before @) for quick typing
      const emailLocal = email.split('@')[0];
      return tokens.every(token =>
        email.includes(token) ||
        name.includes(token) ||
        emailLocal.includes(token) ||
        templateNames.includes(token)
      );
    });
  })();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('doctor.dashboard.goodMorning');
    if (h < 18) return t('doctor.dashboard.goodAfternoon');
    return t('doctor.dashboard.goodEvening');
  };

  const getStatusColor = (card: PatientCard) => {
    if (card.todayTotal === 0) return "#94a3b8";
    if (card.todayCompleted === card.todayTotal) return "#10b981";
    if (card.todayCompleted > 0) return "#f59e0b";
    return "#ef4444";
  };

  const getStatusLabel = (card: PatientCard) => {
    if (card.todayTotal === 0) return t('doctor.dashboard.noTasksToday');
    if (card.todayCompleted === card.todayTotal) return t('doctor.dashboard.allDone');
    if (card.todayCompleted > 0) return t('doctor.dashboard.tasksDone', { completed: card.todayCompleted, total: card.todayTotal });
    return t('doctor.dashboard.notStarted');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
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
          <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
          <View style={styles.roleBadge}>
            <AppText variant="labelSm" style={{ color: "#fff", fontWeight: "700", fontSize: 9 }}>{t('doctor.doctorRole')}</AppText>
          </View>
        </View>
        <View style={styles.topBarIcons}>
          <NotificationBell />
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate("DoctorProfile")}>
            <Ionicons name="person" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.header}>
          <AppText variant="bodyMd" style={styles.greeting}>{getGreeting()}</AppText>
          <AppText variant="headlineLg" style={styles.doctorName}>{userName}</AppText>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('doctor.searchPlaceholder')}
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <AppText variant="headlineMd" style={styles.sectionTitle}>{t('doctor.dashboard.myPatients')}</AppText>
          <View style={styles.countBadge}>
            <AppText variant="labelSm" style={{ color: colors.primary }}>{filtered.length}</AppText>
          </View>
        </View>

        {/* Patient Cards */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <AppText variant="bodyMd" style={{ color: "#94a3b8", marginTop: 12 }}>
              {searchText ? t('doctor.dashboard.noPatientsMatch') : t('doctor.dashboard.noPatientsAssigned')}
            </AppText>
          </View>
        ) : (
          filtered.map((card) => (
            <TouchableOpacity
              key={card.profile.uid}
              style={styles.patientCard}
              onPress={() => openPatientDetail(card)}
              activeOpacity={0.85}
            >
              <View style={styles.cardLeft}>
                <View style={styles.avatarCircle}>
                  <AppText style={styles.avatarInitial}>
                    {(card.profile.displayName || "?")[0].toUpperCase()}
                  </AppText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="labelMd" style={styles.patientName}>{card.profile.displayName}</AppText>
                  <AppText variant="bodySm" style={styles.patientEmail}>{card.profile.email}</AppText>
                  <AppText variant="bodySm" style={styles.assignmentCount}>
                    {t('doctor.dashboard.assignments', { count: card.assignments.length })}
                  </AppText>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.statusPill, { backgroundColor: getStatusColor(card) + "22" }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(card) }]} />
                  <AppText variant="labelSm" style={{ color: getStatusColor(card), fontSize: 10, fontWeight: "700" }}>
                    {getStatusLabel(card)}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          )          )
        )}

        {/* Seed Demo Data Button */}
        <TouchableOpacity
          style={styles.seedBtn}
          onPress={handleSeed}
          disabled={seeding}
        >
          {seeding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <AppText variant="labelMd" style={{ color: "#fff", fontWeight: "700" }}>
                Seed Demo Data
              </AppText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafd" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  roleBadge: { backgroundColor: "#0f766e", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  topBarIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { padding: 4, position: "relative" },
  notifDot: { position: "absolute", top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", zIndex: 1 },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#0f766e", alignItems: "center", justifyContent: "center" },

  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: spacing.xl * 2 },

  header: { gap: 2 },
  greeting: { color: "#64748b" },
  doctorName: { color: colors.onSurface, fontWeight: "800", fontSize: 26 },
  subtitle: { color: "#64748b", marginTop: 2 },

  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: "#e2e8f0",
    boxShadow: "0 1px 4px rgba(0,93,182,0.06)",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a", fontFamily: typography.bodyMd.fontFamily },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { color: "#0f172a", fontWeight: "700", fontSize: 18 },
  countBadge: { backgroundColor: "#e0f2fe", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },

  emptyState: { alignItems: "center", paddingVertical: 48 },

  patientCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: spacing.md,
    borderWidth: 1, borderColor: "#e2e8f0",
    flexDirection: "row", alignItems: "center", gap: 12,
    boxShadow: "0 2px 8px rgba(0,93,182,0.06)",
  },
  cardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 20, fontWeight: "800", color: colors.primary, fontFamily: typography.headlineMd.fontFamily },
  patientName: { color: "#0f172a", fontWeight: "700", fontSize: 15 },
  patientEmail: { color: "#64748b", fontSize: 12 },
  assignmentCount: { color: "#94a3b8", fontSize: 11 },
  cardRight: { alignItems: "flex-end", gap: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  seedBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#6366f1", paddingVertical: 14, borderRadius: 16, marginTop: spacing.md,
  },
});
