import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, Modal, RefreshControl } from 'react-native';
import { Search, SlidersHorizontal, X, Trash2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';

const Wardrobe = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchUserItems = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/closet/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform data to match existing format
        const transformedItems = data.map((item: any) => ({
          id: item._id,
          name: item.description || 'Unnamed Item',
          cat: item.category?.toLowerCase() || 'top',
          img: `${API_BASE_URL}${item.imageUrl}`,
          style: item.style || '—',
          category: item.category,
          description: item.description,
          tags: item.tags || []
        }));
        setItems(transformedItems);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserItems();
  }, [fetchUserItems]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserItems();
  }, [fetchUserItems]);

  const categories = ['all', 'top', 'bottom', 'shoes', 'accessories'];
  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(i => i.cat === activeCategory);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading your wardrobe...</Text>
      </View>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.center, styles.emptyContainer]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fuchsia500} />
        }
      >
        <Text style={styles.emptyText}>Your wardrobe is empty</Text>
        <Text style={styles.emptySubtext}>Add items using the + button, then pull down to refresh</Text>
      </ScrollView>
    );
  }

  const renderCard = (item: any) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => setSelectedItem(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.img }} style={styles.itemImage} />
      <View style={styles.itemOverlay}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemStyle}>{item.style}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your wardrobe?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            await deleteItem(itemId);
            setSelectedItem(null);
          }
        }
      ]
    );
  };

  const deleteItem = async (itemId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/closet/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fuchsia500} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Vault</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Search size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <SlidersHorizontal size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[
              styles.categoryButton,
              activeCategory === cat && styles.categoryButtonActive
            ]}
          >
            <Text style={[
              styles.categoryText,
              activeCategory === cat && styles.categoryTextActive
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid - fixed 2-column layout, no overlap */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.gridCell}>
              {renderCard(item)}
            </View>
          ))}
        </View>
      </View>
      
      <View style={{ height: 80 }} />

      {/* Cloth detail modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <TouchableOpacity 
              style={styles.detailClose} 
              onPress={() => setSelectedItem(null)}
            >
              <X size={24} color={colors.white} />
            </TouchableOpacity>
            {selectedItem && (
              <>
                <Image source={{ uri: selectedItem.img }} style={styles.detailImage} />
                <View style={styles.detailBody}>
                  <Text style={styles.detailName}>{selectedItem.name}</Text>
                  <View style={styles.detailMeta}>
                    <View style={styles.detailMetaRow}>
                      <Text style={styles.detailLabel}>Category</Text>
                      <Text style={styles.detailValue}>{selectedItem.category || selectedItem.cat}</Text>
                    </View>
                    <View style={styles.detailMetaRow}>
                      <Text style={styles.detailLabel}>Style</Text>
                      <Text style={styles.detailValue}>{selectedItem.style}</Text>
                    </View>
                  </View>
                  {selectedItem.tags?.length > 0 && (
                    <View style={styles.detailTags}>
                      {selectedItem.tags.slice(0, 5).map((tag: string, i: number) => (
                        <View key={i} style={styles.detailTag}>
                          <Text style={styles.detailTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(selectedItem.id)}
                  >
                    <Trash2 size={20} color={colors.white} />
                    <Text style={styles.removeButtonText}>Remove item</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    minHeight: 300,
  },
  loadingText: {
    color: colors.zinc400,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.zinc500,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
    color: colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    backgroundColor: colors.zinc900,
    padding: 10,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.zinc800,
  },
  categoryScroll: {
    marginBottom: spacing.xl,
  },
  categoryContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  categoryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    backgroundColor: colors.zinc900,
    borderColor: colors.zinc800,
  },
  categoryButtonActive: {
    backgroundColor: colors.fuchsia600,
    borderColor: colors.fuchsia500,
    shadowColor: colors.fuchsia500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.zinc500,
  },
  categoryTextActive: {
    color: colors.white,
  },
  gridContainer: {
    paddingBottom: 80,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCell: {
    width: '48%',
    marginBottom: spacing.lg,
  },
  itemContainer: {
    width: '100%',
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
    aspectRatio: 4 / 5,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  itemOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.xl,
  },
  itemName: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: colors.white,
  },
  itemStyle: {
    fontSize: 7,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.zinc400,
    marginTop: spacing.xs,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  detailCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.zinc900,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.zinc800,
  },
  detailClose: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.full,
  },
  detailImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: colors.zinc800,
    resizeMode: 'cover',
  },
  detailBody: {
    padding: spacing.xl,
  },
  detailName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  detailMeta: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  detailTag: {
    backgroundColor: colors.zinc800,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.zinc700,
  },
  detailTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.zinc300,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#ef4444',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default Wardrobe;
