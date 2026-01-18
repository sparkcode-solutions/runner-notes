/**
 * Vibe Prompts Library
 * Curated mindful prompts that adapt to run context
 */

export interface PromptTemplate {
  template: string;
  conditions?: {
    timeOfDay?: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
    paceCategory?: 'slow' | 'easy' | 'moderate' | 'fast';
    distanceCategory?: 'short' | 'medium' | 'long';
  };
}

// Time-based prompts
export const TIME_PROMPTS: PromptTemplate[] = [
  {
    template: "It's {time} and the world is quiet. What called you to the trail?",
    conditions: { timeOfDay: 'early_morning' },
  },
  {
    template: "Morning light on {trail}. How did the first mile feel?",
    conditions: { timeOfDay: 'morning' },
  },
  {
    template: "Midday run on {trail}. What were you running toward?",
    conditions: { timeOfDay: 'afternoon' },
  },
  {
    template: "Evening shadows on {trail}. What are you leaving behind today?",
    conditions: { timeOfDay: 'evening' },
  },
  {
    template: "Running in the dark. What did the quiet bring out?",
    conditions: { timeOfDay: 'night' },
  },
];

// Pace-based prompts
export const PACE_PROMPTS: PromptTemplate[] = [
  {
    template: "You took it slow today. What did that pace let you notice?",
    conditions: { paceCategory: 'slow' },
  },
  {
    template: "An easy rhythm on {trail}. Where did your mind wander?",
    conditions: { paceCategory: 'easy' },
  },
  {
    template: "You pushed the pace. What were you chasing?",
    conditions: { paceCategory: 'fast' },
  },
];

// Distance-based prompts
export const DISTANCE_PROMPTS: PromptTemplate[] = [
  {
    template: "A short visit to {trail}. Sometimes less is more—what did this give you?",
    conditions: { distanceCategory: 'short' },
  },
  {
    template: "{distance} km. That's a conversation with yourself. What came up?",
    conditions: { distanceCategory: 'long' },
  },
];

// General reflective prompts (no specific conditions)
export const GENERAL_PROMPTS: PromptTemplate[] = [
  { template: "The air on {trail} today felt..." },
  { template: "At kilometer {midpoint}, I noticed..." },
  { template: "Today, I ran to..." },
  { template: "If this run were a chapter title, it would be..." },
  { template: "The hardest part was... but then..." },
  { template: "My body said... my mind said..." },
  { template: "I started thinking about..." },
  { template: "This run reminded me that..." },
  { template: "When my breath steadied, I realized..." },
  { template: "The trail gave me..." },
];

// Weather/season prompts (for future enhancement)
export const CONTEXTUAL_PROMPTS: PromptTemplate[] = [
  { template: "Rain on {trail}. How did the weather mirror your mood?" },
  { template: "The wind was relentless. What kept you moving?" },
  { template: "Perfect conditions today. Did that change anything?" },
];

// All prompts combined
export const ALL_PROMPTS = [
  ...TIME_PROMPTS,
  ...PACE_PROMPTS,
  ...DISTANCE_PROMPTS,
  ...GENERAL_PROMPTS,
  ...CONTEXTUAL_PROMPTS,
];
