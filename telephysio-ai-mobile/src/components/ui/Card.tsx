import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = false,
  padding = 'md',
}) => {
  return (
    <View
      style={[
        styles.base,
        elevated ? styles.elevated : styles.flat,
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  flat: {
    boxShadow: '0px 1px 3px rgba(0,71,141,0.06)',
  } as ViewStyle,
  elevated: {
    boxShadow: '0px 4px 12px rgba(0, 94, 184, 0.08)',
  } as ViewStyle,
});
