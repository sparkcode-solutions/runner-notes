import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../../lib/auth-context';
import { runnerTheme } from '../../constants/theme';

export default function SignInScreen() {
  const { signInWithApple } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message || 'Failed to sign in with Apple');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Runner Notes</Text>
          <Text style={styles.subtitle}>Track your running journey</Text>
        </View>

        <View style={styles.features}>
          <FeatureItem text="Record your run moments" />
          <FeatureItem text="Track pace and distance" />
          <FeatureItem text="Journal your thoughts" />
          <FeatureItem text="Capture memories on the go" />
        </View>

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={12}
            style={styles.appleButton}
            onPress={handleSignIn}
          />
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={runnerTheme.colors.accent} />
          </View>
        )}
      </View>
    </View>
  );
}

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureDot} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: runnerTheme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: runnerTheme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: runnerTheme.spacing.xl * 2,
  },
  title: {
    fontSize: runnerTheme.fontSize.xxl,
    fontWeight: '700',
    color: runnerTheme.colors.textPrimary,
    marginBottom: runnerTheme.spacing.sm,
  },
  subtitle: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textSecondary,
  },
  features: {
    width: '100%',
    marginBottom: runnerTheme.spacing.xl * 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: runnerTheme.spacing.md,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: runnerTheme.colors.accent,
    marginRight: runnerTheme.spacing.md,
  },
  featureText: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textPrimary,
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  loadingContainer: {
    marginTop: runnerTheme.spacing.lg,
  },
});
