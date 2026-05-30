/**
 * DoctorAssignmentsScreen — Create and edit reusable exercise templates.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
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
import { colors, spacing } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import type { DoctorStackParamList, DoctorTabParamList } from "../../navigation/types";
import { 
  getExerciseTemplates, 
  deleteExerciseTemplate,
} from "../../services/firebase";
import type { ExerciseTemplate } from "../../services/firebase/types";

type AssignmentsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<DoctorTabParamList, 'Assignments'>,
  NativeStackNavigationProp<DoctorStackParamList>
>;

export const DoctorAssignmentsScreen: React.FC = () => {
  const navigation = useNavigation<AssignmentsNavProp>();
  const { t } = useTranslation();
  const { uid } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);

  const loadData = async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const fetchedTemplates = await getExerciseTemplates(uid);
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [uid]);

  // Refresh when screen is focused (after navigating back from editor)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (uid) loadData();
    });
    return unsubscribe;
  }, [navigation, uid]);

  const handleDeleteTemplate = (tpl: ExerciseTemplate) => {
    const doDelete = async () => {
      try {
        await deleteExerciseTemplate(tpl.id);
        setTemplates(prev => prev.filter(t => t.id !== tpl.id));
        if (Platform.OS !== 'web') Alert.alert('Deleted', 'Template deleted successfully.');
      } catch (error) {
        console.error('Error deleting template:', error);
        if (Platform.OS !== 'web') Alert.alert('Error', 'Failed to delete template.');
      }
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`${t('doctor.assignments.deleteConfirmTitle')}: "${tpl.name}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        t('doctor.assignments.deleteConfirmTitle'),
        t('doctor.assignments.deleteConfirmMessage', { name: tpl.name }),
        [
          { text: t('doctor.assignments.cancel'), style: 'cancel' },
          { text: t('doctor.assignments.delete'), style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

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
            {t('doctor.assignments.title')}
          </AppText>
          <AppText variant="bodyMd" style={styles.pageSubtitle}>
            {t('doctor.assignments.subtitle')}
          </AppText>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            {/* Create New */}
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('TemplateEditor', {})}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={colors.primary}
              />
              <AppText
                variant="labelMd"
                style={{ color: colors.primary, fontWeight: "700" }}
              >
                {t('doctor.assignments.createTemplate')}
              </AppText>
            </TouchableOpacity>

            {/* Template Cards */}
            {templates.length > 0 ? templates.map((tpl) => (
              <View
                key={tpl.id}
                style={styles.card}
              >
                <TouchableOpacity
                  style={styles.cardRow}
                  onPress={() => navigation.navigate('TemplateEditor', { templateId: tpl.id })}
                >
                  <View
                    style={[
                      styles.templateIcon,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.templateInfo}>
                    <AppText variant="labelMd" style={styles.templateName}>
                      {tpl.name}
                    </AppText>
                    <AppText variant="bodySm" style={styles.templateMeta}>
                      {t('doctor.assignments.exercisesCount', { count: tpl.exercises?.length || 0 })} · {tpl.totalDuration || '0 min'} ·{" "}
                      {t('doctor.assignments.patientsCount', { count: tpl.patientCount || 0 })}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>

                <View style={styles.templateActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('TemplateEditor', { templateId: tpl.id })}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#475569" />
                    <AppText variant="labelSm" style={{ color: "#475569" }}>
                      {t('doctor.assignments.edit')}
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDeleteTemplate(tpl)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <AppText variant="labelSm" style={{ color: "#ef4444" }}>
                      {t('doctor.assignments.delete')}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            )) : (
              <AppText variant="bodyMd" style={{ color: "#64748b", padding: spacing.md, textAlign: 'center' }}>
                {t('doctor.assignments.noTemplates')}
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

  tabDescContainer: {
    marginTop: -spacing.sm,
  },
  tabDescText: {
    color: "#94a3b8",
    fontStyle: "italic",
  },

  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  templateInfo: { flex: 1 },
  templateName: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },
  templateMeta: { color: "#64748b" },

  templateActions: {
    flexDirection: "row",
    marginTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: spacing.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  notifDot: {
    position: "absolute",
    right: 4,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
