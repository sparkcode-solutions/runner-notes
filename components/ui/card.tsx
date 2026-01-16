import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { runnerTheme } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: runnerTheme.colors.surface,
    borderRadius: runnerTheme.borderRadius.lg,
    padding: runnerTheme.spacing.md,
    borderWidth: 1,
    borderColor: runnerTheme.colors.border,
  },
});
