import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { colors, radius, typography, spacing } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  rightIcon,
  containerStyle,
  isPassword = false,
  ...textInputProps
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.primary
    : colors.outlineVariant;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          { borderColor },
          focused && styles.focusedContainer,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.onSurfaceVariant}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...textInputProps}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.icon}
          >
            <Text style={styles.iconText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <View style={styles.icon}>{rightIcon}</View>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  focusedContainer: {
    boxShadow: '0px 0px 0px 3px rgba(0,71,141,0.12)',
  } as ViewStyle,
  input: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  icon: {
    paddingLeft: spacing.sm,
  },
  iconText: {
    fontSize: 18,
  },
  errorText: {
    ...typography.labelSm,
    color: colors.error,
  },
  hintText: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
});
