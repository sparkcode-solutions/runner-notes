import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const DATABASE_NAME = 'runner-notes.db';

// Open SQLite database
const expoDb = openDatabaseSync(DATABASE_NAME);

// Create Drizzle instance with schema
export const db = drizzle(expoDb, { schema });

// Export database name for reference
export { DATABASE_NAME };
