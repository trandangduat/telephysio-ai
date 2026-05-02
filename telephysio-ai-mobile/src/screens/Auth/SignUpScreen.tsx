/**
 * SignUpScreen — Register new patient or doctor account.
 *
 * Connected to: authService.registerUser → Firebase Auth + Firestore users
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
import { colors, spacing } from '../../theme';
import { registerUser } from '../../services/firebase/authService';
import { useAuth } from '../../contexts/AuthContext';
import type { AuthStackParamList } from '../../navigation/types';
import type { UserRole } from '../../services/firebase/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { setUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const profile = await registerUser(email.trim(), password, displayName.trim(), role);
      setUser(profile);
      // Navigation handled automatically by AppNavigator
    } catch (err: any) {
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
      else if (err.code === 'auth/weak-password') msg = 'Password is too weak. Use at least 6 characters.';
      else if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
      Alert.alert('Sign Up Error', msg);
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
          {/* Back + Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <AppText variant="headlineLg" style={styles.title}>Create Account</AppText>
            <AppText variant="bodyMd" style={styles.subtitle}>
              Join TelePhysioAI and start your recovery journey
            </AppText>
          </View>

          {/* Role Selector */}
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'patient' && styles.roleBtnActive]}
              onPress={() => setRole('patient')}
            >
              <View style={[styles.roleIcon, role === 'patient' && styles.roleIconActive]}>
                <Ionicons name="person-outline" size={22} color={role === 'patient' ? '#fff' : '#64748b'} />
              </View>
              <AppText variant="labelMd" style={[styles.roleLabel, role === 'patient' && styles.roleLabelActive]}>
                Patient
              </AppText>
              <AppText variant="bodySm" style={styles.roleDesc}>
                Track recovery & exercises
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, role === 'doctor' && styles.roleBtnActiveDoc]}
              onPress={() => setRole('doctor')}
            >
              <View style={[styles.roleIcon, role === 'doctor' && styles.roleIconActiveDoc]}>
                <Ionicons name="medical-outline" size={22} color={role === 'doctor' ? '#fff' : '#64748b'} />
              </View>
              <AppText variant="labelMd" style={[styles.roleLabel, role === 'doctor' && styles.roleLabelActiveDoc]}>
                Doctor
              </AppText>
              <AppText variant="bodySm" style={styles.roleDesc}>
                Manage patients & assign
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <AppText variant="labelMd" style={styles.inputLabel}>Full Name</AppText>
              <View style={[styles.inputBox, errors.displayName ? styles.inputError : null]}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.textInput}
                  placeholder={role === 'doctor' ? 'Dr. Your Name' : 'Your Full Name'}
                  placeholderTextColor="#94a3b8"
                  value={displayName}
                  onChangeText={(v) => { setDisplayName(v); setErrors(e => ({ ...e, displayName: '' })); }}
                  autoCapitalize="words"
                />
              </View>
              {!!errors.displayName && <AppText variant="bodySm" style={styles.errorText}>{errors.displayName}</AppText>}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <AppText variant="labelMd" style={styles.inputLabel}>Email</AppText>
              <View style={[styles.inputBox, errors.email ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.textInput}
                  placeholder="your@email.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors(e => ({ ...e, email: '' })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {!!errors.email && <AppText variant="bodySm" style={styles.errorText}>{errors.email}</AppText>}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <AppText variant="labelMd" style={styles.inputLabel}>Password</AppText>
              <View style={[styles.inputBox, errors.password ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors(e => ({ ...e, password: '' })); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              {!!errors.password && <AppText variant="bodySm" style={styles.errorText}>{errors.password}</AppText>}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <AppText variant="labelMd" style={styles.inputLabel}>Confirm Password</AppText>
              <View style={[styles.inputBox, errors.confirmPassword ? styles.inputError : null]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setErrors(e => ({ ...e, confirmPassword: '' })); }}
                  secureTextEntry={!showPassword}
                />
              </View>
              {!!errors.confirmPassword && <AppText variant="bodySm" style={styles.errorText}>{errors.confirmPassword}</AppText>}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <AppText variant="labelMd" style={styles.primaryBtnText}>Create Account</AppText>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Already have account */}
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <AppText variant="bodyMd" style={{ color: '#64748b' }}>
              Already have an account?{' '}
              <AppText variant="labelMd" style={{ color: colors.primary }}>Sign In</AppText>
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafd' },
  scrollContent: { padding: spacing.gutter, paddingBottom: spacing.xl * 2 },

  headerRow: { marginBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },

  header: { marginBottom: spacing.xl },
  title: { color: '#0f172a', fontWeight: '800', fontSize: 28, marginBottom: 4 },
  subtitle: { color: '#64748b' },

  // Role Selector
  roleSelector: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  roleBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: spacing.lg,
    borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', gap: 8,
  },
  roleBtnActive: { borderColor: colors.primary, backgroundColor: '#f0f7ff' },
  roleBtnActiveDoc: { borderColor: '#0f766e', backgroundColor: '#f0fdfa' },
  roleIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  roleIconActive: { backgroundColor: colors.primary },
  roleIconActiveDoc: { backgroundColor: '#0f766e' },
  roleLabel: { color: '#475569', fontWeight: '700', fontSize: 15 },
  roleLabelActive: { color: colors.primary },
  roleLabelActiveDoc: { color: '#0f766e' },
  roleDesc: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 24, elevation: 5,
    borderWidth: 1, borderColor: '#f1f5f9',
  },

  // Inputs
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

  // Buttons
  primaryBtn: {
    backgroundColor: colors.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 100, marginTop: spacing.sm,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  loginLink: { alignItems: 'center', marginTop: spacing.xl },
});
