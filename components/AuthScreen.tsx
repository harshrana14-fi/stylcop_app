import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { colors, spacing, borderRadius } from '../styles';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Eye, EyeOff } from 'lucide-react-native';
import { API_BASE_URL } from '../constants';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [age, setAge] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      return false;
    }
    return true;
  };

  const pickAvatar = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatar
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Error', 'Failed to pick avatar');
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin) {
      if (!name || !college || !age) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      if (parseInt(age) < 13 || parseInt(age) > 100) {
        Alert.alert('Error', 'Age must be between 13 and 100');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      if (!isLogin) {
        formData.append('name', name);
        formData.append('college', college);
        formData.append('age', age);
        
        if (avatar) {
          const filename = avatar.split('/').pop() || 'avatar.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image';
          
          formData.append('avatar', {
            uri: avatar,
            name: filename,
            type,
          } as any);
        }
      }

      // Set timeout for the fetch request to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `${API_BASE_URL}/api/auth/${isLogin ? 'login' : 'signup'}`,
        {
          method: 'POST',
          body: formData,
          signal: controller.signal, // Add abort signal for timeout
          // Note: Don't set Content-Type header when using FormData with fetch
          // The browser will set the correct boundary
        }
      );
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store token and user data
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      
      onAuthSuccess(data.user);
    } catch (error: any) {
      console.error('Auth error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      
      let errorMessage = 'Authentication failed';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.errmsg) {
        errorMessage = error.errmsg;
      }
      
      Alert.alert('Error', errorMessage || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>STYLCOP</Text>
        <Text style={styles.subtitle}>AI-Powered Fashion Platform</Text>
      </View>

      {!isLogin && (
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>+</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Profile Picture</Text>
        </View>
      )}

      {!isLogin && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.zinc500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>College *</Text>
            <TextInput
              style={styles.input}
              value={college}
              onChangeText={setCollege}
              placeholder="Enter your college name"
              placeholderTextColor={colors.zinc500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              placeholderTextColor={colors.zinc500}
              keyboardType="numeric"
            />
          </View>
        </>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={colors.zinc500}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.zinc500}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.zinc400} />
            ) : (
              <Eye size={20} color={colors.zinc400} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.authButton, loading && styles.disabledButton]}
        onPress={handleAuth}
        disabled={loading}
      >
        <Text style={styles.authButtonText}>
          {loading ? 'Processing...' : (isLogin ? 'LOGIN' : 'SIGN UP')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.switchText}>
          {isLogin 
            ? "Don't have an account? Sign Up" 
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.fuchsia500,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.zinc400,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.zinc700,
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.zinc800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: colors.zinc500,
    fontWeight: '300',
  },
  avatarLabel: {
    color: colors.zinc400,
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.zinc800,
    borderRadius: borderRadius.md,
    padding: 16,
    color: colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.zinc700,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.zinc800,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.zinc700,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: colors.white,
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
  },
  authButton: {
    backgroundColor: colors.fuchsia600,
    padding: 18,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  authButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  switchButton: {
    alignItems: 'center',
    padding: 16,
  },
  switchText: {
    color: colors.cyan400,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthScreen;