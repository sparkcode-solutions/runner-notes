import { apple } from '@react-native-ai/apple';
import { generateText } from 'ai';
import type { RunMoment } from '../db/schema';
import { DISTANCE_PROMPTS, GENERAL_PROMPTS, PACE_PROMPTS, TIME_PROMPTS } from './prompts';

/**
 * WorkoutContext - All data the AI has access to
 */
export interface WorkoutContext {
  runMoment: RunMoment;
  journalContent?: string | null;
  timeOfDay: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  paceCategory: 'slow' | 'easy' | 'moderate' | 'fast';
  distanceCategory: 'short' | 'medium' | 'long';
}

/**
 * Determine time of day category from timestamp
 */
function getTimeOfDay(timestamp: Date): WorkoutContext['timeOfDay'] {
  const hour = timestamp.getHours();
  
  if (hour >= 4 && hour < 7) return 'early_morning';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Categorize pace (min/km)
 * Based on general running pace standards
 */
function getPaceCategory(avgPace: number): WorkoutContext['paceCategory'] {
  if (avgPace > 7) return 'slow';      // > 7:00 min/km
  if (avgPace > 6) return 'easy';       // 6:00-7:00 min/km
  if (avgPace > 5) return 'moderate';   // 5:00-6:00 min/km
  return 'fast';                        // < 5:00 min/km
}

/**
 * Categorize distance (meters)
 */
function getDistanceCategory(distance: number): WorkoutContext['distanceCategory'] {
  const km = distance / 1000;
  if (km < 3) return 'short';
  if (km < 8) return 'medium';
  return 'long';
}

/**
 * Build WorkoutContext from RunMoment
 */
export function buildWorkoutContext(
  runMoment: RunMoment,
  journalContent?: string | null
): WorkoutContext {
  return {
    runMoment,
    journalContent,
    timeOfDay: getTimeOfDay(runMoment.startTime),
    paceCategory: getPaceCategory(runMoment.avgPace),
    distanceCategory: getDistanceCategory(runMoment.distance),
  };
}

/**
 * Replace template variables with actual values
 */
function fillTemplate(template: string, context: WorkoutContext): string {
  const startTime = context.runMoment.startTime;
  const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
  const distanceKm = (context.runMoment.distance / 1000).toFixed(1);
  const midpoint = (parseFloat(distanceKm) / 2).toFixed(1);
  
  return template
    .replace('{time}', timeStr)
    .replace('{trail}', context.runMoment.trailName)
    .replace('{distance}', distanceKm)
    .replace('{midpoint}', midpoint);
}

/**
 * Select best prompt based on context
 */
function selectBestPrompt(context: WorkoutContext): string {
  // Priority: Time > Pace > Distance > General
  
  // Try time-based first
  const timeMatch = TIME_PROMPTS.find(
    p => p.conditions?.timeOfDay === context.timeOfDay
  );
  if (timeMatch) return fillTemplate(timeMatch.template, context);
  
  // Try pace-based
  const paceMatch = PACE_PROMPTS.find(
    p => p.conditions?.paceCategory === context.paceCategory
  );
  if (paceMatch) return fillTemplate(paceMatch.template, context);
  
  // Try distance-based
  const distanceMatch = DISTANCE_PROMPTS.find(
    p => p.conditions?.distanceCategory === context.distanceCategory
  );
  if (distanceMatch) return fillTemplate(distanceMatch.template, context);
  
  // Fall back to random general prompt
  const randomPrompt = GENERAL_PROMPTS[
    Math.floor(Math.random() * GENERAL_PROMPTS.length)
  ];
  return fillTemplate(randomPrompt.template, context);
}

/**
 * Generate contextual "Vibe Prompt" for journal input
 * This is shown BEFORE the user writes
 */
export function generateVibePromptSync(context: WorkoutContext): string {
  return selectBestPrompt(context);
}

export async function generateVibePrompt(context: WorkoutContext): Promise<string> {
   try {
     const system = `You are a curious, mindful running coach.
     Context:
     - Time: ${context.timeOfDay}
     - Pace: ${context.paceCategory}
     - Distance: ${context.distanceCategory}
     - Trail: ${context.runMoment.trailName}
     
     Task: Ask ONE short, open-ended question (max 12 words) to help the runner reflect on their run vibe.
     Example: "Did the rhythm find you early today?"`;

     const { text } = await generateText({
        model: apple(),
        system,
        prompt: "Generate query.",
     });

     if (text && text.length > 5) return text.trim();
   } catch(e) {
     console.log('AI Vibe Prompt failed', e);
   }
   return generateVibePromptSync(context);
}

/**
 * Generate the System Prompt for "The Silent Partner"
 */
export function generateSystemPrompt(context: WorkoutContext): string {
  const { runMoment, journalContent } = context;
  const isJournaling = !!journalContent && journalContent.length > 0;

  let prompt = `You are "The Reflection," a mindful running coach.
Your Role: Act as a mirror, not a cheerleader.
Your Tone: Direct, observant, curious, and non-judgmental.
Your Rule: NEVER say "Good job," "Great run," or praise performance (speed/distance).
Your Goal: Shift focus from external metrics (pace/time) to internal state (feeling/thought).

Context:
- Run: ${runMoment.distance}m in ${runMoment.duration}s on "${runMoment.trailName}"
- Time: ${context.timeOfDay}
- Pace: ${context.paceCategory}
- Journal: ${isJournaling ? `"${journalContent}"` : "None yet."}
`;

  if (isJournaling) {
    prompt += `
Task: Provide a ONE-SENTENCE insight connecting the run data to the journal entry.
Example: "You mentioned the wind was biting today, but your pace stayed steady. Where did that focus come from?"
`;
  } else {
    prompt += `
Task: Ask ONE curious question to prompt reflection.
Example: "It's early and cold. What got you out the door?"
`;
  }

  return prompt;
}

/**
 * Generate AI reflection based on run + journal
 * This is shown AFTER the user writes (or as a curious prompt if no journal)
 */
export function generateReflection(context: WorkoutContext): string | null {
  // Generate the system prompt (for debugging/logging)
  const systemPrompt = generateSystemPrompt(context);
  console.log('[ReflectionEngine] System Prompt:', systemPrompt);

  // TODO: Connect to actual LLM (on-device or API)
  // For now, return null to show the Vibe Prompt placeholder instead
  // efficiently unless we have a mock "Insight".
  return null; 
}

/**
 * Generate a pre-run suggestion based on recent history (Sync Fallback)
 */
export function getRunSuggestionSync(history: RunMoment[]): {
  type: 'recovery' | 'steady' | 'push';
  text: string;
  reason: string;
} {
  if (!history || history.length === 0) {
    return {
      type: 'steady',
      text: "A fresh start. Let's find your rhythm.",
      reason: "First run recorded"
    };
  }

  const lastRun = history[0]; // Assuming sorted by date DESC
  const isHard = (lastRun.distance > 8000) || (lastRun.avgPace < 5.0 && lastRun.distance > 3000);
  const isLong = lastRun.distance > 10000;

  if (isHard || isLong) {
    return {
      type: 'recovery',
      text: "Your last effort was strong. Today, let's keep it light and mindful.",
      reason: `Recovering from ${formatDistance(lastRun.distance)}`
    };
  }

  return {
    type: 'push',
    text: "You're well-rested. Feeling ready to explore a bit further?",
    reason: "Balanced energy detected"
  };
}

/**
 * Generate a pre-run suggestion using AI
 */
export async function getRunSuggestion(history: RunMoment[]): Promise<{
    type: 'recovery' | 'steady' | 'push';
    text: string;
    reason: string;
}> {
    try {
        if (!history || history.length === 0) return getRunSuggestionSync(history);

         const lastRun = history[0];
         const prompt = `Taking into account my last run (${formatDistance(lastRun.distance)} at ${formatPace(lastRun.avgPace)}/km), suggest a plan for today.
         Output strictly JSON: { "type": "recovery" | "steady" | "push", "text": "one sentence advice", "reason": "short reason" }`;
         
         const { text } = await generateText({
            model: apple(),
            system: "You are an expert running coach.",
            prompt,
         });

         // Simple parsing (robustness needed in real app)
         const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
         const json = JSON.parse(cleaned);
         if (json.type && json.text && json.reason) return json;

    } catch (e) {
        console.log('AI Suggestion failed', e);
    }
    return getRunSuggestionSync(history);
}

// Helper needed for AI prompt construction (locally duplicative or I reuse existing)
function formatPace(pace: number): string {
  if (!pace || pace === Infinity) return '--:--';
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper to format distance for the reason string (quick duplicate needed or import)
function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Generate a smart greeting based on weather and time context
 */
export function getSmartGreeting(weather: { 
  temp: number; 
  condition: string; 
  isRaining: boolean;
} | null, hour: number): string {
  
  // Night Logic (> 9 PM)
  if (hour >= 21 || hour < 4) {
    return "It's late. The trails are sleeping, maybe you should too?";
  }

  if (!weather) {
    return "I'm here. Pace yourself today.";
  }

  // Rain Logic
  if (weather.isRaining || weather.condition.toLowerCase().includes('rain')) {
    return "Rain detected. Do you got your grip shoes ready?";
  }

  // Heat Logic
  if (weather.temp > 28) {
    return `It's ${Math.round(weather.temp)}°C. Hydrate double today.`;
  }

  // Cold Logic
  if (weather.temp < 5) {
    return "Crisp air outside. Perfect for clearing the mind.";
  }

  // Default "Prime" condition
  return `Conditions are prime (${Math.round(weather.temp)}°C). Ready to flow?`;
}

/**
 * ReflectionEngine - Main interface
 */
export const ReflectionEngine = {
  buildContext: buildWorkoutContext,
  generateVibePrompt,
  generateVibePromptSync,
  generateReflection,
  generateSystemPrompt,
  getRunSuggestion,
  getRunSuggestionSync,
  getSmartGreeting,
};
