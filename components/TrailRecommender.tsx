import { useTheme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Recommendation {
    type: 'recovery' | 'steady' | 'push';
    text: string;
    reason: string;
}

interface TrailRecommenderProps {
    suggestion: Recommendation;
    onPress?: () => void;
}

export const TrailRecommender: React.FC<TrailRecommenderProps> = ({
    suggestion,
    onPress
}) => {
    const theme = useTheme();

    useEffect(() => {
        // Subtle haptic cue when the recommendation appears
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const getIcon = () => {
        switch (suggestion.type) {
            case 'recovery': return 'leaf-outline';
            case 'push': return 'flame-outline';
            default: return 'pulse-outline';
        }
    };

    const getColor = () => {
        switch (suggestion.type) {
            case 'recovery': return theme.colors.success;
            case 'push': return theme.colors.accent;
            default: return theme.colors.textPrimary;
        }
    };

    return (
        <Animated.View entering={FadeInUp.delay(200)}>
            <Pressable
                style={[
                    styles.container,
                    {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.border
                    }
                ]}
                onPress={onPress}
            >
                <View style={styles.header}>
                    <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                        <Ionicons name="sparkles" size={12} color={theme.colors.accent} />
                        <Text style={[styles.badgeText, { color: theme.colors.accent }]}>AI Insight</Text>
                    </View>
                    <Text style={[styles.reason, { color: theme.colors.textSecondary }]}>{suggestion.reason}</Text>
                </View>

                <View style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                        <Ionicons name={getIcon()} size={24} color={getColor()} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.suggestionText, { color: theme.colors.textPrimary }]}>
                            {suggestion.text}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    reason: {
        fontSize: 11,
        fontStyle: 'italic',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    suggestionText: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
});
