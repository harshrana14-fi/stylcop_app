import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '../constants';

// Convert local image URI to base64 (React Native: fetch(uri) fails for file:// / content://)
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Image conversion error:', error);
    throw error;
  }
};

// Backend API call for clothing analysis
export const analyzeClothing = async (imageBase64: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-clothing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Validate response structure
    if (!result.category || !result.style || !result.colors || !result.description) {
      throw new Error('Invalid response format from backend');
    }
    
    // Normalize category to match our database enum
    const categoryMap: Record<string, string> = {
      'shirt': 'TOP',
      't-shirt': 'TOP',
      'hoodie': 'TOP',
      'sweater': 'TOP',
      'jacket': 'OUTERWEAR',
      'coat': 'OUTERWEAR',
      'pants': 'BOTTOM',
      'jeans': 'BOTTOM',
      'skirt': 'BOTTOM',
      'dress': 'BOTTOM',
      'shoes': 'SHOES',
      'sneakers': 'SHOES',
      'boots': 'SHOES',
      'accessories': 'ACCESSORY',
      'hat': 'ACCESSORY',
      'bag': 'ACCESSORY'
    };
    
    const normalizedCategory = categoryMap[result.category.toLowerCase()] || 'TOP';
    
    return {
      category: normalizedCategory,
      style: result.style,
      colors: result.colors,
      description: result.description
    };
    
  } catch (error) {
    console.error('Clothing analysis error:', error);
    // Return default values if analysis fails
    return {
      category: 'TOP',
      style: 'STREETWEAR',
      colors: ['#000000'],
      description: 'Clothing item'
    };
  }
};
