import React from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { runnerTheme } from '../constants/theme';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  style?: ViewStyle;
  onLongPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FlipCard: React.FC<FlipCardProps> = ({
  front,
  back,
  style,
  onLongPress,
}) => {
  const isFlipped = useSharedValue(0); // 0 = front, 1 = back

  const handlePress = () => {
    isFlipped.value = withSpring(isFlipped.value === 0 ? 1 : 0, {
      damping: 15,
      stiffness: 100,
      mass: 0.5,
    });
  };

  // Front face animation
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(isFlipped.value, [0, 1], [0, 180]);
    const opacity = interpolate(isFlipped.value, [0, 0.5, 1], [1, 0, 0]);
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  // Back face animation
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(isFlipped.value, [0, 1], [180, 360]);
    const opacity = interpolate(isFlipped.value, [0, 0.5, 1], [0, 0, 1]);
    
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <Pressable 
      onPress={handlePress} 
      onLongPress={onLongPress}
      style={[styles.container, style]}
    >
      {/* Front Face */}
      <Animated.View style={[styles.face, frontAnimatedStyle]}>
        {front}
      </Animated.View>

      {/* Back Face */}
      <Animated.View style={[styles.face, styles.backFace, backAnimatedStyle]}>
        {back}
      </Animated.View>
    </Pressable>
  );
};

// Hook to check if card is flipped (for external use if needed)
export const useFlipState = () => {
  const isFlipped = useSharedValue(0);
  
  const flip = () => {
    isFlipped.value = withSpring(isFlipped.value === 0 ? 1 : 0, {
      damping: 15,
      stiffness: 100,
      mass: 0.5,
    });
  };

  return { isFlipped, flip };
};

const styles = StyleSheet.create({
  container: {
    marginBottom: runnerTheme.spacing.md,
  },
  face: {
    width: '100%',
  },
  backFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
