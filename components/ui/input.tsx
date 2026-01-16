import React from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { runnerTheme } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={runnerTheme.colors.textSecondary}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: runnerTheme.spacing.md,
  },
  label: {
    fontSize: runnerTheme.fontSize.sm,
    color: runnerTheme.colors.textSecondary,
    marginBottom: runnerTheme.spacing.xs,
  },
  input: {
    backgroundColor: runnerTheme.colors.surface,
    borderRadius: runnerTheme.borderRadius.md,
    padding: runnerTheme.spacing.md,
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textPrimary,
    borderWidth: 1,
    borderColor: runnerTheme.colors.border,
  },
  inputError: {
    borderColor: runnerTheme.colors.error,
  },
  error: {
    fontSize: runnerTheme.fontSize.xs,
    color: runnerTheme.colors.error,
    marginTop: runnerTheme.spacing.xs,
  },
});
