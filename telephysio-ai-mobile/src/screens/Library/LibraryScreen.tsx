/**
 * @file LibraryScreen.tsx
 * @description Màn hình thư viện tài nguyên phục hồi của ứng dụng TelePhysioAI.
 *
 * Màn hình này cung cấp các chức năng sau:
 *   - Hiển thị danh sách tài nguyên giáo dục (video, PDF, bài viết) tải từ Firestore.
 *   - Lọc tài nguyên theo danh mục (All, Videos, PDFs, Articles).
 *   - Tìm kiếm bài tập, hướng dẫn hoặc video.
 *   - Hiển thị gợi ý hàng ngày (Daily Tip) và bài tập đã lưu (Saved Exercises).
 *
 * @module screens/Library
 */
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AppText } from '../../components/ui';
import { colors, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { getLibraryItems, type LibraryItem } from '../../services/firebase';
import { NotificationBell } from '../../components/NotificationBell';

/**
 * Component màn hình thư viện tài nguyên.
 *
 * Tải danh sách mục thư viện từ Firestore, cho phép lọc theo danh mục
 * và hiển thị các tài liệu giáo dục có liên quan đến vật lý trị liệu.
 *
 * @returns Giao diện React Native hiển thị thư viện tài nguyên phục hồi.
 */
export const LibraryScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { t } = useTranslation();
  
    const [activeFilter, setActiveFilter] = useState('filterAll');
    const filters = [
        { key: 'filterAll', label: t('library.filterAll', 'All Items') },
        { key: 'filterVideos', label: t('library.filterVideos', 'Videos') },
        { key: 'filterPDFs', label: t('library.filterPDFs', 'PDFs') },
        { key: 'filterArticles', label: t('library.filterArticles', 'Articles') }
    ];

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<LibraryItem[]>([]);

    useEffect(() => {
    /**
     * Tải danh sách tài nguyên từ Firestore và cập nhật state.
     *
     * Gọi {@link getLibraryItems} để lấy toàn bộ mục thư viện và cài đặt
     * vào state `items`. Xử lý lỗi và dùng flag loading để quản lý trạng thái tải.
     *
     * @returns Promise<void>
     */
        async function loadData() {
            try {
                const data = await getLibraryItems();
                setItems(data);
            } catch (error) {
                console.error("Error loading library items:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    /**
   * Lọc danh sách tài nguyên theo bộ lọc danh mục hiện tại.
   *
   * @returns Mảng {@link LibraryItem} phù hợp với bộ lọc đang chọn.
   *         Trả về toàn bộ mảng nếu bộ lọc là 'filterAll'.
   */
    const filteredItems = items.filter(item => {
        if (activeFilter === 'filterAll') return true;
        if (activeFilter === 'filterVideos') return item.category === 'Videos';
        if (activeFilter === 'filterPDFs') return item.category === 'PDFs';
        if (activeFilter === 'filterArticles') return item.category === 'Articles';
        return true;
    });

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Unified Top Bar */}
            <View style={styles.topBar}>
                <View style={styles.logoRow}>
                    <Ionicons name="medical" size={20} color={colors.primary} />
                    <AppText variant="labelMd" style={styles.logoText}>TelePhysioAI</AppText>
                </View>
                <View style={styles.topBarIcons}>
                    <NotificationBell />
                    <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile' as any)}>
                        <Ionicons name="person" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('library.searchPlaceholder', 'Search exercises, guides, or videos...')}
                        placeholderTextColor="#94a3b8"
                    />
                </View>
            </View>

            {/* Filter Chips */}
            <View style={styles.chipsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                    {filters.map((filter) => (
                        <TouchableOpacity 
                            key={filter.key}
                            style={[styles.chip, activeFilter === filter.key && styles.chipActive]}
                            onPress={() => setActiveFilter(filter.key)}
                        >
                            <AppText variant="labelMd" style={activeFilter === filter.key ? styles.chipTextActive : styles.chipText}>
                                {filter.label}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Daily Tip Banner */}
                <View style={styles.card}>
                    <View style={styles.bannerImagePlaceholder}>
                        <Ionicons name="image-outline" size={48} color="#94a3b8" />
                        <View style={styles.dailyTipBadge}>
                            <AppText variant="labelSm" style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>DAILY TIP</AppText>
                        </View>
                    </View>
                    <View style={styles.bannerContent}>
                        <AppText variant="headlineMd" style={styles.cardTitle}>Morning Mobility Routine</AppText>
                        <AppText variant="bodyMd" style={styles.bannerDesc}>
              Start your day with these 5 gentle joint movements to reduce stiffness and improve blood flow before your first session.
                        </AppText>
                        <TouchableOpacity style={styles.readMoreBtn} onPress={() => Alert.alert('Guide', 'Opening article...')}>
                            <AppText variant="labelMd" style={{ color: colors.primary }}>{t('library.readGuide', 'Read full guide')}</AppText>
                            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Saved Exercises */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderBetween}>
                        <AppText variant="labelMd" style={styles.cardTitle}>Saved Exercises</AppText>
                        <Ionicons name="bookmark-outline" size={20} color={colors.primary} />
                    </View>
          
                    <TouchableOpacity style={styles.savedItem} onPress={() => navigation.navigate('Calibration' as any)}>
                        <View style={styles.savedItemIcon}>
                            <Ionicons name="play" size={20} color="#fff" />
                        </View>
                        <View style={styles.savedItemInfo}>
                            <AppText variant="labelMd" style={styles.savedItemTitle}>Wall Slides</AppText>
                            <AppText variant="bodySm" style={styles.savedItemSub}>Scapular Mobility • 3 Sets</AppText>
                        </View>
                        <Ionicons name="play-circle-outline" size={24} color="#64748b" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.savedItem} onPress={() => navigation.navigate('Calibration' as any)}>
                        <View style={styles.savedItemIcon}>
                            <Ionicons name="play" size={20} color="#fff" />
                        </View>
                        <View style={styles.savedItemInfo}>
                            <AppText variant="labelMd" style={styles.savedItemTitle}>Single-Leg Bridge</AppText>
                            <AppText variant="bodySm" style={styles.savedItemSub}>Glute Activation • 12 Reps</AppText>
                        </View>
                        <Ionicons name="play-circle-outline" size={24} color="#64748b" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.viewAllBtn} onPress={() => Alert.alert('Saved', 'Viewing all saved items.')}>
                        <AppText variant="labelMd" style={{ color: colors.primary }}>{t('library.viewAllSaved', 'View All Saved')}</AppText>
                    </TouchableOpacity>
                </View>

                {/* Educational Guides (Dynamic from Firebase) */}
                <View style={styles.sectionHeader}>
                    <AppText variant="labelMd" style={styles.cardTitle}>{t('library.educationalGuides', 'Educational Guides')}</AppText>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
                ) : filteredItems.length === 0 ? (
                    <View style={{ alignItems: 'center', padding: spacing.xl }}>
                        <AppText variant="bodyMd" style={{ color: '#64748b' }}>No items found for this category.</AppText>
                    </View>
                ) : (
                    filteredItems.map(item => {
                        const isVideo = item.category === 'Videos';
                        const isPdf = item.category === 'PDFs';
            
                        const iconName = isVideo ? 'play-outline' : isPdf ? 'document-text-outline' : 'reader-outline';
                        const iconBg = isVideo ? '#f1f5f9' : isPdf ? '#fef2f2' : '#f0fdf4';
                        const tagColor = item.tagColor || (isVideo ? '#2563eb' : isPdf ? '#ef4444' : '#047857');

                        return (
                            <TouchableOpacity key={item.id} style={styles.card} onPress={() => Alert.alert(item.category, `Opening ${item.title}`)}>
                                <View style={[styles.bannerImagePlaceholder, { height: 140, backgroundColor: iconBg }]}>
                                    {isVideo ? (
                                        <Ionicons name="play-circle" size={48} color={tagColor} />
                                    ) : (
                                        <Ionicons name={isPdf ? "document" : "medical-outline"} size={48} color={tagColor} />
                                    )}
                                    {item.duration && (
                                        <View style={styles.dailyTipBadge}>
                                            <AppText variant="labelSm" style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                                                {item.duration}
                                            </AppText>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.bannerContent}>
                                    <View style={styles.tagRow}>
                                        <Ionicons name={iconName} size={14} color={tagColor} />
                                        <AppText variant="labelSm" style={{ color: tagColor }}>{item.tag || item.category}</AppText>
                                    </View>
                                    <AppText variant="headlineMd" style={styles.guideTitle}>{item.title}</AppText>
                                    <AppText variant="bodyMd" style={styles.bannerDesc} numberOfLines={2}>
                                        {item.description}
                                    </AppText>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafd' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.sm },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
    topBarIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBtn: { padding: 4 },
    avatarBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  
    searchContainer: { paddingHorizontal: spacing.gutter, paddingVertical: spacing.sm },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: spacing.md, height: 44, borderWidth: 1, borderColor: '#e2e8f0' },
    searchIcon: { marginRight: spacing.sm },
    searchInput: { flex: 1, fontSize: 15, color: '#0f172a' },

    chipsWrapper: { marginBottom: spacing.md },
    chipsContainer: { paddingHorizontal: spacing.gutter, gap: spacing.sm },
    chip: { backgroundColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
    chipActive: { backgroundColor: colors.primary },
    chipText: { color: '#475569', fontWeight: '600' },
    chipTextActive: { color: '#fff', fontWeight: '600' },

    scroll: { flex: 1 },
    content: { padding: spacing.gutter, gap: spacing.lg, paddingBottom: spacing.xl * 2 },

    card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
    bannerImagePlaceholder: { height: 180, backgroundColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    dailyTipBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    bannerContent: { padding: spacing.lg },
    cardTitle: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
    bannerDesc: { color: '#475569', marginTop: spacing.xs, lineHeight: 22 },
    readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.md },
  
    cardHeaderBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
    savedItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: '#f8fafc', marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: 12 },
    savedItemIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    savedItemInfo: { flex: 1 },
    savedItemTitle: { color: '#0f172a', fontWeight: '600' },
    savedItemSub: { color: '#64748b', fontSize: 12 },
    viewAllBtn: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },

    sectionHeader: { marginTop: spacing.sm, marginBottom: -spacing.xs },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
    guideTitle: { color: '#0f172a', fontWeight: '700', fontSize: 18 },
});
