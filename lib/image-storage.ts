import * as FileSystem from 'expo-file-system';

// Directory for storing run snap images
const SNAPS_DIRECTORY = `${FileSystem.documentDirectory}run-snaps/`;

/**
 * Ensure the snaps directory exists
 */
export async function ensureSnapsDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(SNAPS_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(SNAPS_DIRECTORY, { intermediates: true });
  }
}

/**
 * Generate a unique filename for a snap
 */
export function generateSnapFilename(runMomentId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${runMomentId}_${timestamp}_${random}.jpg`;
}

/**
 * Save an image from cache/temp to permanent storage
 * @param sourceUri - The temporary URI of the captured image
 * @param runMomentId - The run moment this snap belongs to
 * @returns The permanent local URI of the saved image
 */
export async function saveSnapImage(
  sourceUri: string,
  runMomentId: string
): Promise<string> {
  console.log(`[ImageStorage] saveSnapImage called for source: ${sourceUri}`);
  
  try {
    await ensureSnapsDirectory();
    
    const filename = generateSnapFilename(runMomentId);
    const destinationUri = `${SNAPS_DIRECTORY}${filename}`;
    
    console.log(`[ImageStorage] Copying from ${sourceUri} to ${destinationUri}`);

    // Create directory check again inside just to be sure
    const dirInfo = await FileSystem.getInfoAsync(SNAPS_DIRECTORY);
    console.log(`[ImageStorage] Directory exists: ${dirInfo.exists}, isDir: ${dirInfo.isDirectory}`);

    // Copy the file from cache to permanent storage (safer than move)
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    
    console.log(`[ImageStorage] Success. Saved to ${destinationUri}`);
    return destinationUri;
  } catch (error) {
    console.error('[ImageStorage] Error in saveSnapImage:', error);
    throw error;
  }
}

/**
 * Copy an image (for when we can't move, e.g., from gallery)
 */
export async function copySnapImage(
  sourceUri: string,
  runMomentId: string
): Promise<string> {
  console.log(`[ImageStorage] copySnapImage called for source: ${sourceUri}`);

  try {
    await ensureSnapsDirectory();
    
    const filename = generateSnapFilename(runMomentId);
    const destinationUri = `${SNAPS_DIRECTORY}${filename}`;
    
    console.log(`[ImageStorage] Copying from ${sourceUri} to ${destinationUri}`);

    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    
    console.log(`[ImageStorage] Success. Saved to ${destinationUri}`);
    return destinationUri;
  } catch (error) {
    console.error('[ImageStorage] Error in copySnapImage:', error);
    throw error;
  }
}

/**
 * Delete a snap image from storage
 * @param uri - The local URI of the image to delete
 */
export async function deleteSnapImage(uri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri);
    }
  } catch (error) {
    console.error('Error deleting snap image:', error);
  }
}

/**
 * Delete all snap images for a run moment
 * @param runMomentId - The run moment ID to delete snaps for
 */
export async function deleteAllSnapsForRun(runMomentId: string): Promise<void> {
  try {
    await ensureSnapsDirectory();
    const files = await FileSystem.readDirectoryAsync(SNAPS_DIRECTORY);
    
    // Delete files that match the run moment ID prefix
    for (const file of files) {
      if (file.startsWith(runMomentId)) {
        await FileSystem.deleteAsync(`${SNAPS_DIRECTORY}${file}`);
      }
    }
  } catch (error) {
    console.error('Error deleting snaps for run:', error);
  }
}

/**
 * Get the size of the snaps directory (for storage management)
 */
export async function getSnapsStorageSize(): Promise<number> {
  try {
    await ensureSnapsDirectory();
    const files = await FileSystem.readDirectoryAsync(SNAPS_DIRECTORY);
    
    let totalSize = 0;
    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${SNAPS_DIRECTORY}${file}`);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error getting snaps storage size:', error);
    return 0;
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
