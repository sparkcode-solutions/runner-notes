import { useAuth } from '@/lib/auth-context';
import { useCoach } from '@/lib/coach-context';
import { useRunMoments } from '@/lib/hooks/use-run-moments';
import { ReflectionEngine } from '@/lib/reflection';
import { useTheme } from '@/lib/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

type Suggestion = {
    type: 'recovery' | 'steady' | 'push';
    text: string;
    reason: string;
};

const SUGGESTION_META: Record<Suggestion['type'], { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
    recovery: { icon: 'leaf-outline', label: 'Recovery' },
    steady: { icon: 'pulse-outline', label: 'Steady' },
    push: { icon: 'flash-outline', label: 'Push' },
};

export default function CoachScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { greeting, weather, icon, isNight, isLoading: coachLoading, refresh } = useCoach();
    const { runMoments } = useRunMoments({ userId: user.id });

    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [suggestionLoading, setSuggestionLoading] = useState(true);

    const breath = useSharedValue(1);

    useEffect(() => {
        breath.value = withRepeat(
            withTiming(1.06, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedOrb = useAnimatedStyle(() => ({
        transform: [{ scale: breath.value }],
    }));

    const loadSuggestion = async () => {
        setSuggestionLoading(true);
        try {
            const result = await ReflectionEngine.getRunSuggestion(runMoments);
            setSuggestion(result);
        } catch {
            setSuggestion(ReflectionEngine.getRunSuggestionSync(runMoments));
        } finally {
            setSuggestionLoading(false);
        }
    };

    useEffect(() => {
        if (runMoments) loadSuggestion();
    }, [runMoments.length]);

    const handleRefresh = async () => {
        await Promise.all([refresh(), loadSuggestion()]);
    };

    const handleStartRun = () => {
        router.replace({ pathname: '/run/create', params: { autoStart: 'true' } });
    };

    const meta = suggestion ? SUGGESTION_META[suggestion.type] : null;
    const mode = user.coachMode ?? 'mindful';

    return (
        <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>The Reflection</Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.headerBtn}>
                    <Ionicons name="refresh" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.orbWrap}>
                    <Animated.View
                        style={[
                            styles.orb,
                            {
                                backgroundColor: theme.colors.surfaceElevated,
                                borderColor: theme.colors.accent,
                                shadowColor: theme.colors.accent,
                            },
                            animatedOrb,
                        ]}
                    >
                        <MaterialCommunityIcons name={icon} size={56} color={theme.colors.accent} />
                    </Animated.View>
                    <Text style={[styles.modeBadge, { color: theme.colors.textMuted, borderColor: theme.colors.border }]}>
                        {mode.toUpperCase()} MODE
                    </Text>
                </View>

                <View style={[styles.greetingCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                    {coachLoading ? (
                        <ActivityIndicator color={theme.colors.accent} />
                    ) : (
                        <Text style={[styles.greetingText, { color: theme.colors.textPrimary, fontFamily: theme.fonts.body }]}>
                            {greeting}
                        </Text>
                    )}
                </View>

                {weather && (
                    <View style={[styles.weatherRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <View style={styles.weatherItem}>
                            <Text style={[styles.weatherLabel, { color: theme.colors.textMuted }]}>TEMP</Text>
                            <Text style={[styles.weatherValue, { color: theme.colors.textPrimary }]}>
                                {Math.round(weather.temp)}°C
                            </Text>
                        </View>
                        <View style={[styles.weatherDivider, { backgroundColor: theme.colors.border }]} />
                        <View style={styles.weatherItem}>
                            <Text style={[styles.weatherLabel, { color: theme.colors.textMuted }]}>SKY</Text>
                            <Text style={[styles.weatherValue, { color: theme.colors.textPrimary }]}>
                                {weather.condition}
                            </Text>
                        </View>
                        <View style={[styles.weatherDivider, { backgroundColor: theme.colors.border }]} />
                        <View style={styles.weatherItem}>
                            <Text style={[styles.weatherLabel, { color: theme.colors.textMuted }]}>TIME</Text>
                            <Text style={[styles.weatherValue, { color: theme.colors.textPrimary }]}>
                                {isNight ? 'Night' : 'Day'}
                            </Text>
                        </View>
                    </View>
                )}

                <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>SUGGESTION</Text>
                <View style={[styles.suggestionCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                    {suggestionLoading || !suggestion || !meta ? (
                        <ActivityIndicator color={theme.colors.accent} />
                    ) : (
                        <>
                            <View style={styles.suggestionHeader}>
                                <View style={[styles.suggestionPill, { backgroundColor: theme.colors.accentSoft }]}>
                                    <Ionicons name={meta.icon} size={14} color={theme.colors.accent} />
                                    <Text style={[styles.suggestionPillText, { color: theme.colors.accent }]}>
                                        {meta.label}
                                    </Text>
                                </View>
                                <Text style={[styles.suggestionReason, { color: theme.colors.textMuted }]}>
                                    {suggestion.reason}
                                </Text>
                            </View>
                            <Text style={[styles.suggestionText, { color: theme.colors.textPrimary, fontFamily: theme.fonts.body }]}>
                                {suggestion.text}
                            </Text>
                        </>
                    )}
                </View>

                <TouchableOpacity
                    onPress={handleStartRun}
                    style={[styles.cta, { backgroundColor: theme.colors.accent }]}
                    activeOpacity={0.85}
                >
                    <Ionicons name="play" size={18} color={theme.colors.background} />
                    <Text style={[styles.ctaText, { color: theme.colors.background }]}>Start a Run</Text>
                </TouchableOpacity>

                <Text style={[styles.footnote, { color: theme.colors.textMuted }]}>
                    Generated on-device. The coach reflects, never praises.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 48,
    },
    orbWrap: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    orb: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    modeBadge: {
        marginTop: 16,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.5,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        overflow: 'hidden',
    },
    greetingCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        minHeight: 80,
        justifyContent: 'center',
    },
    greetingText: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '500',
    },
    weatherRow: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        marginBottom: 24,
    },
    weatherItem: {
        flex: 1,
        alignItems: 'center',
    },
    weatherLabel: {
        fontSize: 10,
        letterSpacing: 1,
        fontWeight: '600',
        marginBottom: 4,
    },
    weatherValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    weatherDivider: {
        width: 1,
        marginHorizontal: 8,
    },
    sectionLabel: {
        fontSize: 11,
        letterSpacing: 1.5,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    suggestionCard: {
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
        minHeight: 110,
    },
    suggestionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    suggestionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
    },
    suggestionPillText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    suggestionReason: {
        fontSize: 11,
        flexShrink: 1,
        textAlign: 'right',
        marginLeft: 8,
    },
    suggestionText: {
        fontSize: 16,
        lineHeight: 24,
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
        marginBottom: 16,
    },
    ctaText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    footnote: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
    },
});
