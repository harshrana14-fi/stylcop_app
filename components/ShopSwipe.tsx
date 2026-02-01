import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { X, Heart, ExternalLink, Info, Search } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../styles';
import { SCRAPPER_API_URL, API_BASE_URL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_OFFSET = SCREEN_WIDTH * 1.2;
const SWIPE_DURATION = 280;

type ScrapperProduct = {
  title: string;
  price: string;
  link: string;
  image: string;
  source: string;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  price: string;
  img: string;
  link: string;
  reason?: string;
};

const DEFAULT_QUERIES = ['fashion', 'clothing', 'trendy outfit', 'streetwear'];
const BUDGET_OPTIONS = [
  { key: 'budget-friendly', label: 'Under ₹1k', maxPrice: 1000 },
  { key: 'mid-range', label: 'Under ₹3k', maxPrice: 3000 },
  { key: 'premium', label: 'Any', maxPrice: null },
];

const genderPrefix = (g: string) =>
  g === 'male' ? 'men' : g === 'female' ? 'women' : '';

const ShopSwipe = ({ user }: { user?: any }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('fashion');
  const [budgetKey, setBudgetKey] = useState('budget-friendly');
  const [page, setPage] = useState(1);
  // Product listings section state
  const [listingsSearch, setListingsSearch] = useState('');
  const [listingsProducts, setListingsProducts] = useState<ScrapperProduct[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  // Fresh Animated.Value per card - avoids native driver state carryover
  const [animValues, setAnimValues] = useState(() => ({
    translateX: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }));
  const isAnimating = useRef(false);

  const upgradeImageUrl = (url: string): string => {
    if (!url) return url;
    try {
      // Flipkart: Upgrade thumbnail to higher resolution
      if (url.includes('flipkart.com') || url.includes('flixcart.com')) {
        // Replace quality and dimensions for better resolution
        let upgraded = url.replace(/q=\d+/, 'q=80');
        upgraded = upgraded.replace(/w=\d+/, 'w=800');
        upgraded = upgraded.replace(/h=\d+/, 'h=800');
        // If it's a relative URL, make sure it's absolute
        if (upgraded.startsWith('//')) upgraded = 'https:' + upgraded;
        return upgraded;
      }
      // Amazon: Try to get higher resolution version (SX679 = 679px width)
      if (url.includes('amazon.in') || url.includes('images-amazon.com') || url.includes('amazonaws.com')) {
        // Replace AC_ size codes with larger ones
        let upgraded = url.replace(/\._AC_[A-Z0-9]+_/, '._AC_SX679_');
        upgraded = upgraded.replace(/\._AC_[A-Z0-9]+_/, '._AC_SY679_');
        // If no AC_ code found, try adding one
        if (!upgraded.includes('_AC_') && upgraded.includes('.jpg')) {
          upgraded = upgraded.replace('.jpg', '._AC_SX679_.jpg');
        }
        return upgraded;
      }
    } catch (e) {
      // If URL manipulation fails, return original
      return url;
    }
    return url;
  };

  const mapScrapperToProduct = (p: ScrapperProduct, index: number, pageOffset = 0): Product => ({
    id: `${p.source}-p${pageOffset}-${index}-${p.link?.slice(-8) || index}`,
    name: p.title || 'Product',
    brand: p.source || 'Shop',
    price: p.price || '—',
    img: upgradeImageUrl(p.image || 'https://picsum.photos/seed/shop/800/1200'),
    link: p.link || '',
    reason: `From ${p.source}`,
  });

  const buildQuery = useCallback((base: string) => {
    const prefix = genderPrefix(user?.gender || '');
    return prefix ? `${prefix} ${base}` : base;
  }, [user?.gender]);

  const fetchProducts = useCallback(async (query?: string, budget?: string, pageNum = 1, append = false) => {
    const q = query ?? searchQuery;
    const b = budget ?? budgetKey;
    const fullQuery = buildQuery(q || 'fashion');
    try {
      if (!append) setError(null);
      const res = await fetch(`${SCRAPPER_API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery, budget: b, page: pageNum }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!append) {
          setProducts([]);
          setError((data.error as string) || 'Could not load products');
        }
        return;
      }
      const list: ScrapperProduct[] = data.products || [];
      const mapped = list.map((p, i) => mapScrapperToProduct(p, i, pageNum));
      if (append) {
        if (mapped.length > 0) {
          setProducts((prev) => {
            const next = [...prev, ...mapped];
            setTimeout(() => setCurrentIndex(prev.length), 0);
            return next;
          });
        } else {
          setCurrentIndex(0);
        }
      } else {
        setProducts(mapped);
        setCurrentIndex(0);
        setPage(1);
      }
    } catch (e: any) {
      if (!append) {
        setProducts([]);
        setError(e?.message || 'Scrapper not reachable. Start Python backend: cd Scrapper/backend && python app.py');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [searchQuery, budgetKey, buildQuery]);

  useEffect(() => {
    setLoading(true);
    fetchProducts(searchQuery, budgetKey, 1, false);
  }, [user?.gender]);

  useEffect(() => {
    setAnimValues({
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(1),
    });
  }, [currentIndex]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(searchQuery, budgetKey, 1, false);
  }, [fetchProducts, searchQuery, budgetKey]);

  const loadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(searchQuery, budgetKey, nextPage, true);
  }, [fetchProducts, searchQuery, budgetKey, page, loadingMore]);

  const goToNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < products.length) {
      setCurrentIndex(nextIdx);
      if (nextIdx >= products.length - 3 && !loadingMore) loadMore();
    } else {
      loadMore();
      setCurrentIndex((prev) => prev);
    }
  };

  const runSwipe = (direction: 'left' | 'right') => {
    if (isAnimating.current || products.length === 0) return;
    isAnimating.current = true;
    const tx = animValues.translateX;
    const op = animValues.opacity;
    const toValue = direction === 'right' ? SWIPE_OFFSET : -SWIPE_OFFSET;
    Animated.parallel([
      Animated.timing(tx, {
        toValue,
        duration: SWIPE_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(op, {
        toValue: 0.6,
        duration: SWIPE_DURATION,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) goToNext();
      isAnimating.current = false;
    });
  };

  const saveLikedProduct = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('[ShopSwipe] No token, skipping save');
        return;
      }
      // Ensure we have minimum required fields
      if (!product.name) {
        console.log('[ShopSwipe] Missing product name');
        return;
      }
      // Use fallback values for missing fields
      const payload = {
        title: product.name,
        price: product.price || '—',
        link: product.link || `https://placeholder.com/product/${product.id}`,
        image: product.img || 'https://picsum.photos/seed/product/400/400',
        source: product.brand || 'Shop',
      };
      console.log('[ShopSwipe] Saving liked product:', payload);
      const res = await fetch(`${API_BASE_URL}/api/liked-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('[ShopSwipe] Save failed:', res.status, data);
        // Show error to user if it's not a duplicate
        if (res.status !== 400 || !data.message?.includes('already liked')) {
          Alert.alert('Error', `Failed to save: ${data.message || 'Unknown error'}`);
        }
      } else {
        console.log('[ShopSwipe] Product saved successfully:', data);
      }
    } catch (e: any) {
      console.error('[ShopSwipe] Save liked product error:', e?.message || e);
      Alert.alert('Error', 'Failed to save liked product. Please try again.');
    }
  };

  const handleLike = () => {
    if (product && product.link) {
      console.log('[ShopSwipe] Liking product:', product.name, product.link);
      saveLikedProduct(product);
    } else {
      console.log('[ShopSwipe] Cannot like - missing product or link:', { product: !!product, link: product?.link });
    }
    runSwipe('right');
  };
  const handleDislike = () => runSwipe('left');

  const openProductLink = (link: string) => {
    if (!link) return;
    Linking.canOpenURL(link).then((supported) => {
      if (supported) Linking.openURL(link);
      else Alert.alert('Error', 'Cannot open link');
    });
  };

  const optimizeSearchQuery = (query: string): string => {
    // Normalize common variations for better results
    let optimized = query.trim().toLowerCase();
    
    // Handle "girl" variations - convert to "women" or "girls" for better e-commerce results
    if (optimized.includes('girl ') || optimized.startsWith('girl ')) {
      optimized = optimized.replace(/^girl\s+/, 'girls ').replace(/\sgirl\s/g, ' girls ');
    }
    
    // Handle "women" variations
    if (optimized.includes('woman ') || optimized.startsWith('woman ')) {
      optimized = optimized.replace(/^woman\s+/, 'women ').replace(/\swoman\s/g, ' women ');
    }
    
    // Handle "men" variations
    if (optimized.includes('man ') || optimized.startsWith('man ')) {
      optimized = optimized.replace(/^man\s+/, 'men ').replace(/\sman\s/g, ' men ');
    }
    
    return optimized.trim();
  };

  const searchListings = useCallback(async (query: string) => {
    if (!query.trim()) {
      setListingsProducts([]);
      return;
    }
    setListingsLoading(true);
    setListingsError(null);
    try {
      // Optimize query for better e-commerce search results
      const optimizedQuery = optimizeSearchQuery(query);
      console.log('[ShopSwipe] Searching listings for:', optimizedQuery, '(original:', query.trim(), ')');
      const res = await fetch(`${SCRAPPER_API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: optimizedQuery, budget: budgetKey, page: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListingsProducts([]);
        setListingsError((data.error as string) || 'Could not load products');
        return;
      }
      const list: ScrapperProduct[] = data.products || [];
      console.log('[ShopSwipe] Found', list.length, 'products for search:', optimizedQuery);
      setListingsProducts(list);
    } catch (e: any) {
      setListingsProducts([]);
      setListingsError(e?.message || 'Scrapper not reachable');
    } finally {
      setListingsLoading(false);
    }
  }, [budgetKey]);

  const handleListingsSearch = () => {
    searchListings(listingsSearch);
  };

  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.fuchsia500} />
        <Text style={styles.loadingText}>Loading products from Amazon, Flipkart...</Text>
      </View>
    );
  }

  const product = products[currentIndex];
  const hasProducts = products.length > 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.fuchsia500}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Cop or Drop</Text>
        <View style={styles.infoContainer}>
          <Info size={12} />
          <Text style={styles.infoText}>Real products from Amazon, Flipkart & more</Text>
        </View>
      </View>

      {/* Search / filters */}
      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.queryChips}>
          {DEFAULT_QUERIES.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.chip, searchQuery === q && styles.chipActive]}
              onPress={() => {
                setSearchQuery(q);
                setLoading(true);
                fetchProducts(q, budgetKey, 1, false);
              }}
            >
              <Text style={[styles.chipText, searchQuery === q && styles.chipTextActive]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.budgetRow}>
          {BUDGET_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.budgetChip, budgetKey === opt.key && styles.budgetChipActive]}
              onPress={() => {
                setBudgetKey(opt.key);
                setLoading(true);
                fetchProducts(searchQuery, opt.key, 1, false);
              }}
            >
              <Text style={[styles.budgetChipText, budgetKey === opt.key && styles.budgetChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchProducts(searchQuery, budgetKey, 1, false); }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!hasProducts && !loading && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No products right now</Text>
          <Text style={styles.emptySub}>Try another search or check the Scrapper backend is running on port 5001</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => { setLoading(true); fetchProducts(searchQuery, budgetKey, 1, false); }}>
            <Text style={styles.primaryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasProducts && product && (
        <View style={styles.productWrapper} pointerEvents="box-none">
          <Animated.View
            key={product.id}
            style={[
              styles.productContainer,
              {
                transform: [{ translateX: animValues.translateX }],
                opacity: animValues.opacity,
              },
            ]}
          >
            <Image
              source={{ uri: product.img }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productOverlay}>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>{product.brand.toUpperCase()}</Text>
              </View>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <View style={styles.productInfo}>
                <Text style={styles.price}>{product.price}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleDislike}
                  style={styles.actionButtonSecondary}
                  activeOpacity={0.8}
                >
                  <X size={28} color={colors.zinc400} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shopButton}
                  onPress={() => openProductLink(product.link)}
                  activeOpacity={0.8}
                >
                  <ExternalLink size={18} color={colors.black} />
                  <Text style={styles.shopButtonText}>SHOP NOW</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLike}
                  style={styles.actionButtonPrimary}
                  activeOpacity={0.8}
                >
                  <Heart size={28} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardCounter}>
              {currentIndex + 1} / {products.length}
            </Text>
            {loadingMore && <Text style={styles.loadingMoreText}>Loading more...</Text>}
          </View>
        </View>
      )}

      {/* Product Listings Section */}
      <View style={styles.listingsSection}>
        <Text style={styles.listingsTitle}>Browse Products</Text>
        <Text style={styles.listingsSubtitle}>Search for specific items from Amazon, Flipkart & more</Text>
        
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products..."
            placeholderTextColor={colors.zinc500}
            value={listingsSearch}
            onChangeText={setListingsSearch}
            onSubmitEditing={handleListingsSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleListingsSearch}
            disabled={listingsLoading || !listingsSearch.trim()}
          >
            {listingsLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Search size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>

        {listingsError && (
          <View style={styles.listingsError}>
            <Text style={styles.listingsErrorText}>{listingsError}</Text>
          </View>
        )}

        {listingsProducts.length > 0 ? (
          <FlatList
            data={listingsProducts}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={(item, index) => `${item.source}-${index}-${item.link?.slice(-8) || index}`}
            columnWrapperStyle={styles.listingsRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listingCard}
                onPress={() => openProductLink(item.link)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: upgradeImageUrl(item.image || 'https://picsum.photos/seed/product/300/300') }}
                  style={styles.listingImage}
                  resizeMode="cover"
                />
                <View style={styles.listingContent}>
                  <Text style={styles.listingSource}>{item.source}</Text>
                  <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.listingPrice}>{item.price}</Text>
                  <TouchableOpacity
                    style={styles.listingShopButton}
                    onPress={() => openProductLink(item.link)}
                  >
                    <ExternalLink size={14} color={colors.white} />
                    <Text style={styles.listingShopText}>Shop</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : listingsSearch.trim() && !listingsLoading && !listingsError ? (
          <View style={styles.listingsEmpty}>
            <Text style={styles.listingsEmptyText}>No products found. Try a different search.</Text>
          </View>
        ) : null}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
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
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
    color: colors.white,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  infoText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filtersRow: {
    marginBottom: spacing.lg,
  },
  queryChips: {
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.zinc800,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.fuchsia600,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.zinc400,
  },
  chipTextActive: {
    color: colors.white,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  budgetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.zinc800,
  },
  budgetChipActive: {
    backgroundColor: colors.zinc600,
  },
  budgetChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.zinc500,
  },
  budgetChipTextActive: {
    color: colors.white,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    color: colors.zinc300,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.zinc700,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
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
  },
  primaryButton: {
    backgroundColor: colors.fuchsia600,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
  },
  productWrapper: {
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  productContainer: {
    flex: 1,
    borderRadius: borderRadius['3xl'],
    backgroundColor: colors.zinc900,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 500,
    resizeMode: 'cover',
  },
  productOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  aiBadge: {
    backgroundColor: colors.fuchsia600,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    width: 'auto',
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  aiBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.white,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  brand: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
  },
  reason: {
    fontSize: 12,
    color: colors.zinc500,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopButton: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  shopButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.black,
  },
  actionButtonPrimary: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.fuchsia600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cardCounter: {
    fontSize: 11,
    color: colors.zinc500,
  },
  loadingMoreText: {
    fontSize: 10,
    color: colors.fuchsia400,
    fontWeight: '700',
  },
  listingsSection: {
    marginTop: spacing['2xl'],
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.zinc800,
  },
  listingsTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  listingsSubtitle: {
    fontSize: 12,
    color: colors.zinc500,
    marginBottom: spacing.lg,
  },
  searchBarContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.zinc900,
    borderWidth: 1,
    borderColor: colors.zinc800,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: colors.fuchsia600,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  listingsError: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  listingsErrorText: {
    color: colors.zinc300,
    fontSize: 12,
  },
  listingsRow: {
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  listingCard: {
    flex: 1,
    backgroundColor: colors.zinc900,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.zinc800,
    overflow: 'hidden',
    maxWidth: '48%',
  },
  listingImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
    backgroundColor: colors.zinc800,
  },
  listingContent: {
    padding: spacing.md,
  },
  listingSource: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.fuchsia400,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  listingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
    minHeight: 36,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
    marginBottom: spacing.md,
  },
  listingShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.fuchsia600,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  listingShopText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.white,
    textTransform: 'uppercase',
  },
  listingsEmpty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  listingsEmptyText: {
    fontSize: 14,
    color: colors.zinc500,
    textAlign: 'center',
  },
});

export default ShopSwipe;
