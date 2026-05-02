import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

interface InsightBlockProps {
  mode: 'prompt' | 'insight';
  text: string;
  hasNewContent?: boolean; // Trigger glow animation when content is fresh
}

/**
 * InsightBlock - The AI "Reflection" display
 * 
 * Two modes:
 * - Prompt: Curious, asks questions when no journal exists
 * - Insight: Observational, reflects on journal + run data
 */
export const InsightBlock: React.FC<InsightBlockProps> = ({
  mode,
  text,
  hasNewContent = false,
}) => {
  const theme = useTheme();
  const glowOpacity = useSharedValue(1);

  // AI Glow effect - slow pulsing when content is fresh
  useEffect(() => {
    if (hasNewContent) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        3, // Pulse 3 times
        false
      );
    } else {
      glowOpacity.value = 1;
    }
  }, [hasNewContent, text]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const isPromptMode = mode === 'prompt';
  const iconName = isPromptMode ? 'help-circle-outline' : 'bulb-outline';
  const labelText = isPromptMode ? 'The Question' : 'The Reflection';

  return (
    <View style={[
      styles.container,
      { borderBottomColor: theme.colors.border }
    ]}>
      {/* Header with icon and label */}
      <View style={styles.header}>
        <Ionicons 
          name={iconName} 
          size={16} 
          color={theme.colors.textMuted} 
        />
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>
          {labelText}
        </Text>
      </View>

      {/* AI-generated text with glow animation */}
      <Animated.View style={animatedTextStyle}>
        <Text 
          style={[
            styles.text,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.body,
              fontStyle: isPromptMode ? 'italic' : 'normal',
            }
          ]}
        >
          {text}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});
