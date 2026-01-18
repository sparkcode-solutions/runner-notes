import { sql } from 'drizzle-orm';
import { db } from './client';

/**
 * Run database migrations
 * This creates tables if they don't exist
 */
export async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');

  // Create users table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      apple_user_id TEXT NOT NULL UNIQUE,
      email TEXT,
      display_name TEXT,
      coach_mode TEXT CHECK(coach_mode IN ('mindful', 'performance')),
      created_at INTEGER NOT NULL
    )
  `);

  // Create trails table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS trails (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Create run_moments table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS run_moments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      trail_id TEXT REFERENCES trails(id),
      trail_name TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration INTEGER NOT NULL DEFAULT 0,
      distance REAL NOT NULL DEFAULT 0,
      avg_pace REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed')),
      coach_note TEXT,
      pre_run_suggestion TEXT,
      sentiment_score REAL,
      run_vibe TEXT,
      weather_condition TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // Create pace_points table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pace_points (
      id TEXT PRIMARY KEY,
      run_moment_id TEXT NOT NULL REFERENCES run_moments(id) ON DELETE CASCADE,
      timestamp INTEGER NOT NULL,
      pace REAL NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL
    )
  `);

  // Create journals table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      run_moment_id TEXT NOT NULL REFERENCES run_moments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Create run_snaps table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS run_snaps (
      id TEXT PRIMARY KEY,
      run_moment_id TEXT NOT NULL REFERENCES run_moments(id) ON DELETE CASCADE,
      uri TEXT NOT NULL,
      caption TEXT,
      is_featured INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  // Create indexes for better query performance
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_trails_user_id ON trails(user_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_run_moments_user_id ON run_moments(user_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_run_moments_trail_id ON run_moments(trail_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_pace_points_run_moment_id ON pace_points(run_moment_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_journals_run_moment_id ON journals(run_moment_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_run_snaps_run_moment_id ON run_snaps(run_moment_id)`);

  // Migration: Add coach_mode to users if it doesn't exist
  try {
    await db.run(sql`ALTER TABLE users ADD COLUMN coach_mode TEXT CHECK(coach_mode IN ('mindful', 'performance'))`);
    console.log('Added coach_mode column to users table');
  } catch (e) {
    // Column likely already exists
    // console.log('coach_mode column already exists or could not be added');
  }

  // Migration: Add new analysis columns to run_moments
  try {
    await db.run(sql`ALTER TABLE run_moments ADD COLUMN coach_note TEXT`);
    await db.run(sql`ALTER TABLE run_moments ADD COLUMN pre_run_suggestion TEXT`);
    await db.run(sql`ALTER TABLE run_moments ADD COLUMN sentiment_score REAL`);
    await db.run(sql`ALTER TABLE run_moments ADD COLUMN run_vibe TEXT`);
    await db.run(sql`ALTER TABLE run_moments ADD COLUMN weather_condition TEXT`);
    console.log('Added analysis columns (including coach_note) to run_moments table');
  } catch (e) {
    // Columns likely already exist
  }

  console.log('Database migrations completed successfully');
}
