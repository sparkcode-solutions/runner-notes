import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { useTheme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    View
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const theme = useTheme();
    const { user, refreshUser } = useAuth();
    const [step, setStep] = useState(0);
    const [isPrivacyEnabled, setIsPrivacyEnabled] = useState(true);
    const [calibration, setCalibration] = useState<'mindful' | 'performance' | null>(null);

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        if (!user || !user.id || !calibration) return;

        try {
            // Update user with selected coach mode
            await db.update(users)
                .set({ coachMode: calibration })
                .where(eq(users.id, user.id));

            await refreshUser();
            console.log('User updated:', user);
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error saving onboarding preference:', error);
        }
    };

    const renderStep0 = () => (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.stepContainer}
        >
            <View style={styles.centerContent}>
                <Ionicons name="moon-outline" size={48} color={theme.colors.textPrimary} style={{ marginBottom: 24, opacity: 0.8 }} />
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                    This is a place for the runs you don't want to post.
                </Text>
            </View>
            <Pressable
                style={[styles.button, { backgroundColor: theme.colors.textPrimary }]}
                onPress={handleNext}
            >
                <Text style={[styles.buttonText, { color: theme.colors.background }]}>Begin</Text>
            </Pressable>
        </Animated.View>
    );

    const renderStep1 = () => (
        <Animated.View
            entering={SlideInRight}
            exiting={SlideOutLeft}
            style={styles.stepContainer}
        >
            <View style={styles.centerContent}>
                <Ionicons name="lock-closed-outline" size={48} color={theme.colors.textPrimary} style={{ marginBottom: 24, opacity: 0.8 }} />
                <Text style={[styles.title, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                    Privacy First
                </Text>
                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                    "The Silent Partner" runs entirely on your phone. Your thoughts never leave this device.
                </Text>

                <View style={[styles.toggleRow, { borderColor: theme.colors.border }]}>
                    <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>
                        On-Device Processing
                    </Text>
                    <Switch
                        value={isPrivacyEnabled}
                        onValueChange={setIsPrivacyEnabled}
                        trackColor={{ false: theme.colors.border, true: theme.colors.success }}
                        thumbColor={'#fff'}
                    />
                </View>
            </View>
            <Pressable
                style={[styles.button, { backgroundColor: theme.colors.textPrimary }]}
                onPress={handleNext}
            >
                <Text style={[styles.buttonText, { color: theme.colors.background }]}>Next</Text>
            </Pressable>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View
            entering={SlideInRight}
            exiting={FadeOut}
            style={styles.stepContainer}
        >
            <View style={styles.centerContent}>
                <Ionicons name="options-outline" size={48} color={theme.colors.textPrimary} style={{ marginBottom: 24, opacity: 0.8 }} />
                <Text style={[styles.title, { color: theme.colors.textPrimary, marginBottom: 32 }]}>
                    Calibration
                </Text>
                <Text style={[styles.question, { color: theme.colors.textSecondary }]}>
                    When you run, what are you looking for?
                </Text>

                <Pressable
                    style={[
                        styles.choiceButton,
                        { borderColor: theme.colors.border },
                        calibration === 'performance' && { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentSoft }
                    ]}
                    onPress={() => setCalibration('performance')}
                >
                    <Text style={[styles.choiceTitle, { color: theme.colors.textPrimary }]}>A Personal Record</Text>
                    <Text style={[styles.choiceDesc, { color: theme.colors.textSecondary }]}>Focus on pace, distance, and gains.</Text>
                </Pressable>

                <Pressable
                    style={[
                        styles.choiceButton,
                        { borderColor: theme.colors.border },
                        calibration === 'mindful' && { borderColor: theme.colors.success, backgroundColor: 'rgba(34, 197, 94, 0.1)' }
                    ]}
                    onPress={() => setCalibration('mindful')}
                >
                    <Text style={[styles.choiceTitle, { color: theme.colors.textPrimary }]}>Peace of Mind</Text>
                    <Text style={[styles.choiceDesc, { color: theme.colors.textSecondary }]}>Focus on clarity, feeling, and flow.</Text>
                </Pressable>
            </View>

            <Pressable
                style={[
                    styles.button,
                    { backgroundColor: theme.colors.textPrimary, opacity: calibration ? 1 : 0.5 }
                ]}
                onPress={handleNext}
                disabled={!calibration}
            >
                <Text style={[styles.buttonText, { color: theme.colors.background }]}>Enter Sanctuary</Text>
            </Pressable>
        </Animated.View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                {step === 0 && renderStep0()}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '300',
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    question: {
        fontSize: 18, // Slightly larger
        fontWeight: '500',
        marginBottom: 32,
        textAlign: 'center',
    },
    button: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: 16,
        borderWidth: 1,
        borderRadius: 16,
        maxWidth: 340,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    choiceButton: {
        width: '100%',
        padding: 20,
        borderWidth: 1,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    choiceTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    choiceDesc: {
        fontSize: 14,
        textAlign: 'center',
    },
});
