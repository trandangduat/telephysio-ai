import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AppText } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { onNotificationsChange } from '../services/firebase/notificationService';
import { colors, spacing } from '../theme';
import type { Notification } from '../services/firebase/types';

export const GlobalNotificationToast: React.FC = () => {
  const { uid } = useAuth();
  const navigation = useNavigation<any>();
  
  const [popups, setPopups] = useState<Notification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Listen to navigation changes to clear popups if Notifications screen is opened
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      // Just clear popups anytime they open Notifications
      // Checking current route name specifically can be tricky in nested navigators,
      // but clearing it when state changes if the focused route is Notifications works well.
      const state = navigation.getState();
      if (state) {
        // Find the active route
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
            return combined.slice(0, 3); // Max 3 popups on screen
          });
          
          // Auto-hide popups after 5 seconds
          newPopups.forEach(p => {
             setTimeout(() => {
               setPopups(current => current.filter(x => x.id !== p.id));
             }, 5000);
          });
        }
        
        // Add all fetched notifications to seenIds so we don't show toasts for them later 
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
    top: Platform.OS === 'ios' ? 110 : 90, // Under the top bar
    right: spacing.gutter,
    left: spacing.gutter,
    alignItems: 'flex-end', // Align right
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    width: '85%', // Make it a bit compact on the right side
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
