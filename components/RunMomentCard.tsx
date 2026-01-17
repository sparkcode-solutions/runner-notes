import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { FlipCard } from './FlipCard';
import { formatDistance, formatPace } from '../lib/location';
import { Ionicons } from '@expo/vector-icons';
import type { RunMoment } from '../lib/db/schema';

interface RunMomentCardProps {
  runMoment: RunMoment;
  journalPreview?: string | null;
  featuredSnapUri?: string | null;
}

// Placeholder gradients for when there's no photo
const PLACEHOLDER_COLORS = [
  ['#1a3a2f', '#0d1f19'], // Forest green
  ['#2d3748', '#1a202c'], // Slate
  ['#44337a', '#2d2540'], // Purple dusk
  ['#1e3a5f', '#0f1f33'], // Ocean blue
  ['#5c4033', '#2d1f18'], // Earth brown
];

export const RunMomentCard: React.FC<RunMomentCardProps> = ({ 
  runMoment,
  journalPreview,
  featuredSnapUri,
}) => {
  const handleLongPress = () => {
    router.push(`/run/${runMoment.id}`);
  };

  // Get a consistent color based on trail name
  const colorIndex = runMoment.trailName.length % PLACEHOLDER_COLORS.length;
  const [bgColor] = PLACEHOLDER_COLORS[colorIndex];

  const hasJournal = journalPreview && journalPreview.trim().length > 0;
  const hasSnap = featuredSnapUri && featuredSnapUri.length > 0;

  // Content for the front face
  const FrontContent = (
    <>
      {/* Gradient overlay for text readability */}
      <View style={styles.gradientOverlay} />
      
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
          <View style={styles.statusDot} />
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
      style={[styles.cardFace, styles.frontFace]}
      imageStyle={styles.snapImage}
    >
      {FrontContent}
    </ImageBackground>
  ) : (
    <View style={[styles.cardFace, styles.frontFace, { backgroundColor: bgColor }]}>
      {FrontContent}
    </View>
  );

  // Back Face - Journal page aesthetic
  const BackFace = (
    <View style={[styles.cardFace, styles.backFace]}>
      {/* AI Prompt */}
      <View style={styles.promptRow}>
        <Ionicons name="sparkles" size={14} color="#8B7355" />
        <Text style={styles.promptText}>The air on the trail today felt...</Text>
      </View>

      {/* Journal Content */}
      <View style={styles.journalArea}>
        {hasJournal ? (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            style={styles.journalScroll}
          >
            <Text style={styles.journalText}>{journalPreview}</Text>
          </ScrollView>
        ) : (
          <View style={styles.emptyJournal}>
            <Text style={styles.emptyJournalText}>
              Tap to capture your thoughts...
            </Text>
          </View>
        )}
      </View>

      {/* Bottom action */}
      <View style={styles.backBottom}>
        <Text style={styles.trailNameBack}>{runMoment.trailName}</Text>
        <Ionicons name="bookmark-outline" size={20} color="#8B7355" />
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
    borderRadius: 20,
    minHeight: 220,
    overflow: 'hidden',
  },

  // ==================
  // FRONT FACE STYLES
  // ==================
  frontFace: {
    position: 'relative',
  },

  snapImage: {
    borderRadius: 20,
  },

  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    // Simulate gradient with multiple layers
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
    backgroundColor: '#4ADE80',
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
    backgroundColor: '#FAF6F1', // Warm cream/paper color
    padding: 20,
  },

  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.15)',
  },

  promptText: {
    fontSize: 13,
    color: '#8B7355',
    marginLeft: 8,
    fontStyle: 'italic',
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
    fontFamily: 'Georgia',
  },

  emptyJournal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyJournalText: {
    fontSize: 15,
    color: '#A89F91',
    fontStyle: 'italic',
  },

  backBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 115, 85, 0.15)',
  },

  trailNameBack: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
});
