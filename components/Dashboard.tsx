import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { Sun, Info } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../styles';

const Dashboard = ({ user }: any) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Weather/Vibe Card */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherContent}>
          <View style={styles.weatherHeader}>
            <Sun size={14} />
            <Text style={styles.weatherLabel}>CURRENT VIBE</Text>
          </View>
          <Text style={styles.temperature}>24° Sunny</Text>
          <Text style={styles.weatherDescription}>Perfect for lightweight layers.</Text>
        </View>
        <View style={styles.weatherBlur} />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>OOTD Draft</Text>
        <View style={styles.aiInfo}>
          <Info size={10} />
          <Text style={styles.aiLabel}>AI Power Engine</Text>
        </View>
      </View>

      {/* Featured Outfit */}
      <View style={styles.outfitContainer}>
        <Image 
          source={{ uri: 'https://picsum.photos/seed/ootd-native/800/1000' }}
          style={styles.outfitImage}
        />
        <View style={styles.outfitOverlay}>
          <View style={styles.outfitTags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>STREETWEAR</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>COLLEGE</Text>
            </View>
          </View>
          <Text style={styles.outfitTitle}>"Neon Nightfall"</Text>
          <Text style={styles.outfitDescription}>Matching your tech-hoodie with cargo bottoms for a sharp silhouette.</Text>
          
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>CONFIRM FIT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Quick View */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardCyan]}>
          <Text style={styles.statLabel}>STYLE SCORE</Text>
          <Text style={styles.statValue}>8.4</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBar, styles.progressBarCyan]} />
          </View>
        </View>
        <View style={[styles.statCard, styles.statCardFuchsia]}>
          <Text style={styles.statLabel}>WINS</Text>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statSubtext}>+3 TODAY</Text>
        </View>
      </View>
      
      <View style={{ height: spacing['4xl'] }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  weatherCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  weatherContent: {
    zIndex: 1,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  weatherLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.fuchsia500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  temperature: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.white,
  },
  weatherDescription: {
    fontSize: 12,
    color: colors.zinc500,
    fontWeight: '600',
  },
  weatherBlur: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(192, 38, 211, 0.2)',
    borderRadius: borderRadius.full,
    position: 'absolute',
    right: -16,
    top: -16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    marginTop: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
    color: colors.white,
  },
  aiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  outfitContainer: {
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  outfitImage: {
    width: '100%',
    height: 450,
    resizeMode: 'cover',
  },
  outfitOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'linear-gradient(to top, black, black 20%, transparent)',
    padding: spacing.xl,
    paddingTop: spacing['3xl'],
  },
  outfitTags: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.white,
    textTransform: 'uppercase',
  },
  outfitTitle: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  outfitDescription: {
    fontSize: 14,
    color: colors.zinc400,
    fontWeight: '600',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  confirmButton: {
    width: '100%',
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.black,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: borderRadius['3xl'],
    padding: spacing.xl,
  },
  statCardCyan: {
    borderColor: 'rgba(6, 182, 212, 0.1)',
  },
  statCardFuchsia: {
    borderColor: 'rgba(217, 70, 239, 0.1)',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.white,
    marginTop: spacing.xs,
  },
  statSubtext: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.fuchsia500,
    marginTop: spacing.md,
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: colors.zinc900,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressBarCyan: {
    backgroundColor: colors.cyan400,
    width: '84%',
    shadowColor: colors.cyan400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default Dashboard;