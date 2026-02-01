import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Gem, Share2, Settings, ShieldCheck, BrainCircuit, Zap, Flame, Sparkles, LogOut, Pencil, X, Camera, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography } from '../styles';
import { API_BASE_URL } from '../constants';

const Profile = ({ user, onLogout, onProfileUpdate, onShowLikedProducts }: any) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editCollege, setEditCollege] = useState(user?.college || '');
  const [editAge, setEditAge] = useState(String(user?.age ?? ''));
  const [editAvatarUri, setEditAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditCollege(user.college || '');
      setEditAge(String(user.age ?? ''));
      setEditAvatarUri(null);
    }
  }, [user, showEditModal]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout }
      ]
    );
  };

  const openEditModal = () => setShowEditModal(true);
  const closeEditModal = () => setShowEditModal(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to change your picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]) setEditAvatarUri(result.assets[0].uri);
  };

  const saveProfile = async () => {
    const name = editName.trim();
    const college = editCollege.trim();
    const ageNum = parseInt(editAge, 10);
    if (!name) {
      Alert.alert('Error', 'Name is required.');
      return;
    }
    if (!college) {
      Alert.alert('Error', 'College is required.');
      return;
    }
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      Alert.alert('Error', 'Age must be between 13 and 100.');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please sign in again.');
        setSaving(false);
        return;
      }
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      let updatedUser = { ...user, name, college, age: ageNum };

      if (editAvatarUri) {
        const formData = new FormData();
        const filename = editAvatarUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('avatar', { uri: editAvatarUri, name: filename, type } as any);
        const avatarRes = await fetch(`${API_BASE_URL}/api/users/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const avatarData = await avatarRes.json().catch(() => ({}));
        if (avatarRes.ok && avatarData.user) {
          updatedUser = { ...updatedUser, avatar: avatarData.user.avatar };
        }
      }

      const body = JSON.stringify({ name, college, age: ageNum });
      let res = await fetch(`${API_BASE_URL}/api/users/profile`, { method: 'PATCH', headers, body });
      if (res.status === 404) res = await fetch(`${API_BASE_URL}/api/users/profile`, { method: 'POST', headers, body });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        updatedUser = { ...updatedUser, ...data.user };
        onProfileUpdate?.(updatedUser);
        closeEditModal();
      } else {
        Alert.alert('Error', (data as { message?: string }).message || 'Failed to save profile.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = editAvatarUri || (user?.avatar ? `${API_BASE_URL}${user.avatar}` : null);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Vault Persona</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={openEditModal}>
            <Pencil size={20} color={colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share2 size={20} color={colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <LogOut size={20} color={colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={closeEditModal} style={styles.editClose}>
                <X size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.editScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={pickImage} style={styles.editAvatarWrap}>
                {displayAvatar ? (
                  <Image source={{ uri: displayAvatar }} style={styles.editAvatar} />
                ) : (
                  <View style={styles.editAvatarPlaceholder}>
                    <Camera size={32} color={colors.zinc500} />
                  </View>
                )}
                <View style={styles.editAvatarBadge}>
                  <Pencil size={14} color={colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.editAvatarLabel}>Change photo</Text>

              <Text style={styles.editLabel}>Name</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={colors.zinc500}
                autoCapitalize="words"
              />
              <Text style={styles.editLabel}>College</Text>
              <TextInput
                style={styles.editInput}
                value={editCollege}
                onChangeText={setEditCollege}
                placeholder="College name"
                placeholderTextColor={colors.zinc500}
              />
              <Text style={styles.editLabel}>Age</Text>
              <TextInput
                style={styles.editInput}
                value={editAge}
                onChangeText={setEditAge}
                placeholder="Age"
                placeholderTextColor={colors.zinc500}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.editSaveBtn, saving && styles.editSaveDisabled]}
                onPress={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.editSaveText}>Save</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Identity Hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroBackground} />
        
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient 
              colors={[colors.fuchsia600, colors.indigo600]}
              style={[styles.avatarGradient, { transform: [{ rotate: '6deg' }] }]}
            >
              <View style={styles.avatarInner}>
                <Image 
                  source={{ uri: user.avatar ? `${API_BASE_URL}${user.avatar}` : 'https://picsum.photos/seed/profile-native/400/400' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 36,
                  }}
                />
              </View>
            </LinearGradient>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={16} color={colors.white} strokeWidth={2.5} />
            </View>
          </View>
        </View>

        <Text style={styles.profileName}>{user.name}</Text>
        <View style={styles.profileInfo}>
          <Text style={styles.level}>LVL. 42</Text>
          <View style={styles.divider} />
          <Text style={styles.rank}>TOP 1% GLOBAL</Text>
        </View>
        {user.gender && (
          <Text style={styles.genderLabel}>
            {user.gender === 'male' ? 'Male' : user.gender === 'female' ? 'Female' : user.gender === 'other' ? 'Other' : ''}
          </Text>
        )}
      </View>

      {/* Fashion preferences (from onboarding) */}
      {user.preferences && Array.isArray(user.preferences) && user.preferences.length > 0 && (
        <View style={styles.preferencesSection}>
          <Text style={styles.preferencesLabel}>MY STYLE VIBES</Text>
          <View style={styles.preferencesWrap}>
            {user.preferences.map((pref: string, i: number) => (
              <View key={i} style={styles.preferenceChip}>
                <Text style={styles.preferenceChipText}>{pref}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Liked Products Button */}
      {onShowLikedProducts && (
        <TouchableOpacity
          style={styles.likedProductsButton}
          onPress={onShowLikedProducts}
          activeOpacity={0.8}
        >
          <View style={styles.likedProductsButtonContent}>
            <Heart size={20} color={colors.fuchsia400} strokeWidth={2.5} />
            <Text style={styles.likedProductsButtonText}>View Liked Products</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* AI Style Archetype */}
      <View style={styles.archetypeCard}>
        <View style={styles.archetypeHeader}>
          <View style={styles.archetypeIcon}>
            <BrainCircuit size={20} color={colors.cyan400} strokeWidth={2.5} />
          </View>
          <Text style={styles.archetypeLabel}>INTELLIGENCE INSIGHT</Text>
        </View>
        <Text style={styles.archetypeTitle}>"Futurist Street Architect"</Text>
        <Text style={styles.archetypeDescription}>
          Your style signature combines <Text style={styles.highlight}>Neo-Cyberpunk</Text> utility with <Text style={styles.highlight}>90s Japanese</Text> layers.
        </Text>
      </View>

      {/* Composition Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsLabel}>DNA COMPOSITION</Text>
          <TouchableOpacity>
            <Text style={styles.expandText}>EXPAND</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsList}>
          <StatLine label="Streetwear" percent={82} color={colors.fuchsia500} />
          <StatLine label="Techwear" percent={54} color={colors.cyan500} />
          <StatLine label="Avant-Garde" percent={22} color={colors.indigo500} />
        </View>
      </View>

      {/* Perks Grid */}
      <View style={styles.perksSection}>
        <Text style={styles.perksLabel}>COLLECTED PERKS</Text>
        <View style={styles.perksGrid}>
          <PerkBadge icon={<Zap size={24} color={colors.white} strokeWidth={2.5} />} label="Swift" />
          <PerkBadge icon={<ShieldCheck size={24} color={colors.white} strokeWidth={2.5} />} label="Drip" />
          <PerkBadge icon={<Flame size={24} color={colors.orange500} strokeWidth={2.5} />} label="Hot" locked />
          <PerkBadge icon={<Sparkles size={24} color={colors.white} strokeWidth={2.5} />} label="MVP" />
        </View>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const StatLine = ({ label, percent, color }: any) => (
  <View style={styles.statLine}>
    <View style={styles.statHeader}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{percent}%</Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View 
        style={[styles.progressBar, { backgroundColor: color, width: `${percent}%` }]}
      />
    </View>
  </View>
);

const PerkBadge = ({ icon, label, locked }: any) => (
  <TouchableOpacity style={[styles.perkBadge, locked && styles.perkLocked]}>
    {icon}
    <Text style={[styles.perkLabel, locked && styles.perkLabelLocked]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    backgroundColor: colors.zinc800,
    padding: 10,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.zinc700,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
    color: colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: 10,
    backgroundColor: colors.zinc800,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.zinc700,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.1)',
    borderRadius: 56,
    padding: 40,
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: 'rgba(192, 38, 211, 0.1)',
    // blurRadius: 60,  // Removed unsupported property
  },
  avatarSection: {
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 128,
    height: 128,
    borderRadius: 40,
    padding: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: colors.black,
    borderWidth: 2,
    borderColor: colors.zinc800,
    padding: 8,
    borderRadius: borderRadius.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileName: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  level: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan400,
  },
  divider: {
    width: 4,
    height: 4,
    backgroundColor: colors.zinc700,
    borderRadius: borderRadius.full,
  },
  rank: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  genderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.zinc400,
    marginTop: spacing.sm,
    textTransform: 'capitalize',
  },
  preferencesSection: {
    marginBottom: spacing.xl,
  },
  preferencesLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  preferencesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  preferenceChip: {
    backgroundColor: 'rgba(217, 70, 239, 0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(217, 70, 239, 0.5)',
  },
  preferenceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  likedProductsButton: {
    backgroundColor: colors.zinc900,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.zinc800,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  likedProductsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  likedProductsButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  archetypeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 40,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  archetypeIcon: {
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    padding: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  archetypeLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  archetypeTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.1,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  archetypeDescription: {
    fontSize: 12,
    color: colors.zinc500,
    fontWeight: '600',
    lineHeight: 18,
  },
  highlight: {
    color: colors.white,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xl,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  expandText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.zinc400,
    textTransform: 'uppercase',
  },
  statsList: {
    gap: spacing.xl,
  },
  statLine: {
    gap: spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.white,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.zinc900,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  perksSection: {
    gap: spacing.lg,
  },
  perksLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingHorizontal: spacing.xs,
  },
  perksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  perkBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.zinc800,
    borderRadius: 24,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    width: '22%',
  },
  perkLocked: {
    opacity: 0.65,
    transform: [{ scale: 0.95 }],
  },
  perkLabel: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.white,
  },
  perkLabelLocked: {
    color: colors.zinc400,
  },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  editCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: colors.zinc900,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.zinc800,
    overflow: 'hidden',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.zinc800,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    fontStyle: 'italic',
  },
  editClose: {
    padding: spacing.sm,
  },
  editScroll: {
    maxHeight: 480,
  },
  editAvatarWrap: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    position: 'relative',
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.zinc800,
  },
  editAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.zinc800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.fuchsia600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarLabel: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
    color: colors.zinc500,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.zinc400,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginHorizontal: spacing.xl,
  },
  editInput: {
    backgroundColor: colors.zinc800,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    color: colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.zinc700,
    marginHorizontal: spacing.xl,
  },
  editSaveBtn: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.fuchsia600,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  editSaveDisabled: {
    opacity: 0.7,
  },
  editSaveText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
  },
});

export default Profile;