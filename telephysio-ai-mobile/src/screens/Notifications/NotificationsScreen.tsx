/**
 * NotificationsScreen — Full-screen list of in-app notifications.
 *
 * Notification types:
 *   session_completed  → doctor taps → DoctorSessionDetail
 *   session_assigned   → patient taps → WorkoutDetail
 */

import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import {
  getUserNotifications,
  markNotificationRead,
  markAllRead,
} from "../../services/firebase/notificationService";
import { getPatientSessions } from "../../services/firebase/progressService";
import type { Notification } from "../../services/firebase/types";

// ── Helpers ─────────────────────────────────────────

const formatTimeAgo = (date?: Date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

const getNotificationIcon = (
  type: string,
): { name: string; color: string; bg: string } => {
  switch (type) {
    case "session_completed":
      return {
        name: "checkmark-circle",
        color: "#10b981",
        bg: "#ecfdf5",
      };
    case "session_assigned":
      return {
        name: "clipboard",
        color: colors.primary,
        bg: "#e0f2fe",
      };
    default:
      return {
        name: "notifications",
        color: "#64748b",
        bg: "#f1f5f9",
      };
  }
};

// ── Component ───────────────────────────────────────

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { uid, role } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    if (!uid) return;
    try {
      const data = await getUserNotifications(uid);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [uid]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    if (!uid) return;
    try {
      await markAllRead(uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleTap = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
      } catch (err) {
        console.warn("Failed to mark notification as read:", err);
      }
    }

    // Navigate based on type
    if (
      notification.type === "session_completed" &&
      notification.data?.sessionId &&
      notification.data?.patientId
    ) {
      // Doctor taps → go to review that session
      try {
        const sessions = await getPatientSessions(
          notification.data.patientId,
          50,
        );
        const session = sessions.find(
          (s) => s.id === notification.data!.sessionId,
        );
        if (session) {
          navigation.navigate("DoctorSessionDetail", {
            session,
            patientName: notification.data.patientName || "Patient",
          });
          return;
        }
      } catch (err) {
        console.warn("Failed to load session for navigation:", err);
      }
    }

    if (
      notification.type === "session_assigned" &&
      notification.data?.assignmentId
    ) {
      // Patient taps → go to begin that workout
      navigation.navigate("WorkoutDetail", {
        assignmentId: notification.data.assignmentId,
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText variant="headlineMd" style={styles.headerTitle}>
            Notifications
          </AppText>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <AppText variant="labelSm" style={styles.headerBadgeText}>
                {unreadCount}
              </AppText>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <AppText variant="labelSm" style={styles.markAllBtn}>
              Mark all read
            </AppText>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={56}
            color="#cbd5e1"
          />
          <AppText
            variant="headlineMd"
            style={{ color: "#94a3b8", marginTop: spacing.md }}
          >
            No notifications yet
          </AppText>
          <AppText
            variant="bodySm"
            style={{
              color: "#94a3b8",
              marginTop: 4,
              textAlign: "center",
              maxWidth: 260,
            }}
          >
            You'll be notified when sessions are completed or assigned.
          </AppText>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {notifications.map((notification) => {
            const icon = getNotificationIcon(notification.type);
            const timeDate = notification.createdAt as any;
            const timeAgo = formatTimeAgo(
              timeDate?.toDate ? timeDate.toDate() : undefined,
            );

            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notifCard,
                  !notification.read && styles.notifCardUnread,
                ]}
                onPress={() => handleTap(notification)}
                activeOpacity={0.7}
              >
                {/* Unread indicator */}
                {!notification.read && <View style={styles.unreadDot} />}

                {/* Icon */}
                <View
                  style={[styles.notifIcon, { backgroundColor: icon.bg }]}
                >
                  <Ionicons
                    name={icon.name as any}
                    size={22}
                    color={icon.color}
                  />
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                  <AppText
                    variant="labelMd"
                    style={[
                      styles.notifTitle,
                      !notification.read && { color: "#0f172a" },
                    ]}
                  >
                    {notification.title}
                  </AppText>
                  <AppText
                    variant="bodySm"
                    style={styles.notifBody}
                    numberOfLines={2}
                  >
                    {notification.body}
                  </AppText>
                  <AppText variant="labelSm" style={styles.notifTime}>
                    {timeAgo}
                  </AppText>
                </View>

                {/* Chevron */}
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#cbd5e1"
                  style={{ alignSelf: "center" }}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ── Styles ──────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafd" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "#0f172a", fontWeight: "700", fontSize: 20 },
  headerBadge: {
    backgroundColor: "#ef4444",
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  headerBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  markAllBtn: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.gutter,
    paddingTop: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl * 2,
  },

  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: "relative",
  },
  notifCardUnread: {
    backgroundColor: "#f0f7ff",
    borderColor: colors.primary + "20",
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  notifContent: { flex: 1, gap: 2 },
  notifTitle: { color: "#475569", fontWeight: "700", fontSize: 14 },
  notifBody: { color: "#64748b", lineHeight: 18 },
  notifTime: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
});
