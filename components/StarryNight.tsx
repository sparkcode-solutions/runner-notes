import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

const COUNT = 40;
const { width, height } = Dimensions.get('window');

const Star = ({ delay, duration, top, left, size }: any) => {
    const opacity = useSharedValue(0.2);

    useEffect(() => {
        opacity.value = withDelay(
            delay,
            withRepeat(
                withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            )
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.star,
                { top, left, width: size, height: size, borderRadius: size / 2 },
                style
            ]}
        />
    );
};

export const StarryNight = () => {
    // Generate random stars on first render only
    const stars = React.useMemo(() => {
        return Array.from({ length: COUNT }).map((_, i) => ({
            id: i,
            top: Math.random() * height, // Full screen
            left: Math.random() * width,
            size: Math.random() * 2 + 1, // 1-3px
            delay: Math.random() * 2000,
            duration: Math.random() * 2000 + 1000, // 1-3s blink
        }));
    }, []);

    return (
        <View style={styles.container} pointerEvents="none">
            {stars.map(s => (
                <Star key={s.id} {...s} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0, // Background layer
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFF',
    }
});
