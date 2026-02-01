import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, Animated, Alert } from 'react-native';
import { X, Camera, Image as ImageIcon, Wand2, CheckCircle2, Activity } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';
import ImagePickerModal from './ImagePicker';
import { analyzeClothing, imageToBase64 } from '../services/geminiService';

const AddItemModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [animation] = useState(new Animated.Value(0));

  const handleImageSelected = async (uri: string) => {
    setSelectedImage(uri);
    setShowImagePicker(false);
    
    // Upload image to backend
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Analyze image (use defaults if local base64 or API fails)
      let analysis = { category: 'TOP', style: 'STREETWEAR', colors: ['#000000'], description: 'Clothing item' };
      try {
        const base64Image = await imageToBase64(uri);
        analysis = await analyzeClothing(base64Image);
      } catch (_) {
        // Keep defaults; upload still proceeds
      }
      setAnalysisResult(analysis);

      // React Native FormData expects { uri, name, type } for files (not Blob)
      const filename = uri.split('/').pop() || 'closet-item.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('image', { uri, name: filename, type } as any);
      formData.append('category', analysis.category);
      formData.append('style', analysis.style);
      formData.append('description', analysis.description);
      formData.append('tags', Array.isArray(analysis.colors) ? analysis.colors.join(',') : '');

      const uploadResponse = await fetch(`${API_BASE_URL}/api/closet/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const err = await uploadResponse.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || 'Upload failed');
      }

      startAnalysis();
    } catch (error) {
      console.error('Upload error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to upload image';
      Alert.alert('Error', msg);
    }
  };

  const startAnalysis = () => {
    setStep('processing');
    setTimeout(() => setStep('result'), 2500);
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={32} />
        </TouchableOpacity>

        <View style={styles.content}>
          {step === 'upload' && (
            <View style={styles.uploadContainer}>
              <View style={styles.cameraIconContainer}>
                <Camera size={40} />
              </View>
              
              <View style={styles.titleContainer}>
                <Text style={styles.title}>SCAN YOUR DRIP</Text>
                <Text style={styles.description}>Our AI will instantly classify your item.</Text>
              </View>

              <View style={styles.uploadActions}>
                <TouchableOpacity 
                  onPress={() => setShowImagePicker(true)}
                  style={styles.uploadButton}
                >
                  <ImageIcon size={22} />
                  <Text style={styles.uploadButtonText}>UPLOAD IMAGE</Text>
                </TouchableOpacity>
                <Text style={styles.supportText}>SUPPORTED: PNG, JPEG (MAX 10MB)</Text>
              </View>
            </View>
          )}

          {step === 'processing' && (
            <View style={styles.processingContainer}>
              <View style={styles.spinnerContainer}>
                <View style={styles.spinner}>
                  <Activity size={120} />
                </View>
                <View style={styles.wandContainer}>
                  <Wand2 size={48} />
                </View>
              </View>
              <View style={styles.processingText}>
                <Text style={styles.processingTitle}>Classifying...</Text>
                <Text style={styles.processingSubtitle}>GENERATING METADATA</Text>
              </View>
            </View>
          )}

          {step === 'result' && (
            <View style={styles.resultContainer}>
              <View style={styles.resultImageContainer}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.resultImage} />
                ) : (
                  <Image source={{ uri: 'https://picsum.photos/seed/scan1/400/600' }} style={styles.resultImage} />
                )}
                <View style={styles.resultOverlay}>
                  <CheckCircle2 size={64} />
                </View>
              </View>

              <View style={styles.resultInfo}>
                <View style={styles.resultTags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{analysisResult?.category || 'TOP'}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{analysisResult?.style || 'STREETWEAR'}</Text>
                  </View>
                </View>
                <Text style={styles.resultDescription}>
                  {analysisResult?.description || '"Tech-influenced utility item with multiple styling options."'}
                </Text>
                
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.addButton}
                >
                  <Text style={styles.addButtonText}>ADD TO WARDROBE</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        {showImagePicker && (
          <ImagePickerModal 
            onImageSelected={handleImageSelected}
            onClose={() => setShowImagePicker(false)}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 32,
    padding: spacing.sm,
  },
  content: {
    width: '100%',
    maxWidth: 384,
    alignItems: 'center',
    gap: 40,
  },
  uploadContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 48,
  },
  cameraIconContainer: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(192, 38, 211, 0.1)',
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.2)',
    shadowColor: 'rgba(217, 70, 239, 0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 10,
  },
  titleContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
    color: colors.white,
  },
  description: {
    fontSize: 12,
    color: colors.zinc500,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  uploadActions: {
    width: '100%',
    gap: spacing.lg,
  },
  uploadButton: {
    width: '100%',
    backgroundColor: colors.white,
    paddingVertical: 20,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    shadowColor: 'rgba(255, 255, 255, 0.1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.black,
  },
  supportText: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '900',
    color: colors.zinc700,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  processingContainer: {
    alignItems: 'center',
    gap: 32,
  },
  spinnerContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    opacity: 0.2,
  },
  wandContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  processingSubtitle: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  resultContainer: {
    width: '100%',
    gap: 40,
    alignItems: 'center',
  },
  resultImageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.fuchsia500,
    shadowColor: colors.fuchsia500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 15,
  },
  resultImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    width: '100%',
    gap: 24,
    alignItems: 'center',
  },
  resultTags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.zinc900,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.zinc800,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.white,
  },
  resultDescription: {
    fontSize: 11,
    color: colors.zinc500,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  addButton: {
    width: '100%',
    backgroundColor: colors.fuchsia600,
    paddingVertical: 20,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: colors.fuchsia500,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.white,
  },
});

export default AddItemModal;