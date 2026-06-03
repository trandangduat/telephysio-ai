/**
 * @file LoginScreen.tsx
 * @description Màn hình đăng nhập bằng Email và Mật khẩu.
 */

import React, { useState } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AppText } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';
import { loginUser } from '../../services/firebase/authService';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

/**
 * Component màn hình đăng nhập.
 * @param props Thuộc tính của màn hình đăng nhập.
 * @returns Giao diện React Native của màn hình đăng nhập.
 */
export const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const { t } = useTranslation();
    const { setUser } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    /**
   * Kiểm tra hợp lệ các trường nhập liệu trong form đăng nhập.
   *
   * <p>Kiểm tra các điều kiện:
   * <ul>
   *   <li>Email không được để trống và phải đúng định dạng email</li>
   *   <li>Mật khẩu không được để trống và phải có tối thiểu 6 ký tự</li>
   * </ul>
   * Nếu có lỗi, cập nhật state {@code errors} để hiển thị thông báo lỗi.
   * </p>
   *
   * @returns {@code true} nếu tất cả các trường hợp lệ; {@code false} nếu có lỗi
   */
    const validate = (): boolean => {
        const e: typeof errors = {};
        if (!email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
        if (!password) e.password = 'Password is required';
        else if (password.length < 6) e.password = 'Minimum 6 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /**
   * Xử lý sự kiện đăng nhập của người dùng.
   *
   * <p>Thực hiện tuần tự:
   * <ol>
   *   <li>Kiểm tra hợp lệ form nhập liệu</li>
   *   <li>Gọi {@code loginUser} từ authService để xác thực với Firebase</li>
   *   <li>Cập nhật {@code AuthContext} với hồ sơ người dùng nhận được</li>
   *   <li>Nếu thất bại, hiển thị thông báo lỗi phù hợp với mã lỗi Firebase</li>
   * </ol>
   * Việc điều hướng sau đăng nhập do {@code AppNavigator} điều khiển tự động
   * khi {@code isAuthenticated} chuyển thành {@code true}.
   * </p>
   *
   * @returns Promise hoàn thành khi xử lý đăng nhập xong.
   */
    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const profile = await loginUser(email.trim(), password);
            setUser(profile);
            // Điều hướng được tự động xử lý bởi AppNavigator (isAuthenticated trở thành true)
        } catch (err: any) {
            let msg = 'Login failed. Please try again.';
            if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
            else if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
            else if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
            else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later.';
            Alert.alert('Login Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Hero Section */}
                    <View style={styles.hero}>
                        <View style={styles.heroGlow} />
                        <View style={styles.logoCircle}>
                            <Ionicons name="medical" size={36} color="#fff" />
                        </View>
                        <AppText variant="headlineLg" style={styles.heroTitle}>TelePhysioAI</AppText>
                        <AppText variant="bodyMd" style={styles.heroSubtitle}>
              AI-Powered Physical Therapy
                        </AppText>
                    </View>

                    {/* Login Card */}
                    <View style={styles.card}>
                        <AppText variant="headlineMd" style={styles.cardTitle}>Welcome Back</AppText>
                        <AppText variant="bodyMd" style={styles.cardSubtitle}>
              Sign in to continue your recovery journey
                        </AppText>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <AppText variant="labelMd" style={styles.inputLabel}>Email</AppText>
                            <View style={[styles.inputBox, errors.email ? styles.inputError : null]}>
                                <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="your@email.com"
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={(v) => { setEmail(v); setErrors(e => ({ ...e, email: undefined })); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                            {errors.email && <AppText variant="bodySm" style={styles.errorText}>{errors.email}</AppText>}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <AppText variant="labelMd" style={styles.inputLabel}>Password</AppText>
                            <View style={[styles.inputBox, errors.password ? styles.inputError : null]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    value={password}
                                    onChangeText={(v) => { setPassword(v); setErrors(e => ({ ...e, password: undefined })); }}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <AppText variant="bodySm" style={styles.errorText}>{errors.password}</AppText>}
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity style={styles.forgotBtn} onPress={() => Alert.alert('Reset Password', 'Password reset email will be sent.')}>
                            <AppText variant="labelSm" style={{ color: colors.primary }}>Forgot Password?</AppText>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.primaryBtn, loading && styles.btnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <AppText variant="labelMd" style={styles.primaryBtnText}>Sign In</AppText>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <AppText variant="labelSm" style={styles.dividerText}>or</AppText>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Sign Up Link */}
                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={() => navigation.navigate('SignUp')}
                        >
                            <AppText variant="labelMd" style={styles.secondaryBtnText}>Create New Account</AppText>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <AppText variant="bodySm" style={styles.footer}>
            By signing in, you agree to our Terms of Service and Privacy Policy
                    </AppText>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f8fafd' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.gutter },

    // Phần chính (Hero)
    hero: { alignItems: 'center', marginBottom: spacing.xl, position: 'relative' },
    heroGlow: {
        position: 'absolute', top: -40, width: 200, height: 200, borderRadius: 100,
        backgroundColor: colors.primary, opacity: 0.06,
    },
    logoCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.md,
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    },
    heroTitle: { color: colors.primary, fontWeight: '800', fontSize: 28, letterSpacing: -0.5 },
    heroSubtitle: { color: '#64748b', marginTop: 4 },

    // Thẻ
    card: {
        backgroundColor: '#fff', borderRadius: 24, padding: spacing.xl,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06, shadowRadius: 24, elevation: 5,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    cardTitle: { color: '#0f172a', fontWeight: '800', fontSize: 22, marginBottom: 4 },
    cardSubtitle: { color: '#64748b', marginBottom: spacing.xl },

    // Trường nhập
    inputGroup: { marginBottom: spacing.lg },
    inputLabel: { color: '#334155', fontWeight: '600', marginBottom: 8 },
    inputBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#f8fafc', borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        borderWidth: 1.5, borderColor: '#e2e8f0',
    },
    inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
    textInput: { flex: 1, fontSize: 15, color: '#0f172a', fontFamily: 'Inter_400Regular' },
    errorText: { color: '#ef4444', marginTop: 4, fontSize: 12 },

    forgotBtn: { alignSelf: 'flex-end', marginBottom: spacing.lg, marginTop: -spacing.sm },

    // Nút bấm
    primaryBtn: {
        backgroundColor: colors.primary, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, borderRadius: 100,
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
    },
    btnDisabled: { opacity: 0.7 },
    primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
    dividerText: { color: '#94a3b8', marginHorizontal: 16 },

    secondaryBtn: {
        borderWidth: 1.5, borderColor: colors.primary,
        paddingVertical: 14, borderRadius: 100, alignItems: 'center',
    },
    secondaryBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },

    footer: { color: '#94a3b8', textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },
});
