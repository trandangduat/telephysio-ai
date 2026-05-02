import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signUp, UserRole } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors, typography, spacing, radius } from '../../theme';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

interface Props {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
}

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  {
    value: 'patient',
    label: 'Bệnh nhân',
    icon: '🏃',
    desc: 'Thực hiện bài tập & theo dõi tiến độ hồi phục',
  },
  {
    value: 'doctor',
    label: 'Bác sĩ / Chuyên viên',
    icon: '👨‍⚕️',
    desc: 'Theo dõi bệnh nhân & điều chỉnh phác đồ điều trị',
  },
];

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { setUser, isLoading, setLoading } = useAuthStore();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email không hợp lệ';
    if (!password) e.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!confirmPassword) e.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (password !== confirmPassword) e.confirmPassword = 'Mật khẩu không khớp';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await signUp(email.trim().toLowerCase(), password, name.trim(), role);
      setUser(user);
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'Email này đã được đăng ký. Vui lòng dùng email khác.'
          : err.code === 'auth/weak-password'
          ? 'Mật khẩu quá yếu.'
          : 'Đăng ký thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi đăng ký', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>
              Điền thông tin để bắt đầu hành trình phục hồi của bạn
            </Text>
          </View>

          {/* Role Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bạn là ai?</Text>
            <View style={styles.roleContainer}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleCard,
                    role === r.value && styles.roleCardActive,
                  ]}
                  onPress={() => setRole(r.value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.roleIcon}>{r.icon}</Text>
                  <Text
                    style={[
                      styles.roleLabel,
                      role === r.value && styles.roleLabelActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                  {role === r.value && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Thông tin cá nhân</Text>
            <View style={styles.fields}>
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                error={errors.name}
              />
              <Input
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
              />
              <Input
                label="Mật khẩu"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChangeText={setPassword}
                isPassword
                error={errors.password}
              />
              <Input
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                error={errors.confirmPassword}
              />
            </View>
          </View>

          <Button
            title="Tạo tài khoản"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            size="lg"
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Đã có tài khoản?{' '}
              <Text style={styles.loginHighlight}>Đăng nhập</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  backBtn: {
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: colors.primary,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  roleContainer: {
    gap: spacing.sm,
  },
  roleCard: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    position: 'relative',
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  roleIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  roleLabel: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: 2,
  },
  roleLabelActive: {
    color: colors.primary,
  },
  roleDesc: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  fields: {
    gap: spacing.md,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  loginText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  loginHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
});
