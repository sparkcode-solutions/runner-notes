import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Users table - stores Apple Sign-In user info
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  appleUserId: text('apple_user_id').notNull().unique(),
  email: text('email'),
  displayName: text('display_name'),
  coachMode: text('coach_mode', { enum: ['mindful', 'performance'] }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Trails table - running trails/routes
export const trails = sqliteTable('trails', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Run Moments table - individual run sessions
export const runMoments = sqliteTable('run_moments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  trailId: text('trail_id').references(() => trails.id),
  trailName: text('trail_name').notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  duration: integer('duration').notNull().default(0), // seconds
  distance: real('distance').notNull().default(0), // meters
  avgPace: real('avg_pace').notNull().default(0), // min/km
  status: text('status', { enum: ['active', 'paused', 'completed'] }).notNull().default('active'),
  coachNote: text('coach_note'), // AI-generated reflection from "The Reflection"
  preRunSuggestion: text('pre_run_suggestion'), // Why this trail was suggested
  sentimentScore: real('sentiment_score'), // -1.0 to 1.0
  runVibe: text('run_vibe'), // 'heavy', 'flow', 'struggle', etc.
  weatherCondition: text('weather_condition'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Pace Points table - GPS tracking data for each run
export const pacePoints = sqliteTable('pace_points', {
  id: text('id').primaryKey(),
  runMomentId: text('run_moment_id').notNull().references(() => runMoments.id, { onDelete: 'cascade' }),
  timestamp: integer('timestamp').notNull(),
  pace: real('pace').notNull(), // min/km
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
});

// Journals table - text entries associated with runs
export const journals = sqliteTable('journals', {
  id: text('id').primaryKey(),
  runMomentId: text('run_moment_id').notNull().references(() => runMoments.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Run Snaps table - photos captured during/after runs
export const runSnaps = sqliteTable('run_snaps', {
  id: text('id').primaryKey(),
  runMomentId: text('run_moment_id').notNull().references(() => runMoments.id, { onDelete: 'cascade' }),
  uri: text('uri').notNull(), // Local file path
  caption: text('caption'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false), // Show on card front
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  trails: many(trails),
  runMoments: many(runMoments),
}));

export const trailsRelations = relations(trails, ({ one, many }) => ({
  user: one(users, {
    fields: [trails.userId],
    references: [users.id],
  }),
  runMoments: many(runMoments),
}));

export const runMomentsRelations = relations(runMoments, ({ one, many }) => ({
  user: one(users, {
    fields: [runMoments.userId],
    references: [users.id],
  }),
  trail: one(trails, {
    fields: [runMoments.trailId],
    references: [trails.id],
  }),
  pacePoints: many(pacePoints),
  journals: many(journals),
  runSnaps: many(runSnaps),
}));

export const pacePointsRelations = relations(pacePoints, ({ one }) => ({
  runMoment: one(runMoments, {
    fields: [pacePoints.runMomentId],
    references: [runMoments.id],
  }),
}));

export const journalsRelations = relations(journals, ({ one }) => ({
  runMoment: one(runMoments, {
    fields: [journals.runMomentId],
    references: [runMoments.id],
  }),
}));

export const runSnapsRelations = relations(runSnaps, ({ one }) => ({
  runMoment: one(runMoments, {
    fields: [runSnaps.runMomentId],
    references: [runMoments.id],
  }),
}));

// Type exports for use throughout the app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Trail = typeof trails.$inferSelect;
export type NewTrail = typeof trails.$inferInsert;

export type RunMoment = typeof runMoments.$inferSelect;
export type NewRunMoment = typeof runMoments.$inferInsert;

export type PacePoint = typeof pacePoints.$inferSelect;
export type NewPacePoint = typeof pacePoints.$inferInsert;

export type Journal = typeof journals.$inferSelect;
export type NewJournal = typeof journals.$inferInsert;

export type RunSnap = typeof runSnaps.$inferSelect;
export type NewRunSnap = typeof runSnaps.$inferInsert;
