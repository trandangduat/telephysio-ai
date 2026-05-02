import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, i18n } = useTranslation();

  const [isDark, setIsDark] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  // Dynamic Theme Colors
  const bgTheme = isDark ? '#0f172a' : '#f8fafd';
  const cardTheme = isDark ? '#1e293b' : '#fff';
  const textTheme = isDark ? '#f8fafc' : '#0f172a';
  const textSubTheme = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgTheme }]} edges={['top']}>
      {/* Navbar with Back Button */}
      <View style={[styles.navBar, { backgroundColor: bgTheme }]}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <AppText variant="headlineMd" style={[styles.navTitle, { color: textTheme }]}>
          {t('profile.navTitle', 'Profile & Settings')}
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarLarge, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <Ionicons name="person" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
            </View>
            <TouchableOpacity style={[styles.editAvatarBtn, { borderColor: bgTheme }]} onPress={() => Alert.alert(t('profile.edit', 'Edit'), t('profile.edit', 'Edit Avatar'))}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <AppText variant="headlineMd" style={[styles.profileName, { color: textTheme }]}>Cody Li</AppText>
          <View style={styles.badgeRow}>
            <View style={styles.proBadge}>
              <AppText variant="labelSm" style={{ color: '#fff', fontWeight: '700' }}>Knee Recovery - Week 4</AppText>
            </View>
          </View>
        </View>

        {/* Activity */}
        <View style={[styles.card, { backgroundColor: cardTheme, borderColor: borderColor }]}>
          <View style={styles.cardHeader}>
            <AppText variant="labelMd" style={[styles.cardTitle, { color: textTheme }]}>{t('profile.activity', 'Activity')}</AppText>
            <TouchableOpacity onPress={() => navigation.navigate('Workout' as any)}>
              <AppText variant="labelSm" style={styles.viewAllText}>{t('profile.viewAll', 'View All')}</AppText>
            </TouchableOpacity>
          </View>

          {/* Calendar Row */}
          <View style={styles.calendarRow}>
            {[12, 13, 14, 15, 16].map((day, i) => {
              const isToday = day === 14;
              const isPast = day < 14;
              return (
                <View key={day} style={[styles.calItem, isToday && styles.calItemToday]}>
                  <AppText variant="labelSm" style={{ color: isToday ? colors.primary : textSubTheme }}>
                    {['M','T','W','T','F'][i]}
                  </AppText>
                  <View style={[styles.calDateBox, isToday ? { backgroundColor: colors.primary } : isPast ? { backgroundColor: isDark ? '#334155' : '#f1f5f9' } : {}]}>
                    <AppText variant="labelMd" style={{ color: isToday ? '#fff' : textTheme }}>{day}</AppText>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Tasks */}
          <View style={styles.taskList}>
            <View style={[styles.taskItem, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4' }]}>
              <View style={[styles.taskIconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark" size={16} color="#16a34a" />
              </View>
              <View style={styles.taskInfo}>
                <AppText variant="labelMd" style={[styles.taskName, { color: isDark ? '#a7f3d0' : '#166534' }]}>Morning Stretch</AppText>
                <AppText variant="bodySm" style={{ color: isDark ? '#6ee7b7' : '#15803d' }}>{t('profile.completed', 'Completed')}</AppText>
              </View>
            </View>

            <View style={[styles.taskItem, { backgroundColor: isDark ? '#1e3a8a' : '#f0f9ff' }]}>
              <View style={[styles.taskIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="time" size={16} color={colors.primary} />
              </View>
              <View style={styles.taskInfo}>
                <AppText variant="labelMd" style={[styles.taskName, { color: isDark ? '#bfdbfe' : '#0369a1' }]}>Knee Strengthening</AppText>
                <AppText variant="bodySm" style={{ color: isDark ? '#93c5fd' : '#0284c7' }}>{t('profile.scheduled', 'Scheduled for')} 04:00 PM</AppText>
              </View>
            </View>
          </View>
        </View>

        {/* My Library */}
        <View style={[styles.card, { backgroundColor: cardTheme, borderColor: borderColor }]}>
          <AppText variant="labelMd" style={[styles.cardTitle, { color: textTheme, marginBottom: spacing.md }]}>{t('profile.myLibrary', 'My Library')}</AppText>
          <View style={styles.libraryGrid}>
            <TouchableOpacity style={[styles.libraryBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor }]} onPress={() => navigation.navigate('Library' as any)}>
              <Ionicons name="bookmark-outline" size={24} color={colors.primary} />
              <AppText variant="labelMd" style={[styles.libraryBoxTitle, { color: textTheme }]}>{t('profile.savedExercises', 'Saved Exercises')}</AppText>
              <AppText variant="bodySm" style={{ color: textSubTheme }}>12 {t('profile.items', 'items')}</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.libraryBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor }]} onPress={() => navigation.navigate('Library' as any)}>
              <Ionicons name="document-text-outline" size={24} color="#10b981" />
              <AppText variant="labelMd" style={[styles.libraryBoxTitle, { color: textTheme }]}>{t('profile.guidesTips', 'Guides & Tips')}</AppText>
              <AppText variant="bodySm" style={{ color: textSubTheme }}>8 {t('profile.articles', 'articles')}</AppText>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.bannerCard} onPress={() => navigation.navigate('Library' as any)}>
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerContent}>
              <AppText variant="labelMd" style={{ color: '#fff' }}>{t('profile.dailyTip', 'Daily Recovery Tip')}</AppText>
              <AppText variant="headlineMd" style={{ color: '#fff', fontSize: 18, marginTop: 4 }}>{t('profile.hydration', 'Hydration & Healing')}</AppText>
              <AppText variant="bodySm" style={{ color: '#e2e8f0', marginTop: 4 }}>
                {t('profile.hydrationDesc', 'Drinking enough water improves joint lubrication.')}
              </AppText>
            </View>
            <Ionicons name="water-outline" size={60} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
          </TouchableOpacity>
        </View>

        {/* Personal Info */}
        <View style={[styles.card, { backgroundColor: cardTheme, borderColor: borderColor }]}>
          <View style={styles.cardHeader}>
            <AppText variant="labelMd" style={[styles.cardTitle, { color: textTheme }]}>{t('profile.personalInfo', 'Personal Information')}</AppText>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => Alert.alert(t('profile.edit', 'Edit'), t('profile.personalInfo', 'Personal Information'))}>
              <Ionicons name="pencil" size={14} color={colors.primary} />
              <AppText variant="labelSm" style={styles.viewAllText}>{t('profile.edit', 'Edit')}</AppText>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
            <Ionicons name="mail-outline" size={20} color={textSubTheme} />
            <AppText variant="bodyMd" style={[styles.infoLabel, { color: textSubTheme }]}>Email</AppText>
            <AppText variant="bodyMd" style={[styles.infoValue, { color: textTheme }]}>cody.li@example.com</AppText>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
            <Ionicons name="call-outline" size={20} color={textSubTheme} />
            <AppText variant="bodyMd" style={[styles.infoLabel, { color: textSubTheme }]}>Phone</AppText>
            <AppText variant="bodyMd" style={[styles.infoValue, { color: textTheme }]}>+1 (555) 123-4567</AppText>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="calendar-outline" size={20} color={textSubTheme} />
            <AppText variant="bodyMd" style={[styles.infoLabel, { color: textSubTheme }]}>Date of Birth</AppText>
            <AppText variant="bodyMd" style={[styles.infoValue, { color: textTheme }]}>Sept 12, 1994</AppText>
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.card, { backgroundColor: cardTheme, borderColor: borderColor }]}>
          <AppText variant="labelMd" style={[styles.cardTitle, { color: textTheme, marginBottom: spacing.sm }]}>{t('profile.settings', 'Settings')}</AppText>
          
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: borderColor }]} onPress={() => setIsDark(!isDark)}>
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={20} color={textSubTheme} />
            <AppText variant="bodyMd" style={[styles.settingLabel, { color: textTheme }]}>{t('profile.appearance', 'Appearance')}</AppText>
            <AppText variant="bodySm" style={{ color: textSubTheme }}>{isDark ? t('profile.dark', 'Dark') : t('profile.light', 'Light')}</AppText>
            <Ionicons name="chevron-forward" size={16} color={borderColor} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: borderColor }]} onPress={toggleLanguage}>
            <Ionicons name="globe-outline" size={20} color={textSubTheme} />
            <AppText variant="bodyMd" style={[styles.settingLabel, { color: textTheme }]}>{t('profile.language', 'Language')}</AppText>
            <AppText variant="bodySm" style={{ color: textSubTheme }}>{i18n.language === 'vi' ? 'Tiếng Việt' : 'English (US)'}</AppText>
            <Ionicons name="chevron-forward" size={16} color={borderColor} />
          </TouchableOpacity>

          <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
            <Ionicons name="notifications-outline" size={20} color={textSubTheme} />
            <AppText variant="bodyMd" style={[styles.settingLabel, { color: textTheme }]}>{t('profile.notifications', 'Notifications')}</AppText>
            <View style={{ flex: 1 }} />
            <Switch 
              value={notificationsEnabled} 
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: colors.primary }}
            />
          </View>

          <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => Alert.alert(t('profile.privacy', 'Privacy & Data'), t('profile.privacy', 'Privacy & Data'))}>
            <Ionicons name="shield-checkmark-outline" size={20} color={textSubTheme} />
            <AppText variant="bodyMd" style={[styles.settingLabel, { color: textTheme }]}>{t('profile.privacy', 'Privacy & Data')}</AppText>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={16} color={borderColor} />
          </TouchableOpacity>
        </View>

        {/* Footer Buttons */}
        <TouchableOpacity style={styles.supportBtn} onPress={() => Alert.alert(t('profile.support', 'Contact Support'), t('profile.support', 'Contacting support center...'))}>
          <Ionicons name="help-buoy-outline" size={20} color={textSubTheme} />
          <AppText variant="labelMd" style={[styles.supportText, { color: textSubTheme }]}>{t('profile.support', 'Contact Support Center')}</AppText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert(t('profile.logout', 'Log Out'), t('profile.logout', 'Log Out'), [{ text: t('common.cancel', 'Cancel'), style: 'cancel' }, { text: t('profile.logout', 'Log Out'), style: 'destructive' }])}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <AppText variant="labelMd" style={styles.logoutText}>{t('profile.logout', 'Log Out')}</AppText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
  navBackBtn: { padding: 4, marginLeft: -4 },
  navTitle: { fontWeight: '700', fontSize: 18 },
  
  scroll: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },

  profileHeader: { alignItems: 'center', marginTop: spacing.sm },
  avatarContainer: { position: 'relative', marginBottom: spacing.md },
  avatarLarge: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  profileName: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  proBadge: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },

  card: { borderRadius: 24, padding: spacing.lg, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  viewAllText: { color: colors.primary, fontWeight: '600' },

  calendarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  calItem: { alignItems: 'center', gap: 8 },
  calItemToday: { },
  calDateBox: { width: 36, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  
  taskList: { gap: spacing.sm },
  taskItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 16, gap: 12 },
  taskIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  taskInfo: { flex: 1 },
  taskName: { fontWeight: '700', marginBottom: 2 },
  taskTime: { fontSize: 12 },

  libraryGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  libraryBox: { flex: 1, padding: spacing.md, borderRadius: 16, borderWidth: 1 },
  libraryBoxTitle: { fontWeight: '700', marginTop: spacing.sm, marginBottom: 2 },
  libraryBoxSub: { },

  bannerCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: spacing.lg, overflow: 'hidden', position: 'relative' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.primary, opacity: 0.9 },
  bannerContent: { position: 'relative', zIndex: 1 },
  bannerIcon: { position: 'absolute', right: -10, bottom: -10, zIndex: 0 },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  infoLabel: { flex: 1, marginLeft: 12 },
  infoValue: { fontWeight: '500' },

  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  settingLabel: { flex: 1, fontWeight: '500', marginLeft: 12 },

  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'transparent', paddingVertical: spacing.md },
  supportText: { fontWeight: '600' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', paddingVertical: spacing.md, borderRadius: 16 },
  logoutText: { color: '#ef4444', fontWeight: '700' },
});
