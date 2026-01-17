import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { runnerTheme } from '../constants/theme';

interface CameraCaptureProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string, caption?: string, fromGallery?: boolean) => Promise<void>;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  visible,
  onClose,
  onCapture,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      if (photo) {
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCaption('');
  };

  const handleSave = async () => {
    if (!capturedImage) return;

    setSaving(true);
    try {
      // Check if image is from gallery (starts with file:// but not from camera cache)
      const isFromGallery = !capturedImage.includes('Camera');
      await onCapture(capturedImage, caption || undefined, isFromGallery);
      
      // Reset state
      setCapturedImage(null);
      setCaption('');
      onClose();
    } catch (error) {
      console.error('Error saving snap:', error);
      Alert.alert('Error', 'Failed to save snap');
    } finally {
      setSaving(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleClose = () => {
    setCapturedImage(null);
    setCaption('');
    onClose();
  };

  // Permission handling
  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent>
        <SafeAreaView style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={runnerTheme.colors.textMuted} />
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>
            We need camera access to capture your run moments
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {!capturedImage ? (
          // Camera View
          <>
            <CameraView 
              ref={cameraRef}
              style={styles.camera} 
              facing={facing}
            >
              {/* Top controls */}
              <SafeAreaView style={styles.topControls}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
                  <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </SafeAreaView>

              {/* Bottom controls */}
              <View style={styles.bottomControls}>
                <TouchableOpacity onPress={handlePickFromGallery} style={styles.galleryButton}>
                  <Ionicons name="images-outline" size={24} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                
                <View style={styles.placeholderButton} />
              </View>
            </CameraView>
          </>
        ) : (
          // Preview View
          <SafeAreaView style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            
            {/* Overlay controls */}
            <View style={styles.previewOverlay}>
              {/* Caption input */}
              <View style={styles.captionContainer}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add a caption..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={caption}
                  onChangeText={setCaption}
                  multiline
                  maxLength={200}
                />
              </View>

              {/* Action buttons */}
              <View style={styles.previewActions}>
                <TouchableOpacity onPress={handleRetake} style={styles.retakeButton}>
                  <Ionicons name="refresh" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Retake</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleSave} 
                  style={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={24} color="#fff" />
                      <Text style={styles.actionButtonText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Permission screen
  permissionContainer: {
    flex: 1,
    backgroundColor: runnerTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: runnerTheme.colors.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: runnerTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: runnerTheme.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  cancelButtonText: {
    fontSize: 16,
    color: runnerTheme.colors.textSecondary,
  },

  // Camera view
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 48,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  placeholderButton: {
    width: 48,
    height: 48,
  },

  // Preview view
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  captionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  captionInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 50,
    maxHeight: 100,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: runnerTheme.colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    minWidth: 120,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
