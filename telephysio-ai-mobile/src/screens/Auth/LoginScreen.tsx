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
import { signIn } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors, typography, spacing, radius } from '../../theme';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

interface Props {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setUser, isLoading, setLoading } = useAuthStore();

  const validate = () => {
    let valid = true;
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email không hợp lệ');
      valid = false;
    } else {
      setEmailError('');
    }
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await signIn(email.trim().toLowerCase(), password);
      setUser(user);
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
          ? 'Email hoặc mật khẩu không đúng'
          : err.code === 'auth/too-many-requests'
          ? 'Quá nhiều lần thử. Vui lòng thử lại sau.'
          : 'Đăng nhập thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi đăng nhập', msg);
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
          {/* Logo & Brand */}
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Text style={styles.logoIcon}>⚡</Text>
            </View>
            <Text style={styles.logoTitle}>
              <Text style={{ color: colors.primary }}>TelePhysio</Text>
              <Text style={{ color: colors.tertiary, fontWeight: '700' }}>AI</Text>
            </Text>
            <Text style={styles.logoSub}>Phục hồi thông minh, mọi lúc mọi nơi</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Đăng nhập</Text>
            <Text style={styles.formSub}>
              Chào mừng trở lại! Đăng nhập để tiếp tục hành trình hồi phục.
            </Text>

            <View style={styles.fields}>
              <Input
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
              />
              <Input
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                isPassword
                error={passwordError}
              />
            </View>

            <Button
              title="Đăng nhập"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              size="lg"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                Chưa có tài khoản?{' '}
                <Text style={styles.registerHighlight}>Đăng ký ngay</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
  },
  brand: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    boxShadow: '0px 8px 24px rgba(0,71,141,0.2)',
  } as any,
  logoIcon: {
    fontSize: 32,
  },
  logoTitle: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.onSurface,
  },
  logoSub: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  formTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  formSub: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: -spacing.sm,
  },
  fields: {
    gap: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  dividerText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  registerText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  registerHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
});
