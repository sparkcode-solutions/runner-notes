import { useCoach } from '@/lib/coach-context';
import { useTheme } from '@/lib/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

const ORB_SIZE = 56; // Matching FAB size

export const CoachOrb = () => {
    const theme = useTheme();
    const { greeting, icon } = useCoach();
    const [isOpen, setIsOpen] = useState(false);

    // Animation values
    const breath = useSharedValue(1);

    React.useEffect(() => {
        // Continuous breathing effect - subtle pulse
        breath.value = withRepeat(
            withTiming(1.05, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedOrbStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breath.value }],
    }));

    const handlePress = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setTimeout(() => setIsOpen(false), 5000); // reduced to 5s for better UX
        }
    };

    return (
        <View style={styles.container}>
            {/* Message Bubble - Positioned above */}
            {isOpen && (
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(300)}
                    style={[styles.bubble, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
                >
                    <Text style={[styles.bubbleText, { color: theme.colors.textPrimary }]}>
                        {greeting}
                    </Text>
                </Animated.View>
            )}

            {/* The Athlete "Orb" */}
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                <Animated.View
                    style={[
                        styles.orb,
                        {
                            backgroundColor: theme.colors.surfaceElevated,
                            borderColor: theme.colors.accent,
                            shadowColor: theme.colors.accent,
                        },
                        animatedOrbStyle
                    ]}
                >
                    <MaterialCommunityIcons name={icon} size={28} color={theme.colors.accent} />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 32, // Aligned with FAB
        left: 24,   // Opposite of FAB
        alignItems: 'flex-start', // Align bubble to left
        zIndex: 100,
    },
    bubble: {
        marginBottom: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderBottomLeftRadius: 0, // Speech bubble tail feel
        borderWidth: 1,
        width: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    bubbleText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    orb: {
        width: ORB_SIZE,
        height: ORB_SIZE,
        borderRadius: ORB_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        borderWidth: 1.5,
    },
});
