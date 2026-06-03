/**
 * @file GlobalNotificationToast.tsx
 * @description Component hiển thị thông báo toàn cục (toast) nổi lên màn hình khi có thông báo mới.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AppText } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { onNotificationsChange } from '../services/firebase/notificationService';
import { colors, spacing } from '../theme';
import type { Notification } from '../services/firebase/types';

/**
 * Component hiển thị danh sách các thông báo toàn cục (toast) cho người dùng.
 * Các thông báo sẽ tự động biến mất sau 5 giây.
 * 
 * @returns {React.FC} Component hiển thị danh sách toast thông báo
 */
export const GlobalNotificationToast: React.FC = () => {
    const { uid } = useAuth();
    const navigation = useNavigation<any>();
  
    const [popups, setPopups] = useState<Notification[]>([]);
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
    const isInitialLoadRef = useRef(true);

    // Lắng nghe các thay đổi điều hướng để xóa popups nếu màn hình Thông báo được mở
    useEffect(() => {
        const unsubscribe = navigation.addListener('state', () => {
            // Chỉ cần xóa popups bất cứ khi nào họ mở màn hình Thông báo
            // Kiểm tra tên route hiện tại có thể phức tạp trong các bộ điều hướng lồng nhau,
            // nhưng xóa nó khi trạng thái thay đổi nếu route đang tập trung là Thông báo hoạt động tốt.
            const state = navigation.getState();
            if (state) {
                // Tìm route đang hoạt động
                let currentRoute = state.routes[state.index];
                while (currentRoute.state) {
                    currentRoute = currentRoute.state.routes[currentRoute.state.index];
                }
                if (currentRoute.name === 'Notifications') {
                    setPopups([]);
                }
            }
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (!uid) {
            setPopups([]);
            setSeenIds(new Set());
            isInitialLoadRef.current = true;
            return;
        }

        const unsubscribe = onNotificationsChange(uid, (notifications) => {
            const unread = notifications.filter(n => !n.read);
      
            setSeenIds(prevSeen => {
                const newSeen = new Set(prevSeen);
                const newPopups: Notification[] = [];
        
                unread.forEach(n => {
                    if (!prevSeen.has(n.id)) {
                        newPopups.push(n);
                        newSeen.add(n.id);
                    }
                });
        
                if (!isInitialLoadRef.current && newPopups.length > 0) {
                    setPopups(prev => {
                        const combined = [...newPopups, ...prev];
                        return combined.slice(0, 3); // Tối đa 3 popups trên màn hình
                    });
          
                    // Tự động ẩn popups sau 5 giây
                    newPopups.forEach(p => {
                        setTimeout(() => {
                            setPopups(current => current.filter(x => x.id !== p.id));
                        }, 5000);
                    });
                }
        
                // Thêm tất cả các thông báo đã tải vào seenIds để không hiển thị toast cho chúng sau này 
                notifications.forEach(n => newSeen.add(n.id));
                return newSeen;
            });
      
            if (isInitialLoadRef.current) {
                isInitialLoadRef.current = false;
            }
        });

        return () => {
            unsubscribe();
            isInitialLoadRef.current = true;
        };
    }, [uid]);

    if (popups.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            {popups.map((popup) => (
                <TouchableOpacity
                    key={popup.id}
                    style={styles.toast}
                    activeOpacity={0.9}
                    onPress={() => {
                        setPopups(prev => prev.filter(x => x.id !== popup.id));
            
                        if (popup.type === 'session_assigned' && popup.data?.assignmentId) {
                            navigation.navigate('WorkoutDetail', {
                                assignmentId: popup.data.assignmentId,
                                title: popup.data.templateName
                            });
                        } else if (popup.type === 'session_completed' && popup.data?.sessionId) {
                            navigation.navigate('DoctorSessionDetail', { 
                                sessionId: popup.data.sessionId 
                            });
                        } else {
                            navigation.navigate('Notifications');
                        }
                    }}
                >
                    <View style={styles.iconBox}>
                        <Ionicons 
                            name={popup.type === 'session_assigned' ? 'calendar' : 'checkmark-circle'} 
                            size={20} 
                            color={colors.primary} 
                        />
                    </View>
                    <View style={styles.toastContent}>
                        <View style={styles.titleRow}>
                            <AppText variant="labelMd" style={styles.toastTitle} numberOfLines={1}>{popup.title}</AppText>
                            <TouchableOpacity 
                                style={styles.closeBtn}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    setPopups(prev => prev.filter(x => x.id !== popup.id));
                                }}
                            >
                                <Ionicons name="close" size={16} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <AppText variant="bodySm" style={styles.toastBody} numberOfLines={2}>{popup.body}</AppText>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 110 : 90, // Dưới thanh công cụ trên cùng
        right: spacing.gutter,
        left: spacing.gutter,
        alignItems: 'flex-end', // Căn phải
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
        width: '85%', // Làm cho nó gọn một chút ở bên phải
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e0f2fe',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    toastContent: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    toastTitle: {
        color: '#0f172a',
        fontWeight: '700',
        flex: 1,
    },
    toastBody: {
        color: '#475569',
        lineHeight: 18,
    },
    closeBtn: {
        padding: 2,
        marginLeft: 8,
    },
});

