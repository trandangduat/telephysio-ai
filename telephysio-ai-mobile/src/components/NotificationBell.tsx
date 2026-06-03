/**
 * @file NotificationBell.tsx
 * @description Biểu tượng chuông thông báo hiển thị số lượng thông báo chưa đọc.
 * Tự động cập nhật số lượng thông báo theo thời gian thực.
 */

import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { AppText } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { onNotificationsChange } from "../services/firebase/notificationService";

/**
 * Component hiển thị biểu tượng chuông thông báo.
 * Khi nhấn vào sẽ chuyển hướng đến màn hình Notifications.
 * 
 * @return {React.FC} Component biểu tượng chuông thông báo
 */
export const NotificationBell: React.FC = () => {
    const navigation = useNavigation<any>();
    const { uid } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!uid) return;
        const unsubscribe = onNotificationsChange(uid, (notifications) => {
            setUnreadCount(notifications.filter((n) => !n.read).length);
        });
        return () => unsubscribe();
    }, [uid]);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => navigation.navigate("Notifications")}
            activeOpacity={0.7}
        >
            <Ionicons name="notifications-outline" size={24} color="#475569" />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <AppText variant="labelSm" style={styles.badgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </AppText>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 4,
        position: "relative",
    },
    badge: {
        position: "absolute",
        top: 0,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#ef4444",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: "#f8fafd",
    },
    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "800",
        lineHeight: 12,
    },
});
