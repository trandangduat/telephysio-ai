/**
 * Card — Level 1 (standard) & Level 2 (floating / active).
 *
 * Usage:
 *   <Card>...</Card>                   // Level 1
 *   <Card level={2}>...</Card>         // Level 2 floating shadow
 *   <Card onPress={fn}>...</Card>      // touchable card
 */

import React from 'react';
import {
  View,
  ViewProps,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme';

interface CardProps extends ViewProps {
  level?: 1 | 2;
  onPress?: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  level = 1,
  onPress,
  style,
  children,
  ...rest
}) => {
  const cardStyle: ViewStyle[] = [
    styles.base,
    level === 1 ? styles.level1 : styles.level2,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={cardStyle}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    borderCurve: 'continuous',
  } as ViewStyle,
  level1: {
    ...shadows.card,
  } as ViewStyle,
  level2: {
    ...shadows.floating,
  } as ViewStyle,
});
