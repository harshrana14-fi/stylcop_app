import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Shirt, 
  Swords, 
  ShoppingBag, 
  Sparkles, 
  Plus,
  TrendingUp,
  MapPin,
  Bell
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Dashboard from './components/Dashboard';
import Wardrobe from './components/Wardrobe';
import BattleArena from './components/BattleArena';
import ShopSwipe from './components/ShopSwipe';
import Profile from './components/Profile';
import LikedProducts from './components/LikedProducts';
import AddItemModal from './components/AddItemModal';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import { colors, spacing, borderRadius, typography, styles } from './styles';
import { API_BASE_URL } from './constants';

type Screen = 'dashboard' | 'wardrobe' | 'battle' | 'shop' | 'profile' | 'liked-products';

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        // Verify token is still valid using lightweight validation endpoint
        const response = await fetch(`${API_BASE_URL}/api/users/validate-token`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.valid && result.user) {
            setUser(result.user);
            await AsyncStorage.setItem('user', JSON.stringify(result.user));
          } else if (result.valid) {
            setUser(JSON.parse(userData));
          } else {
            // Token invalid, clear storage
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
          }
        } else {
          // Server error or token expired, clear storage
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear invalid data on network error
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (storageError) {
        console.error('Storage cleanup error:', storageError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (userData: any) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileUpdate = async (updatedUser: any) => {
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save user to storage', e);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: colors.white, fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Show onboarding only if user has no saved preferences yet.
  // Once preferences are saved (non-empty array), onboarding will not appear again,
  // even if gender is missing or changed later.
  const needsOnboarding =
    !Array.isArray(user.preferences) || user.preferences.length === 0;

  if (needsOnboarding) {
    return (
      <OnboardingScreen
        user={user}
        onComplete={async (updatedUser) => {
          // Reuse profile update helper so user is stored in AsyncStorage too
          await handleProfileUpdate(updatedUser);
        }}
        onBack={handleLogout}
      />
    );
  }

  const userDisplay = {
    name: user.name,
    college: user.college,
    avatar: user.avatar,
    gender: user.gender || '',
    preferences: user.preferences || [],
    points: 1240,
    streak: 12,
    style: "Streetwear / Cyberpunk"
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard user={userDisplay} />;
      case 'wardrobe': return <Wardrobe />;
      case 'battle': return <BattleArena user={user} />;
      case 'shop': return <ShopSwipe user={user} />;
      case 'profile': return <Profile user={userDisplay} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} onShowLikedProducts={() => setActiveScreen('liked-products')} />;
      case 'liked-products': return <LikedProducts onBack={() => setActiveScreen('profile')} />;
      default: return <Dashboard user={userDisplay} />;
    }
  };

  return (
    <View style={styles.container}>
      
      {/* PERSISTENT HEADER - Accessible from all pages */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setActiveScreen('profile')}
          style={styles.headerLeft}
        >
          <View style={styles.avatarContainer}>
            <LinearGradient 
              colors={[colors.fuchsia600, colors.indigo600]}
              style={[styles.avatarGradient, { transform: [{ rotate: '3deg' }] }]}
            >
              <View style={styles.avatarInner}>
                <Image 
                  source={{ uri: user.avatar ? `${API_BASE_URL}${user.avatar}` : 'https://picsum.photos/seed/alex-stylcop/100/100' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 18,
                  }}
                />
              </View>
            </LinearGradient>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
              @{user.name.toLowerCase()}
            </Text>
            <View style={styles.locationContainer}>
              <MapPin size={8} color={colors.cyan400} />
              <Text style={styles.college} numberOfLines={1} ellipsizeMode="tail">
                {user.college}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellButton}>
            <Bell size={18} color={colors.zinc400} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {renderScreen()}
      </View>

      {/* BOTTOM NAVIGATION WITH STYLISH DIAMOND ADD BUTTON */}
      <View style={styles.bottomNav}>
        
        {/* Left Side Tabs */}
        <View style={styles.navLeft}>
          <NavButton active={activeScreen === 'dashboard'} icon={<Sparkles />} onPress={() => setActiveScreen('dashboard')} label="Daily" />
          <NavButton active={activeScreen === 'wardrobe'} icon={<Shirt />} onPress={() => setActiveScreen('wardrobe')} label="Closet" />
        </View>

        {/* Right Side Tabs */}
        <View style={styles.navRight}>
          <NavButton active={activeScreen === 'battle'} icon={<Swords />} onPress={() => setActiveScreen('battle')} label="Battle" />
          <NavButton active={activeScreen === 'shop'} icon={<ShoppingBag />} onPress={() => setActiveScreen('shop')} label="Cop" />
        </View>

        {/* CENTRAL STYLISH ADD BUTTON (DIAMOND FAB) */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            onPress={() => setIsAddingItem(true)}
            style={styles.addButton}
          >
            <Plus size={36} color={colors.white} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>

      {isAddingItem && <AddItemModal onClose={() => setIsAddingItem(false)} />}
    </View>
  );
};

interface NavButtonProps {
  active: boolean;
  icon: React.ReactNode;
  onPress: () => void;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, icon, onPress, label }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={{
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      minWidth: 50,
      opacity: active ? 1 : 0.6,
    }}
  >
    <View style={{
      padding: 4,
      transform: [{ scale: active ? 1.1 : 1 }],
    }}>
      {React.cloneElement(icon as React.ReactElement<any>, { 
        size: 20, 
        strokeWidth: active ? 2.5 : 2,
        color: active ? colors.fuchsia500 : colors.zinc500,
      })}
    </View>
    <Text style={{
      fontSize: 10,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: active ? colors.white : colors.zinc500,
      textAlign: 'center',
    }}>
      {label}
    </Text>
    {active && (
      <View style={{
        width: 4,
        height: 4,
        backgroundColor: colors.fuchsia500,
        borderRadius: 2,
        marginTop: 2,
      }} />
    )}
  </TouchableOpacity>
);

export default App;
