import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, ArrowLeft } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../styles';
import { API_BASE_URL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GENDER_OPTIONS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
];

const FASHION_PREFERENCES = [
  'Streetwear',
  'Minimalist',
  'Vintage',
  'Sporty',
  'Techwear',
  'Bohemian',
  'Classic',
  'Casual',
  'Formal',
  'Preppy',
  'Grunge',
  'Y2K',
  'Coastal',
  'Urban',
  'High Fashion',
  'Athleisure',
  'Romantic',
  'Edgy',
  'Artsy',
  'Sustainable',
];

const OnboardingScreen = ({
  user,
  onComplete,
  onBack,
}: {
  user: any;
  onComplete: (updatedUser: any) => void;
  onBack?: () => void;
}) => {
  const [gender, setGender] = useState<string>(user?.gender || '');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((user?.preferences as string[]) || [])
  );
  const [loading, setLoading] = useState(false);

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleContinue = async () => {
    if (!gender) {
      Alert.alert('Select your gender', 'Please choose your gender to continue.');
      return;
    }
    if (selected.size === 0) {
      Alert.alert('Select at least one', 'Pick your fashion vibes to continue.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Session expired. Please sign in again.');
        setLoading(false);
        return;
      }
      const payload = JSON.stringify({ preferences: Array.from(selected), gender });
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const url = `${API_BASE_URL}/api/users/preferences`;
      let response = await fetch(url, { method: 'PATCH', headers, body: payload });
      if (response.status === 404) {
        response = await fetch(url, { method: 'POST', headers, body: payload });
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = (data as { message?: string }).message || `Failed to save (${response.status})`;
        throw new Error(msg);
      }
      if (!data.user) throw new Error('Invalid response from server');
      const updatedUser = { ...user, preferences: data.user.preferences, gender: data.user.gender || gender };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      onComplete(updatedUser);
    } catch (e: any) {
      const msg = e.message || 'Could not save preferences. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Leave onboarding?',
      'You can sign in again later to complete setup.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: onBack },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {onBack ? (
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
          <ArrowLeft size={22} color={colors.white} strokeWidth={2.5} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Sparkles size={28} color={colors.fuchsia400} />
          </View>
          <Text style={styles.title}>What’s your vibe?</Text>
          <Text style={styles.subtitle}>
            Select the styles you’re into. We’ll use this to personalize your feed.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Your gender</Text>
        <View style={styles.genderRow}>
          {GENDER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setGender(opt.key)}
              activeOpacity={0.8}
              style={[styles.genderChip, gender === opt.key && styles.genderChipSelected]}
            >
              <Text style={[styles.genderChipText, gender === opt.key && styles.genderChipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Fashion styles you're into</Text>
        <View style={styles.chipsWrap}>
          {FASHION_PREFERENCES.map((label) => {
            const isSelected = selected.has(label);
            return (
              <TouchableOpacity
                key={label}
                onPress={() => toggle(label)}
                activeOpacity={0.8}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.continueText}>
              Continue ({selected.size} selected)
            </Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 48,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(192, 38, 211, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.zinc400,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.zinc400,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  genderChip: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.zinc700,
    backgroundColor: colors.zinc900,
    alignItems: 'center',
  },
  genderChipSelected: {
    borderColor: colors.fuchsia500,
    backgroundColor: 'rgba(217, 70, 239, 0.15)',
  },
  genderChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.zinc400,
  },
  genderChipTextSelected: {
    color: colors.fuchsia400,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.zinc700,
    backgroundColor: colors.zinc900,
  },
  chipSelected: {
    borderColor: colors.fuchsia500,
    backgroundColor: 'rgba(217, 70, 239, 0.15)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.zinc400,
  },
  chipTextSelected: {
    color: colors.fuchsia400,
  },
  continueButton: {
    backgroundColor: colors.fuchsia600,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  continueDisabled: {
    opacity: 0.7,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen;
