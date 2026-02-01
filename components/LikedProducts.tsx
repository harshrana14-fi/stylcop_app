import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Heart, ExternalLink, Trash2, ArrowLeft } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../styles';
import { API_BASE_URL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LikedProduct = {
  id: string;
  title: string;
  price: string;
  link: string;
  image: string;
  source: string;
  createdAt: string;
};

const LikedProducts = ({ onBack }: { onBack?: () => void }) => {
  const [products, setProducts] = useState<LikedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLikedProducts = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('[LikedProducts] No token');
        setProducts([]);
        return;
      }
      console.log('[LikedProducts] Fetching liked products...');
      const res = await fetch(`${API_BASE_URL}/api/liked-products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      console.log('[LikedProducts] Response:', res.status, data);
      if (res.ok && Array.isArray(data)) {
        console.log('[LikedProducts] Found', data.length, 'products');
        setProducts(data);
      } else {
        console.error('[LikedProducts] Failed to fetch:', data);
        setProducts([]);
      }
    } catch (e: any) {
      console.error('[LikedProducts] Fetch error:', e?.message || e);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLikedProducts();
  }, [fetchLikedProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLikedProducts();
  }, [fetchLikedProducts]);

  const removeProduct = async (id: string) => {
    setDeletingId(id);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please sign in again.');
        setDeletingId(null);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/liked-products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert('Error', (data.message as string) || 'Failed to remove product');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to remove product');
    } finally {
      setDeletingId(null);
    }
  };

  const openProductLink = (link: string) => {
    if (!link) return;
    Linking.canOpenURL(link).then((supported) => {
      if (supported) Linking.openURL(link);
      else Alert.alert('Error', 'Cannot open link');
    });
  };

  const upgradeImageUrl = (url: string): string => {
    if (!url) return url;
    try {
      if (url.includes('flipkart.com') || url.includes('flixcart.com')) {
        let upgraded = url.replace(/q=\d+/, 'q=80');
        upgraded = upgraded.replace(/w=\d+/, 'w=800');
        upgraded = upgraded.replace(/h=\d+/, 'h=800');
        if (upgraded.startsWith('//')) upgraded = 'https:' + upgraded;
        return upgraded;
      }
      if (url.includes('amazon.in') || url.includes('images-amazon.com') || url.includes('amazonaws.com')) {
        let upgraded = url.replace(/\._AC_[A-Z0-9]+_/, '._AC_SX679_');
        upgraded = upgraded.replace(/\._AC_[A-Z0-9]+_/, '._AC_SY679_');
        if (!upgraded.includes('_AC_') && upgraded.includes('.jpg')) {
          upgraded = upgraded.replace('.jpg', '._AC_SX679_.jpg');
        }
        return upgraded;
      }
    } catch (e) {
      return url;
    }
    return url;
  };

  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.fuchsia500} />
        <Text style={styles.loadingText}>Loading your liked products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
          <ArrowLeft size={22} color={colors.white} strokeWidth={2.5} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Heart size={24} color={colors.fuchsia500} strokeWidth={2.5} />
          <Text style={styles.title}>Liked Products</Text>
        </View>
        <Text style={styles.count}>{products.length} items</Text>
      </View>

      {products.length === 0 ? (
        <View style={styles.empty}>
          <Heart size={48} color={colors.zinc600} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No liked products yet</Text>
          <Text style={styles.emptySub}>Start liking products in the Shop to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.fuchsia500}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardImageWrap}
                onPress={() => openProductLink(item.link)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: upgradeImageUrl(item.image) }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.cardOverlay}>
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceBadgeText}>{item.source.toUpperCase()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardPrice}>{item.price}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => openProductLink(item.link)}
                    activeOpacity={0.8}
                  >
                    <ExternalLink size={14} color={colors.white} />
                    <Text style={styles.shopButtonText}>Shop</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeProduct(item.id)}
                    disabled={deletingId === item.id}
                    activeOpacity={0.8}
                  >
                    {deletingId === item.id ? (
                      <ActivityIndicator size="small" color={colors.zinc400} />
                    ) : (
                      <Trash2 size={16} color={colors.zinc400} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.zinc400,
    marginTop: spacing.md,
    fontSize: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
    color: colors.white,
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.zinc500,
    textTransform: 'uppercase',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  emptySub: {
    fontSize: 14,
    color: colors.zinc500,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.zinc900,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.zinc800,
    overflow: 'hidden',
    maxWidth: '48%',
  },
  cardImageWrap: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.zinc800,
  },
  cardOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  sourceBadge: {
    backgroundColor: colors.fuchsia600,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  sourceBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.white,
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
    minHeight: 36,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
    marginBottom: spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  shopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.fuchsia600,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  shopButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.white,
    textTransform: 'uppercase',
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.zinc800,
    borderRadius: borderRadius.lg,
  },
});

export default LikedProducts;
