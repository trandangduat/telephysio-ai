/**
 * @file DoctorPatientsScreen.tsx
 * @description Màn hình danh sách bệnh nhân dành cho bác sĩ.
 * Hiển thị tất cả bệnh nhân cùng trạng thái tiến trình điều trị (On Track / Ahead / At Risk),
 * hỗ trợ tìm kiếm theo tên hoặc bệnh trạng, và cho phép xem chi tiết từng bệnh nhân.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type { DoctorStackParamList, DoctorTabParamList } from "../../navigation/types";
import { getPatients, getDoctorTreatmentPlans } from "../../services/firebase";
import type { UserProfile, TreatmentPlan } from "../../services/firebase/types";
import { NotificationBell } from "../../components/NotificationBell";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "on-track": { label: "On Track", color: "#166534", bg: "#dcfce7" },
  ahead: { label: "Ahead", color: "#1e40af", bg: "#dbeafe" },
  "at-risk": { label: "At Risk", color: "#991b1b", bg: "#fef2f2" },
};

type MappedPatient = UserProfile & { 
  plan?: TreatmentPlan;
  status: 'on-track' | 'ahead' | 'at-risk';
};

type PatientsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<DoctorTabParamList, 'Patients'>,
  NativeStackNavigationProp<DoctorStackParamList>
>;

/**
 * @component DoctorPatientsScreen
 * @description Component màn hình danh sách bệnh nhân.
 * Tải danh sách bệnh nhân và kế hoạch điều trị từ Firebase, gộp dữ liệu,
 * hỗ trợ tìm kiếm và hiển thị bảng tóm tắt trạng thái (tổng, on-track, at-risk).
 * @return {React.ReactElement} Giao diện danh sách bệnh nhân với thanh tìm kiếm và thẻ bệnh nhân.
 */
export const DoctorPatientsScreen: React.FC = () => {
  const navigation = useNavigation<PatientsNavProp>();
  const { t } = useTranslation();
  const { uid } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<MappedPatient[]>([]);

  useEffect(() => {
    /**
     * @function loadData
     * @description Tải đồng thời danh sách bệnh nhân và kế hoạch điều trị từ Firebase.
     * Gộp kế hoạch vào từng bệnh nhân, tính trạng thái và cập nhật state.
     * @return {Promise<void>}
     */
    async function loadData() {
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        const [fetchedPatients, plans] = await Promise.all([
          getPatients(uid),
          getDoctorTreatmentPlans(uid)
        ]);

        const mapped: MappedPatient[] = fetchedPatients.map(p => {
          const plan = plans.find(pl => pl.patientId === p.uid);
          return {
            ...p,
            plan,
            status: (plan?.status as any) || 'on-track'
          };
        });

        setPatients(mapped);
      } catch (error) {
        console.error('Error loading doctor patients:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [uid]);

  const filtered = patients.filter(
    (p) =>
      (p.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.plan?.condition || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Bar */}
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
            Patients Progress
          </AppText>
          <AppText variant="bodyMd" style={styles.pageSubtitle}>
            Track recovery of all patients
          </AppText>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients or conditions..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Summary Bar */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText variant="headlineMd" style={styles.summaryValue}>
              {patients.length}
            </AppText>
            <AppText variant="bodySm" style={styles.summaryLabel}>
              Total
            </AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText
              variant="headlineMd"
              style={[styles.summaryValue, { color: "#166534" }]}
            >
              {patients.filter((p) => p.status === "on-track").length}
            </AppText>
            <AppText variant="bodySm" style={styles.summaryLabel}>
              On Track
            </AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText
              variant="headlineMd"
              style={[styles.summaryValue, { color: "#991b1b" }]}
            >
              {patients.filter((p) => p.status === "at-risk").length}
            </AppText>
            <AppText variant="bodySm" style={styles.summaryLabel}>
              At Risk
            </AppText>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : filtered.length > 0 ? filtered.map((patient) => {
          const statusCfg = STATUS_CONFIG[patient.status] || STATUS_CONFIG['on-track'];
          const progress = patient.plan?.progress || 0;
          return (
            <TouchableOpacity
              key={patient.uid}
              style={styles.card}
              onPress={() =>
                navigation.navigate("PatientDetail", {
                  patientId: patient.uid,
                  patientName: patient.displayName || 'Patient',
                })
              }
            >
              <View style={styles.cardTop}>
                <View style={styles.patientAvatar}>
                  <Ionicons name="person" size={20} color="#94a3b8" />
                </View>
                <View style={styles.patientInfo}>
                  <AppText variant="labelMd" style={styles.patientName}>
                    {patient.displayName}
                  </AppText>
                  <AppText variant="bodySm" style={styles.patientCondition}>
                    {patient.plan?.condition || 'No active plan'} {patient.plan && `· Week ${patient.plan.currentWeek} · Phase ${patient.plan.currentPhase}`}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusCfg.bg },
                  ]}
                >
                  <AppText
                    variant="labelSm"
                    style={{
                      color: statusCfg.color,
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    {statusCfg.label}
                  </AppText>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <AppText variant="bodySm" style={styles.progressLabel}>
                    Overall Progress
                  </AppText>
                  <AppText variant="labelMd" style={{ color: colors.primary }}>
                    {progress}%
                  </AppText>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={14} color="#64748b" />
                  <AppText variant="bodySm" style={styles.statText}>
                    -- sessions
                  </AppText>
                </View>
                <View style={styles.statItem}>
                  <Ionicons
                    name="analytics-outline"
                    size={14}
                    color="#64748b"
                  />
                  <AppText variant="bodySm" style={styles.statText}>
                    --% accuracy
                  </AppText>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={14} color="#64748b" />
                  <AppText variant="bodySm" style={styles.statText}>
                    Recently Active
                  </AppText>
                </View>
              </View>
            </TouchableOpacity>
          );
        }) : (
          <AppText variant="bodyMd" style={{ color: "#64748b", padding: spacing.md, textAlign: 'center' }}>
            No patients found.
          </AppText>
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
  topBarIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { padding: 4 },
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
    gap: spacing.lg,
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

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },

  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { color: colors.onSurface, fontWeight: "800", fontSize: 22 },
  summaryLabel: { color: "#64748b", marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: "#e2e8f0" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.md,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  patientInfo: { flex: 1 },
  patientName: { color: "#0f172a", fontWeight: "700", fontSize: 16 },
  patientCondition: { color: "#64748b", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },

  progressSection: { marginBottom: spacing.md },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { color: "#64748b" },
  progressTrack: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  statsRow: {
    flexDirection: "row",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: spacing.md,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "#64748b" },
});
