import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../lib/theme';
import { AppTheme } from '../lib/theme/themes';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH * 0.82;
const PAGE_HEIGHT = SCREEN_HEIGHT * 0.65;
const PAGE_SPACING = 12;

interface ThemeSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

interface ThemePageProps {
  theme: AppTheme;
  isSelected: boolean;
  index: number;
  scrollX: Animated.SharedValue<number>;
}

// Mock preview of what the app looks like with this theme
const ThemePage: React.FC<ThemePageProps> = ({ theme, isSelected, index, scrollX }) => {
  const inputRange = [
    (index - 1) * (PAGE_WIDTH + PAGE_SPACING),
    index * (PAGE_WIDTH + PAGE_SPACING),
    (index + 1) * (PAGE_WIDTH + PAGE_SPACING),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.pageContainer, animatedStyle]}>
      <View
        style={[
          styles.phoneMockup,
          {
            backgroundColor: theme.colors.background,
            borderRadius: 32,
            borderWidth: isSelected ? 3 : 0,
            borderColor: theme.colors.accent,
          },
        ]}
      >
        {/* Status bar */}
        <View style={styles.statusBar}>
          <Text style={[styles.statusTime, { color: theme.colors.textPrimary }]}>9:41</Text>
          <View style={styles.statusIcons}>
            <Ionicons name="cellular" size={14} color={theme.colors.textPrimary} />
            <Ionicons name="wifi" size={14} color={theme.colors.textPrimary} style={{ marginLeft: 4 }} />
            <Ionicons name="battery-full" size={14} color={theme.colors.textPrimary} style={{ marginLeft: 4 }} />
          </View>
        </View>

        {/* Header */}
        <View style={styles.mockHeader}>
          <Text style={[styles.mockTitle, { color: theme.colors.textPrimary }]}>Run Moments</Text>
          <Ionicons name="color-palette-outline" size={18} color={theme.colors.textSecondary} />
        </View>

        {/* Mock cards */}
        <ScrollView 
          style={styles.mockContent} 
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          {theme.cardStyle.placeholderColors.slice(0, 3).map((colors, cardIndex) => (
            <View
              key={cardIndex}
              style={[
                styles.mockCard,
                {
                  backgroundColor: colors[0],
                  borderRadius: theme.cardStyle.borderRadius * 0.6,
                },
              ]}
            >
              <Text style={styles.mockCardLabel}>Run Snap</Text>
              <Text style={styles.mockCardTitle}>Morning Trail</Text>
              <View style={styles.mockCardStats}>
                <Text style={styles.mockCardStat}>5.2 km</Text>
                <Text style={styles.mockCardStat}>5:30 /km</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Mock FAB */}
        <View style={[styles.mockFab, { backgroundColor: theme.colors.accent }]}>
          <Ionicons name="add" size={20} color={theme.isDark ? '#000' : '#fff'} />
        </View>

        {/* Home indicator */}
        <View style={[styles.homeIndicator, { backgroundColor: theme.colors.textMuted }]} />
      </View>

      {/* Theme name below */}
      <Text style={styles.themeName}>{theme.name}</Text>
      <Text style={styles.themeDescription}>{theme.description}</Text>
    </Animated.View>
  );
};

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ visible, onClose }) => {
  const { theme: currentTheme, allThemes, setTheme } = useAppTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withSpring(1, { damping: 20 });
      
      // Find and scroll to current theme
      const currentIndex = allThemes.findIndex(t => t.id === currentTheme.id);
      setSelectedIndex(currentIndex);
      
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: currentIndex * (PAGE_WIDTH + PAGE_SPACING),
          animated: false,
        });
        scrollX.value = currentIndex * (PAGE_WIDTH + PAGE_SPACING);
      }, 50);
    } else {
      overlayOpacity.value = withSpring(0, { damping: 20 });
    }
  }, [visible, currentTheme.id]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    
    const newIndex = Math.round(offsetX / (PAGE_WIDTH + PAGE_SPACING));
    if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < allThemes.length) {
      setSelectedIndex(newIndex);
      Haptics.selectionAsync();
    }
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTheme(allThemes[selectedIndex].id);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  const selectedTheme = allThemes[selectedIndex];

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      {/* Background */}
      <View style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Theme</Text>
        <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
          <Text style={[styles.setText, { color: selectedTheme.colors.accent }]}>Set</Text>
        </TouchableOpacity>
      </View>

      {/* Page dots */}
      <View style={styles.dotsContainer}>
        {allThemes.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === selectedIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                width: index === selectedIndex ? 8 : 6,
                height: index === selectedIndex ? 8 : 6,
              },
            ]}
          />
        ))}
      </View>

      {/* Theme pages carousel */}
      <FlatList
        ref={flatListRef}
        data={allThemes}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={PAGE_WIDTH + PAGE_SPACING}
        decelerationRate="fast"
        contentContainerStyle={styles.carousel}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: PAGE_WIDTH + PAGE_SPACING,
          offset: (PAGE_WIDTH + PAGE_SPACING) * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <ThemePage
            theme={item}
            isSelected={index === selectedIndex}
            index={index}
            scrollX={scrollX}
          />
        )}
      />

      {/* Swipe hint */}
      <Text style={styles.swipeHint}>Swipe to browse themes</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  cancelText: {
    fontSize: 17,
    color: '#fff',
  },
  setText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    borderRadius: 4,
  },
  carousel: {
    paddingHorizontal: (SCREEN_WIDTH - PAGE_WIDTH) / 2,
  },
  pageContainer: {
    width: PAGE_WIDTH,
    marginHorizontal: PAGE_SPACING / 2,
    alignItems: 'center',
  },
  phoneMockup: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  statusTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mockTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  mockContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  mockCard: {
    marginBottom: 10,
    padding: 12,
    minHeight: 100,
  },
  mockCardLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  mockCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 'auto',
    marginBottom: 8,
  },
  mockCardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  mockCardStat: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  mockFab: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 4,
    borderRadius: 2,
  },
  themeName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
  },
  themeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
});
