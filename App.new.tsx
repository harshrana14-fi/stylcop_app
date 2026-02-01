import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
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
import Dashboard from './components/Dashboard';
import Wardrobe from './components/Wardrobe';
import BattleArena from './components/BattleArena';
import ShopSwipe from './components/ShopSwipe';
import Profile from './components/Profile';
import AddItemModal from './components/AddItemModal';
import { colors, spacing, borderRadius, typography } from './styles';

type Screen = 'dashboard' | 'wardrobe' | 'battle' | 'shop' | 'profile';

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const user = {
    name: "Alex",
    college: "Stanford University",
    points: 1240,
    streak: 12,
    style: "Streetwear / Cyberpunk"
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'wardrobe': return <Wardrobe />;
      case 'battle': return <BattleArena />;
      case 'shop': return <ShopSwipe />;
      case 'profile': return <Profile user={user} />;
      default: return <Dashboard user={user} />;
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
                  source={{ uri: 'https://picsum.photos/seed/alex-stylcop/100/100' }}
                  style={[styles.avatarImage, { transform: [{ rotate: '-3deg' }] }]}
                />
              </View>
            </LinearGradient>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{user.name.toLowerCase()}</Text>
            <View style={styles.locationContainer}>
              <MapPin size={8} color={colors.cyan400} />
              <Text style={styles.college}>{user.college}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <View style={styles.streakContainer}>
            <TrendingUp size={12} color={colors.fuchsia500} />
            <Text style={styles.streakText}>{user.streak}D</Text>
          </View>
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

        {/* CENTRAL STYLISH ADD BUTTON (DIAMOND FAB) */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            onPress={() => setIsAddingItem(true)}
            style={styles.addButton}
          >
            <Plus size={36} color={colors.white} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Right Side Tabs */}
        <View style={styles.navRight}>
          <NavButton active={activeScreen === 'battle'} icon={<Swords />} onPress={() => setActiveScreen('battle')} label="Battle" />
          <NavButton active={activeScreen === 'shop'} icon={<ShoppingBag />} onPress={() => setActiveScreen('shop')} label="Cop" />
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
    style={[styles.navButton, active && styles.navButtonActive]}
  >
    <View style={[styles.navButtonIcon, active && styles.navButtonIconActive]}>
      {React.cloneElement(icon as React.ReactElement<any>, { 
        size: 22, 
        strokeWidth: active ? 2.5 : 2,
        color: active ? colors.fuchsia500 : colors.zinc500
      })}
    </View>
    <Text style={[styles.navButtonLabel, active && styles.navButtonLabelActive]}>
      {label}
    </Text>
    {active && <View style={styles.activeIndicator} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 39, 42, 0.5)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    padding: 2,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    transform: [{ scale: 1.1 }],
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 12,
    height: 12,
    backgroundColor: colors.green500,
    borderWidth: 2,
    borderColor: colors.black,
    borderRadius: borderRadius.full,
  },
  userInfo: {
    flexDirection: 'column',
  },
  username: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.white,
    textTransform: 'uppercase',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  college: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakContainer: {
    backgroundColor: colors.zinc900,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.zinc800,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.white,
  },
  bellButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.zinc900,
    borderRadius: borderRadius.xl,
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.zinc900,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  navLeft: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
  },
  navRight: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
  },
  addButtonContainer: {
    position: 'relative',
    top: -32,
  },
  addButton: {
    width: 64,
    height: 64,
    backgroundColor: colors.fuchsia600,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    shadowColor: colors.fuchsia600,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  navButton: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  navButtonActive: {
    // Active state styling handled by child components
  },
  navButtonIcon: {
    padding: 4,
  },
  navButtonIconActive: {
    transform: [{ scale: 1.1 }],
  },
  navButtonLabel: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.zinc500,
  },
  navButtonLabelActive: {
    color: colors.white,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    backgroundColor: colors.fuchsia500,
    borderRadius: borderRadius.full,
    marginTop: 2,
  },
});

export default App;