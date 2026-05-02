import { Directory, File, Paths } from 'expo-file-system';

const SNAPS_DIR = new Directory(Paths.document, 'run-snaps');

export const SNAPS_DIRECTORY = SNAPS_DIR.uri;

export function ensureSnapsDirectory(): void {
  if (!SNAPS_DIR.exists) {
    SNAPS_DIR.create({ intermediates: true });
  }
}

export function generateSnapFilename(runMomentId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${runMomentId}_${timestamp}_${random}.jpg`;
}

function normalizeSourceUri(uri: string): string {
  return uri.startsWith('file://') ? uri : `file://${uri}`;
}

export async function saveSnapImage(
  sourceUri: string,
  runMomentId: string
): Promise<string> {
  console.log(`[ImageStorage] saveSnapImage called for source: ${sourceUri}`);

  ensureSnapsDirectory();

  const filename = generateSnapFilename(runMomentId);
  const destination = new File(SNAPS_DIR, filename);
  const source = new File(normalizeSourceUri(sourceUri));

  console.log(`[ImageStorage] Copying from ${source.uri} to ${destination.uri}`);

  try {
    source.copy(destination);
    console.log(`[ImageStorage] Success. Saved to ${destination.uri}`);
    return destination.uri;
  } catch (error) {
    console.error('[ImageStorage] copy failed, attempting move:', error);
    try {
      const fallback = new File(SNAPS_DIR, generateSnapFilename(runMomentId));
      source.move(fallback);
      return fallback.uri;
    } catch {
      throw error;
    }
  }
}

export async function copySnapImage(
  sourceUri: string,
  runMomentId: string
): Promise<string> {
  console.log(`[ImageStorage] copySnapImage called for source: ${sourceUri}`);

  ensureSnapsDirectory();

  const filename = generateSnapFilename(runMomentId);
  const destination = new File(SNAPS_DIR, filename);
  const source = new File(normalizeSourceUri(sourceUri));

  source.copy(destination);
  console.log(`[ImageStorage] Success. Saved to ${destination.uri}`);
  return destination.uri;
}

export async function deleteSnapImage(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error('Error deleting snap image:', error);
  }
}

export async function deleteAllSnapsForRun(runMomentId: string): Promise<void> {
  try {
    ensureSnapsDirectory();
    for (const entry of SNAPS_DIR.list()) {
      if (entry instanceof File && entry.name.startsWith(runMomentId)) {
        entry.delete();
      }
    }
  } catch (error) {
    console.error('Error deleting snaps for run:', error);
  }
}

export async function getSnapsStorageSize(): Promise<number> {
  try {
    ensureSnapsDirectory();
    let totalSize = 0;
    for (const entry of SNAPS_DIR.list()) {
      if (entry instanceof File) {
        totalSize += entry.size ?? 0;
      }
    }
    return totalSize;
  } catch (error) {
    console.error('Error getting snaps storage size:', error);
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
