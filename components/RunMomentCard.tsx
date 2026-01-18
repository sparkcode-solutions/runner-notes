import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RunMoment } from '../lib/db/schema';
import { formatDistance, formatPace } from '../lib/location';
import { ReflectionEngine } from '../lib/reflection';
import { useTheme } from '../lib/theme';
import { FlipCard } from './FlipCard';
import { InsightBlock } from './InsightBlock';

interface RunMomentCardProps {
  runMoment: RunMoment;
  journalPreview?: string | null;
  featuredSnapUri?: string | null;
}

export const RunMomentCard: React.FC<RunMomentCardProps> = ({
  runMoment,
  journalPreview,
  featuredSnapUri,
}) => {
  const theme = useTheme();

  const handleLongPress = () => {
    router.push(`/run/${runMoment.id}`);
  };

  // Get a consistent color based on trail name
  const colorIndex = runMoment.trailName.length % theme.cardStyle.placeholderColors.length;
  const [bgColor] = theme.cardStyle.placeholderColors[colorIndex];

  const hasJournal = journalPreview && journalPreview.trim().length > 0;
  const hasSnap = featuredSnapUri && featuredSnapUri.length > 0;

  // Build context for AI
  const context = ReflectionEngine.buildContext(runMoment, journalPreview);

  // Use local state for Vibe Prompt (async from AI)
  // Initialize with sync fallback to prevent flicker
  const [vibePrompt, setVibePrompt] = useState(ReflectionEngine.generateVibePromptSync(context));

  useEffect(() => {
    let mounted = true;
    const loadPrompt = async () => {
      const prompt = await ReflectionEngine.generateVibePrompt(context);
      if (mounted && prompt) setVibePrompt(prompt);
    };
    loadPrompt();
    return () => { mounted = false; };
  }, [runMoment.id]);

  const aiReflection = runMoment.coachNote || ReflectionEngine.generateReflection(context);

  // Determine InsightBlock mode and content
  const insightMode = aiReflection ? 'insight' : 'prompt';
  const insightText = aiReflection || vibePrompt;

  // Content for the front face
  const FrontContent = (
    <>
      {/* Gradient overlay for text readability */}
      <View style={[styles.gradientOverlay, { backgroundColor: theme.colors.cardOverlay }]} />

      {/* Content */}
      <View style={styles.frontContent}>
        {/* Top label */}
        <Text style={styles.runSnapLabel}>{hasSnap ? 'Run Snap' : 'Run Moment'}</Text>

        {/* Trail name - large */}
        <Text style={styles.trailTitle}>{runMoment.trailName}</Text>

        {/* Bottom row - stats and arrow */}
        <View style={styles.frontBottom}>
          <View style={styles.statsRow}>
            <Text style={styles.statValueFront}>{formatDistance(runMoment.distance)}</Text>
            <Text style={styles.statUnitFront}>km</Text>
            <View style={styles.statSpacer} />
            <Text style={styles.statValueFront}>{formatPace(runMoment.avgPace)}</Text>
            <Text style={styles.statUnitFront}>/km</Text>
          </View>

          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </View>
      </View>

      {/* Status badge for active runs */}
      {runMoment.status !== 'completed' && (
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.statusText}>
            {runMoment.status === 'active' ? 'Live' : 'Paused'}
          </Text>
        </View>
      )}
    </>
  );

  // Front Face - Photo/Gradient with overlay
  const FrontFace = hasSnap ? (
    <ImageBackground
      source={{ uri: featuredSnapUri }}
      style={[styles.cardFace, styles.frontFace, { borderRadius: theme.cardStyle.borderRadius }]}
      imageStyle={{ borderRadius: theme.cardStyle.borderRadius }}
    >
      {FrontContent}
    </ImageBackground>
  ) : (
    <View style={[styles.cardFace, styles.frontFace, { backgroundColor: bgColor, borderRadius: theme.cardStyle.borderRadius }]}>
      {FrontContent}
    </View>
  );

  // Back Face - Journal page aesthetic with AI Insight Block
  const BackFace = (
    <View style={[
      styles.cardFace,
      styles.backFace,
      {
        backgroundColor: theme.colors.journalBackground,
        borderRadius: theme.cardStyle.borderRadius,
      }
    ]}>
      {/* AI Insight Block - Top 30% */}
      <InsightBlock
        mode={insightMode}
        text={insightText}
        hasNewContent={!!aiReflection}
      />

      {/* Journal Content - Bottom 70% */}
      <View style={styles.journalArea}>
        {hasJournal ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            style={styles.journalScroll}
          >
            <Text style={[styles.journalText, { fontFamily: theme.fonts.journal }]}>{journalPreview}</Text>
          </ScrollView>
        ) : (
          <View style={styles.emptyJournal}>
            <Text style={[styles.emptyJournalText, { color: theme.colors.textMuted }]}>
              Tap to capture your thoughts...
            </Text>
          </View>
        )}
      </View>

      {/* Bottom action */}
      <View style={[styles.backBottom, { borderTopColor: theme.colors.journalBorder }]}>
        <Text style={[styles.trailNameBack, { color: theme.colors.textMuted }]}>{runMoment.trailName}</Text>
        <Ionicons name="bookmark-outline" size={20} color={theme.colors.textMuted} />
      </View>
    </View>
  );

  return (
    <FlipCard
      front={FrontFace}
      back={BackFace}
      onLongPress={handleLongPress}
    />
  );
};

const styles = StyleSheet.create({
  cardFace: {
    minHeight: 220,
    overflow: 'hidden',
  },

  // ==================
  // FRONT FACE STYLES
  // ==================
  frontFace: {
    position: 'relative',
  },

  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  frontContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },

  runSnapLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },

  trailTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 32,
    marginTop: 'auto',
    marginBottom: 16,
  },

  frontBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  statValueFront: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  statUnitFront: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 2,
  },

  statSpacer: {
    width: 16,
  },

  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ==================
  // BACK FACE STYLES
  // ==================
  backFace: {
    padding: 20,
  },

  journalArea: {
    flex: 1,
    justifyContent: 'center',
  },

  journalScroll: {
    flex: 1,
  },

  journalText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#3D3229',
    lineHeight: 26,
    fontStyle: 'italic',
  },

  emptyJournal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyJournalText: {
    fontSize: 15,
    fontStyle: 'italic',
  },

  backBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },

  trailNameBack: {
    fontSize: 12,
    fontWeight: '500',
  },
});
