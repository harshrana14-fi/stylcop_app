import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '../styles';

interface ImagePickerProps {
  onImageSelected: (uri: string) => void;
  onClose: () => void;
}

const ImagePickerModal: React.FC<ImagePickerProps> = ({ onImageSelected, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      return false;
    }
    
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
      return false;
    }
    
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait aspect ratio
        quality: 1,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait aspect ratio
        quality: 1,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onImageSelected(selectedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Photo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!selectedImage ? (
            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
                <View style={styles.optionIcon}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
                <Text style={styles.optionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={pickImageFromGallery}>
                <View style={styles.optionIcon}>
                  <Text style={styles.galleryIcon}>🖼️</Text>
                </View>
                <Text style={styles.optionText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <View style={styles.previewActions}>
                <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <Text style={styles.confirmText}>Use Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.zinc800,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    color: colors.zinc400,
    fontSize: 24,
    fontWeight: '900',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
  },
  optionButton: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.lg,
    width: 120,
  },
  optionIcon: {
    marginBottom: spacing.md,
  },
  cameraIcon: {
    fontSize: 40,
  },
  galleryIcon: {
    fontSize: 40,
  },
  optionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 267,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  retakeButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.zinc700,
    borderRadius: borderRadius.md,
    minWidth: 100,
  },
  retakeText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.fuchsia600,
    borderRadius: borderRadius.md,
    minWidth: 100,
  },
  confirmText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default ImagePickerModal;