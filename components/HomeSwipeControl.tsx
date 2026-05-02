import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolate,
    interpolate,
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { runnerTheme } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BUTTON_WIDTH = 64;
const CONTAINER_WIDTH = SCREEN_WIDTH - 48; // Padding 24 * 2
const SWIPE_LIMIT = CONTAINER_WIDTH / 2 - BUTTON_WIDTH / 2;
const SNAP_THRESHOLD = SWIPE_LIMIT * 0.7;

interface HomeSwipeControlProps {
    onSwipeRight: () => void;
    onSwipeLeft: () => void;
}

export const HomeSwipeControl: React.FC<HomeSwipeControlProps> = ({
    onSwipeRight,
    onSwipeLeft,
}) => {
    const translateX = useSharedValue(0);
    const contextX = useSharedValue(0);

    const pan = Gesture.Pan()
        .onStart(() => {
            contextX.value = translateX.value;
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + contextX.value;

            // Limit the drag
            if (translateX.value > SWIPE_LIMIT) translateX.value = SWIPE_LIMIT;
            if (translateX.value < -SWIPE_LIMIT) translateX.value = -SWIPE_LIMIT;
        })
        .onEnd(() => {
            if (translateX.value > SNAP_THRESHOLD) {
                // Swiped Right (Run)
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
                runOnJS(onSwipeRight)();
                translateX.value = withSpring(0);
            } else if (translateX.value < -SNAP_THRESHOLD) {
                // Swiped Left (Coach)
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
                runOnJS(onSwipeLeft)();
                translateX.value = withSpring(0);
            } else {
                // Spring back
                translateX.value = withSpring(0);
            }
        });

    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
        };
    });

    const animatedLeftTextStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [0, -SNAP_THRESHOLD],
            [0, 1],
            Extrapolate.CLAMP
        );
        return { opacity };
    });

    const animatedRightTextStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [0, SNAP_THRESHOLD],
            [0, 1],
            Extrapolate.CLAMP
        );
        return { opacity };
    });

    const animatedBackgroundStyle = useAnimatedStyle(() => {
        // Interpolate background color based on position
        // Default: dark/blur, Left: Blue/Purple (Coach), Right: Green/Accent (Run)
        const backgroundColor = interpolateColor(
            translateX.value,
            [-SWIPE_LIMIT, 0, SWIPE_LIMIT],
            ['#4F46E5', '#1F2937', runnerTheme.colors.accent]
        );
        return { backgroundColor };
    });

    return (
        <View style={styles.wrapper}>
            <Animated.View style={[styles.container, animatedBackgroundStyle]}>
                {/* Background Text Labels */}
                <View style={styles.labelsContainer}>
                    <View style={styles.labelWrapper}>
                        <Animated.Text style={[styles.labelText, styles.leftLabel, animatedLeftTextStyle]}>
                            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" /> Coach
                        </Animated.Text>
                    </View>
                    <View style={styles.labelWrapper}>
                        <Animated.Text style={[styles.labelText, styles.rightLabel, animatedRightTextStyle]}>
                            Start <Ionicons name="play" size={18} color="#fff" />
                        </Animated.Text>
                    </View>
                </View>

                {/* Draggable Knob */}
                <GestureDetector gesture={pan}>
                    <Animated.View style={[styles.button, animatedButtonStyle]}>
                        <Ionicons name="swap-horizontal" size={28} color="#fff" />
                    </Animated.View>
                </GestureDetector>
            </Animated.View>

            {/* Static Hint Text Below */}
            <Text style={styles.hintText}>Swipe Right to Run • Left for Coach</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        marginBottom: 32,
        width: '100%',
        paddingHorizontal: 24,
    },
    container: {
        width: '100%',
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1F2937', // Default dark gray
        overflow: 'hidden',
    },
    labelsContainer: {
        position: 'absolute',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    labelWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    labelText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    leftLabel: {
        alignSelf: 'flex-start',
    },
    rightLabel: {
        alignSelf: 'flex-end',
    },
    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    hintText: {
        color: runnerTheme.colors.textMuted,
        fontSize: 12,
        marginTop: 12,
    },
});
