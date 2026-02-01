import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Flame, Trophy, Swords, Plus, MessageCircle, Send, Zap } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../styles';
import { API_BASE_URL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Battle = {
  id: string;
  leftUserId: string;
  leftImageUrl: string;
  leftUserName: string;
  leftOutfitDetails?: string;
  rightUserId: string | null;
  rightImageUrl: string | null;
  rightUserName: string | null;
  rightOutfitDetails?: string;
  status: 'waiting' | 'active' | 'ended';
  leftVotes: number;
  rightVotes: number;
  winner: 'left' | 'right' | null;
  createdAt: string;
  myVote?: 'left' | 'right' | null;
};

type BattleComment = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
};

type ClosetItem = { id: string; imageUrl: string; category?: string; style?: string };

const BattleArena = ({ user }: { user?: any }) => {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [detailBattle, setDetailBattle] = useState<Battle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'main' | 'battles' | 'detail'>('main');
  const [comments, setComments] = useState<BattleComment[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [outfitDetailsSaving, setOutfitDetailsSaving] = useState<'left' | 'right' | null>(null);
  const [leftOutfitDraft, setLeftOutfitDraft] = useState('');
  const [rightOutfitDraft, setRightOutfitDraft] = useState('');
  const [detailSource, setDetailSource] = useState<'main' | 'battles'>('main');

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (detailBattle) {
      setLeftOutfitDraft(detailBattle.leftOutfitDetails ?? '');
      setRightOutfitDraft(detailBattle.rightOutfitDetails ?? '');
    }
  }, [detailBattle?.id, detailBattle?.leftOutfitDetails, detailBattle?.rightOutfitDetails]);

  const fetchBattles = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/battles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBattles(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch battles error', e);
    }
  }, []);

  const fetchCloset = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/closet/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClosetItems(
          (Array.isArray(data) ? data : []).map((i: any) => ({
            id: i._id,
            imageUrl: i.imageUrl,
            category: i.category,
            style: i.style,
          }))
        );
      }
    } catch (e) {
      console.error('Fetch closet error', e);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBattles(), fetchCloset()]);
    setLoading(false);
  }, [fetchBattles, fetchCloset]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBattles();
    if (selectedBattle && detailBattle) {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/battles/${selectedBattle.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setDetailBattle(await res.json());
        fetchComments(selectedBattle.id);
      }
    }
    setRefreshing(false);
  }, [fetchBattles, selectedBattle, detailBattle, fetchComments]);

  useEffect(() => {
    load();
  }, [load]);

  const fetchComments = useCallback(async (battleId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/battles/${battleId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch comments error', e);
    }
  }, []);

  const openBattle = async (battle: Battle) => {
    setDetailSource(viewMode === 'battles' ? 'battles' : 'main');
    setSelectedBattle(battle);
    setViewMode('detail');
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/battles/${battle.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : battle;
      setDetailBattle(data);
      fetchComments(battle.id);
    } catch {
      setDetailBattle(battle);
      setComments([]);
    }
  };

  const goBackFromDetail = () => {
    setViewMode(detailSource);
    setSelectedBattle(null);
    setDetailBattle(null);
    setComments([]);
    setChatInput('');
  };

  const saveOutfitDetails = async (side: 'left' | 'right', details: string) => {
    if (!detailBattle?.id) return;
    setOutfitDetailsSaving(side);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/battles/${detailBattle.id}/outfit-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ side, details }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && detailBattle) {
        setDetailBattle({
          ...detailBattle,
          leftOutfitDetails: data.leftOutfitDetails ?? detailBattle.leftOutfitDetails ?? '',
          rightOutfitDetails: data.rightOutfitDetails ?? detailBattle.rightOutfitDetails ?? '',
        });
      } else {
        Alert.alert('Error', (data.message as string) || 'Failed to save');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save');
    } finally {
      setOutfitDetailsSaving(null);
    }
  };

  const postComment = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || !detailBattle?.id) return;
    const battleId = String(detailBattle.id);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please sign in to chat');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/battles/${battleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      const commentId = data?.id ?? data?._id;
      if (res.ok && commentId) {
        setComments((prev) => [...prev, {
          id: String(commentId),
          userId: String(data.userId ?? ''),
          userName: data.userName ?? 'Anonymous',
          text: data.text ?? trimmed,
          createdAt: data.createdAt ?? new Date().toISOString(),
        }]);
        setChatInput('');
      } else {
        const errMsg = (typeof data === 'object' && data !== null && 'message' in data) ? (data as { message?: string }).message : (typeof data === 'string' ? data : null);
        Alert.alert('Error', errMsg || 'Could not send message. Check your connection and try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not send. Check your connection and try again.');
    }
  };

  const uploadOutfitAndMatch = async (item: ClosetItem) => {
    setActionLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const body = item.imageUrl
        ? { imageUrl: item.imageUrl }
        : { closetItemId: item.id };
      const res = await fetch(`${API_BASE_URL}/api/battles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      const battleId = data?.id ?? data?._id;
      if (res.ok && battleId) {
        setShowCreateModal(false);
        await fetchBattles();
        openBattle({ ...data, id: battleId });
      } else {
        const msg = (data?.message as string) || (res.status === 503 ? 'Database not available. Try again.' : 'Failed to upload outfit');
        Alert.alert('Error', msg);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload outfit');
    } finally {
      setActionLoading(false);
    }
  };

  const endBattle = async (battleId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/battles/${battleId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id && detailBattle?.id === battleId) {
        setDetailBattle({
          ...detailBattle,
          status: 'ended',
          winner: data.winner,
          leftVotes: data.leftVotes ?? detailBattle.leftVotes,
          rightVotes: data.rightVotes ?? detailBattle.rightVotes,
        });
        await fetchBattles();
      }
    } catch (_) {}
  };

  const vote = async (battleId: string, side: 'left' | 'right') => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/battles/${battleId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ side }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (detailBattle && detailBattle.id === battleId) {
          setDetailBattle({
            ...detailBattle,
            myVote: side,
            leftVotes: data.leftVotes ?? detailBattle.leftVotes,
            rightVotes: data.rightVotes ?? detailBattle.rightVotes,
          });
        }
        await fetchBattles();
      } else {
        Alert.alert('Error', (data.message as string) || 'Failed to vote');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to vote');
    }
  };

  const fullImageUrl = (path: string | null) =>
    path ? (path.startsWith('http') ? path : `${API_BASE_URL}${path}`) : null;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.fuchsia500} />
        <Text style={styles.loadingText}>Loading battles...</Text>
      </View>
    );
  }

  // Full-page battle detail (not modal): outfit details + chat for voters
  if (viewMode === 'detail' && detailBattle) {
    const isLeftParticipant = userId && String(detailBattle.leftUserId) === String(userId);
    const isRightParticipant = userId && detailBattle.rightUserId && String(detailBattle.rightUserId) === String(userId);

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.detailPageHeader}>
          <TouchableOpacity onPress={goBackFromDetail} style={styles.backButtonTouchable} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailPageTitle} numberOfLines={1}>
            {detailBattle.status === 'waiting' ? 'Matching opponent...' : detailBattle.status === 'ended' ? 'Battle ended' : 'Vote for the hardest fit'}
          </Text>
          <View style={styles.backButtonSpacer} />
        </View>

        <ScrollView
          style={styles.detailScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fuchsia500} />}
          keyboardShouldPersistTaps="handled"
        >
          {/* Battle: two sides with images + vote */}
          <View style={styles.detailBattleRow}>
            <TouchableOpacity
              style={[styles.detailSide, detailBattle.myVote === 'left' && styles.detailSideVoted]}
              onPress={() => detailBattle.status === 'active' && !detailBattle.myVote && vote(detailBattle.id, 'left')}
              disabled={detailBattle.status !== 'active' || !!detailBattle.myVote}
            >
              <Image
                source={{ uri: fullImageUrl(detailBattle.leftImageUrl ?? null) || 'https://picsum.photos/seed/b1/400/600' }}
                style={styles.detailImage}
              />
              <View style={styles.detailOverlay}>
                <View style={[styles.voteButton, detailBattle.myVote === 'left' && styles.voteButtonActive]}>
                  <Flame size={24} color={colors.white} />
                </View>
                <Text style={styles.detailName}>@{detailBattle.leftUserName}</Text>
                {detailBattle.status === 'active' && <Text style={styles.voteCount}>{detailBattle.leftVotes} votes</Text>}
              </View>
            </TouchableOpacity>
            <View style={styles.detailVs}>
              <Zap size={22} color={colors.fuchsia500} strokeWidth={2.5} />
            </View>
            {detailBattle.rightImageUrl ? (
              <TouchableOpacity
                style={[styles.detailSide, detailBattle.myVote === 'right' && styles.detailSideVoted]}
                onPress={() => detailBattle.status === 'active' && !detailBattle.myVote && vote(detailBattle.id, 'right')}
                disabled={detailBattle.status !== 'active' || !!detailBattle.myVote}
              >
                <Image
                  source={{ uri: fullImageUrl(detailBattle.rightImageUrl) || 'https://picsum.photos/seed/b2/400/600' }}
                  style={styles.detailImage}
                />
                <View style={styles.detailOverlay}>
                  <View style={[styles.voteButton, detailBattle.myVote === 'right' && styles.voteButtonActive]}>
                    <Flame size={24} color={colors.white} />
                  </View>
                  <Text style={styles.detailName}>@{detailBattle.rightUserName}</Text>
                  {detailBattle.status === 'active' && <Text style={styles.voteCount}>{detailBattle.rightVotes} votes</Text>}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.detailSidePlaceholder}>
                <Text style={styles.placeholderText}>?</Text>
                <Text style={styles.waitingText}>Matching opponent...</Text>
                <Text style={styles.autoMatchSubtext}>We'll pair you automatically</Text>
              </View>
            )}
          </View>

          {/* Outfit details: both participants can share */}
          <View style={styles.outfitDetailsSection}>
            <Text style={styles.outfitDetailsHeading}>Outfit details</Text>
            <View style={styles.outfitDetailsRow}>
              <View style={styles.outfitDetailsCard}>
                <Text style={styles.outfitDetailsLabel}>@{detailBattle.leftUserName}</Text>
                {isLeftParticipant ? (
                  <>
                    <TextInput
                      style={styles.outfitDetailsInput}
                      placeholder="Share your outfit details..."
                      placeholderTextColor={colors.zinc500}
                      multiline
                      value={leftOutfitDraft}
                      onChangeText={setLeftOutfitDraft}
                    />
                    <TouchableOpacity
                      style={styles.outfitDetailsSaveBtn}
                      onPress={() => saveOutfitDetails('left', leftOutfitDraft)}
                      disabled={outfitDetailsSaving === 'left'}
                    >
                      {outfitDetailsSaving === 'left' ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.outfitDetailsSaveText}>Save</Text>}
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.outfitDetailsText}>{detailBattle.leftOutfitDetails || 'No details shared yet.'}</Text>
                )}
              </View>
              <View style={styles.outfitDetailsCard}>
                <Text style={styles.outfitDetailsLabel}>{detailBattle.rightUserName ? `@${detailBattle.rightUserName}` : '—'}</Text>
                {detailBattle.rightUserName ? (
                  isRightParticipant ? (
                    <>
                      <TextInput
                        style={styles.outfitDetailsInput}
                        placeholder="Share your outfit details..."
                        placeholderTextColor={colors.zinc500}
                        multiline
                        value={rightOutfitDraft}
                        onChangeText={setRightOutfitDraft}
                      />
                      <TouchableOpacity
                        style={styles.outfitDetailsSaveBtn}
                        onPress={() => saveOutfitDetails('right', rightOutfitDraft)}
                        disabled={outfitDetailsSaving === 'right'}
                      >
                        {outfitDetailsSaving === 'right' ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.outfitDetailsSaveText}>Save</Text>}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.outfitDetailsText}>{detailBattle.rightOutfitDetails || 'No details shared yet.'}</Text>
                  )
                ) : (
                  <Text style={styles.outfitDetailsText}>Opponent will be matched automatically.</Text>
                )}
              </View>
            </View>
          </View>

          {detailBattle.status === 'active' && isLeftParticipant && (
            <TouchableOpacity style={styles.endBattleButton} onPress={() => endBattle(detailBattle.id)}>
              <Text style={styles.endBattleText}>End battle & see winner</Text>
            </TouchableOpacity>
          )}
          {detailBattle.status === 'ended' && detailBattle.winner && (
            <View style={styles.winnerBanner}>
              <Trophy size={24} color={colors.amber500} />
              <Text style={styles.winnerBannerText}>
                Winner: @{detailBattle.winner === 'left' ? detailBattle.leftUserName : detailBattle.rightUserName}
              </Text>
            </View>
          )}

          {/* Chat: voters / everyone can chat below */}
          <View style={styles.chatSection}>
            <View style={styles.chatSectionHeader}>
              <MessageCircle size={18} color={colors.fuchsia500} />
              <Text style={styles.chatSectionTitle}>Chat</Text>
            </View>
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.chatBubble}>
                  <Text style={styles.chatUserName}>@{item.userName}</Text>
                  <Text style={styles.chatText}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.chatEmpty}>No messages yet. Say something!</Text>}
            />
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Add a comment..."
                placeholderTextColor={colors.zinc500}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                maxLength={300}
                onSubmitEditing={postComment}
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={postComment} disabled={!chatInput.trim()}>
                <Send size={20} color={chatInput.trim() ? colors.white : colors.zinc500} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const renderBattleList = () => (
    <View style={styles.list}>
      {battles.map((battle) => (
        <TouchableOpacity
          key={battle.id}
          style={styles.battleCard}
          onPress={() => openBattle(battle)}
          activeOpacity={0.9}
        >
          <View style={styles.battleCardInner}>
            <View style={styles.battleThumb}>
              <Image
                source={{ uri: fullImageUrl(battle.leftImageUrl) || 'https://picsum.photos/seed/b1/200/300' }}
                style={styles.battleThumbImage}
              />
              <Text style={styles.battleThumbLabel} numberOfLines={1}>@{battle.leftUserName}</Text>
            </View>
            <View style={styles.vsBadge}>
              <Zap size={18} color={colors.fuchsia500} strokeWidth={2.5} />
            </View>
            <View style={styles.battleThumb}>
              {battle.rightImageUrl ? (
                <>
                  <Image
                    source={{ uri: fullImageUrl(battle.rightImageUrl) || 'https://picsum.photos/seed/b2/200/300' }}
                    style={styles.battleThumbImage}
                  />
                  <Text style={styles.battleThumbLabel} numberOfLines={1}>@{battle.rightUserName}</Text>
                </>
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>?</Text>
                  <Text style={styles.waitingText}>Waiting</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.battleMeta}>
            <View style={[styles.statusBadge, battle.status === 'active' && styles.statusActive, battle.status === 'ended' && styles.statusEnded]}>
              <Text style={styles.statusText}>{battle.status.toUpperCase()}</Text>
            </View>
            {battle.status === 'active' && (
              <Text style={styles.voteCounts}>{battle.leftVotes} – {battle.rightVotes} votes</Text>
            )}
            {battle.status === 'ended' && battle.winner && (
              <Text style={styles.winnerText}>Winner: {(battle.winner === 'left' ? battle.leftUserName : battle.rightUserName)}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (viewMode === 'battles') {
    return (
      <View style={styles.container}>
        <View style={styles.viewBattlesHeader}>
          <TouchableOpacity style={styles.backButtonTouchable} onPress={() => setViewMode('main')} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.viewBattlesTitle}>All battles</Text>
          <View style={styles.backButtonSpacer} />
        </View>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fuchsia500} />}
        >
          {battles.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No battles yet</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setViewMode('main')}>
                <Text style={styles.primaryButtonText}>Back to arena</Text>
              </TouchableOpacity>
            </View>
          ) : (
            renderBattleList()
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fuchsia500} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>BATTLE ARENA</Text>
          <Text style={styles.subtitle}>Vote for the hardest fit</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Plus size={20} color={colors.white} />
          <Text style={styles.createButtonText}>Upload outfit</Text>
        </TouchableOpacity>
      </View>

      {battles.length === 0 ? (
        <View style={styles.empty}>
          <Swords size={48} color={colors.zinc600} />
          <Text style={styles.emptyTitle}>No battles yet</Text>
          <Text style={styles.emptySub}>Upload an outfit and we'll match you with an opponent automatically</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.primaryButtonText}>Upload outfit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.viewBattlesButton} onPress={() => setViewMode('battles')}>
            <Swords size={20} color={colors.white} />
            <Text style={styles.viewBattlesButtonText}>View battles</Text>
          </TouchableOpacity>
          <View style={styles.list}>
            {battles.slice(0, 2).map((battle) => (
              <TouchableOpacity
                key={battle.id}
                style={styles.battleCard}
                onPress={() => openBattle(battle)}
                activeOpacity={0.9}
              >
                <View style={styles.battleCardInner}>
                  <View style={styles.battleThumb}>
                    <Image
                      source={{ uri: fullImageUrl(battle.leftImageUrl) || 'https://picsum.photos/seed/b1/200/300' }}
                      style={styles.battleThumbImage}
                    />
                    <Text style={styles.battleThumbLabel} numberOfLines={1}>@{battle.leftUserName}</Text>
                  </View>
                  <View style={styles.vsBadge}>
                    <Zap size={18} color={colors.fuchsia500} strokeWidth={2.5} />
                  </View>
                  <View style={styles.battleThumb}>
                    {battle.rightImageUrl ? (
                      <>
                        <Image
                          source={{ uri: fullImageUrl(battle.rightImageUrl) || 'https://picsum.photos/seed/b2/200/300' }}
                          style={styles.battleThumbImage}
                        />
                        <Text style={styles.battleThumbLabel} numberOfLines={1}>@{battle.rightUserName}</Text>
                      </>
                    ) : (
                      <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>?</Text>
                        <Text style={styles.waitingText}>Waiting</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.battleMeta}>
                  <View style={[styles.statusBadge, battle.status === 'active' && styles.statusActive, battle.status === 'ended' && styles.statusEnded]}>
                    <Text style={styles.statusText}>{battle.status.toUpperCase()}</Text>
                  </View>
                  {battle.status === 'active' && (
                    <Text style={styles.voteCounts}>{battle.leftVotes} – {battle.rightVotes} votes</Text>
                  )}
                  {battle.status === 'ended' && battle.winner && (
                    <Text style={styles.winnerText}>Winner: {(battle.winner === 'left' ? battle.leftUserName : battle.rightUserName)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {battles.length > 2 && (
            <TouchableOpacity style={styles.viewAllLink} onPress={() => setViewMode('battles')}>
              <Text style={styles.viewAllLinkText}>View all {battles.length} battles →</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={{ height: 80 }} />

      {/* Upload outfit modal: pick closet item — we match opponent automatically */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upload outfit</Text>
            <Text style={styles.modalSub}>Choose an outfit — we'll match you with an opponent automatically</Text>
            {closetItems.length === 0 ? (
              <Text style={styles.noCloset}>No items in closet. Add items first.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.closetScroll}>
                {closetItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.closetItem}
                    onPress={() => uploadOutfitAndMatch(item)}
                    disabled={actionLoading}
                  >
                    <Image source={{ uri: fullImageUrl(item.imageUrl) }} style={styles.closetItemImage} />
                    {actionLoading && (
                      <View style={styles.closetItemOverlay}>
                        <ActivityIndicator color={colors.white} size="small" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.zinc400, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
    color: colors.white,
  },
  subtitle: { fontSize: 12, color: colors.zinc500, fontWeight: '700', marginTop: 2 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.fuchsia600,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  createButtonText: { fontSize: 12, fontWeight: '900', color: colors.white },
  empty: { alignItems: 'center', paddingVertical: 48, gap: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: colors.white },
  emptySub: { fontSize: 14, color: colors.zinc500, textAlign: 'center' },
  primaryButton: { backgroundColor: colors.fuchsia600, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: borderRadius.xl },
  primaryButtonText: { fontSize: 14, fontWeight: '900', color: colors.white },
  list: { gap: spacing.lg },
  battleCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.zinc800,
    overflow: 'hidden',
  },
  battleCardInner: { flexDirection: 'row', alignItems: 'stretch', height: 168 },
  battleThumb: { flex: 1, position: 'relative' },
  battleThumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  battleThumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  vsBadge: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  placeholder: { flex: 1, backgroundColor: colors.zinc800, justifyContent: 'center', alignItems: 'center', height: '100%' },
  placeholderText: { fontSize: 28, fontWeight: '900', color: colors.zinc500 },
  waitingText: { fontSize: 9, color: colors.zinc500, marginTop: 4 },
  battleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.zinc800 },
  statusBadge: { backgroundColor: colors.zinc700, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.lg },
  statusActive: { backgroundColor: colors.fuchsia600 },
  statusEnded: { backgroundColor: colors.zinc600 },
  statusText: { fontSize: 9, fontWeight: '900', color: colors.white },
  voteCounts: { fontSize: 11, color: colors.zinc400 },
  winnerText: { fontSize: 11, fontWeight: '700', color: colors.amber500 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: colors.zinc900, borderRadius: borderRadius['2xl'], padding: spacing.xl, borderWidth: 1, borderColor: colors.zinc800 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: colors.white, marginBottom: 4 },
  modalSub: { fontSize: 12, color: colors.zinc500, marginBottom: spacing.lg },
  closetScroll: { maxHeight: 160, marginBottom: spacing.lg },
  closetItem: { width: 100, height: 140, marginRight: spacing.md, borderRadius: borderRadius.xl, overflow: 'hidden', backgroundColor: colors.zinc800 },
  closetItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  closetItemOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  noCloset: { color: colors.zinc500, marginBottom: spacing.lg },
  cancelButton: { alignSelf: 'center', paddingVertical: spacing.md },
  cancelButtonText: { color: colors.zinc400, fontWeight: '700' },
  detailCard: { width: '100%', maxWidth: 420, maxHeight: '90%', backgroundColor: colors.zinc900, borderRadius: borderRadius['2xl'], padding: spacing.lg, borderWidth: 1, borderColor: colors.zinc800 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  detailTitle: { fontSize: 16, fontWeight: '900', color: colors.white },
  closeText: { color: colors.cyan400, fontWeight: '700' },
  detailBattle: { flexDirection: 'row', alignItems: 'stretch', height: 320, gap: 4 },
  detailSide: { flex: 1, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  detailSideVoted: { borderWidth: 3, borderColor: colors.fuchsia500 },
  detailImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  detailOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', gap: 4 },
  voteButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  voteButtonActive: { backgroundColor: colors.orange500 },
  detailName: { fontSize: 10, fontWeight: '900', color: colors.white },
  voteCount: { fontSize: 9, color: colors.zinc400 },
  detailVs: { width: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  detailSidePlaceholder: { flex: 1, backgroundColor: colors.zinc800, borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  autoMatchSubtext: { fontSize: 11, color: colors.zinc500, marginTop: 4 },
  winnerBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md, backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: borderRadius.xl },
  winnerBannerText: { fontSize: 14, fontWeight: '900', color: colors.amber500 },
  endBattleButton: { marginTop: spacing.lg, backgroundColor: colors.zinc700, paddingVertical: spacing.md, borderRadius: borderRadius.xl, alignItems: 'center' },
  endBattleText: { fontSize: 12, fontWeight: '700', color: colors.white },
  // Back button (visible, tappable)
  backButtonTouchable: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 80,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.zinc700,
  },
  backButtonSpacer: { width: 80 },
  backButtonText: { fontSize: 14, fontWeight: '700', color: colors.cyan400 },
  // Battles list header
  viewBattlesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  viewBattlesTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: colors.white, textAlign: 'center' },
  scroll: { flex: 1 },
  viewBattlesButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.fuchsia600, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.xl, marginBottom: spacing.lg, alignSelf: 'flex-start' },
  viewBattlesButtonText: { fontSize: 14, fontWeight: '900', color: colors.white },
  viewAllLink: { alignSelf: 'center', paddingVertical: spacing.md },
  viewAllLinkText: { fontSize: 13, fontWeight: '700', color: colors.cyan400 },
  // Full-page battle detail
  detailPageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  detailPageTitle: { flex: 1, fontSize: 16, fontWeight: '900', color: colors.white, textAlign: 'center' },
  detailScroll: { flex: 1 },
  detailBattleRow: { flexDirection: 'row', alignItems: 'stretch', height: 360, gap: 6, marginBottom: spacing.xl },
  outfitDetailsSection: { marginBottom: spacing.xl },
  outfitDetailsHeading: { fontSize: 14, fontWeight: '900', color: colors.zinc400, marginBottom: spacing.md, textTransform: 'uppercase' },
  outfitDetailsRow: { flexDirection: 'row', gap: spacing.md },
  outfitDetailsCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.xl, padding: spacing.lg, minHeight: 100, borderWidth: 1, borderColor: colors.zinc800 },
  outfitDetailsLabel: { fontSize: 10, fontWeight: '900', color: colors.fuchsia500, marginBottom: spacing.sm },
  outfitDetailsInput: { minHeight: 72, fontSize: 12, color: colors.white, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  outfitDetailsText: { fontSize: 12, color: colors.zinc400, lineHeight: 18 },
  outfitDetailsSaveBtn: { marginTop: spacing.sm, backgroundColor: colors.fuchsia600, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
  outfitDetailsSaveText: { fontSize: 11, fontWeight: '900', color: colors.white },
  chatSection: { marginTop: spacing.xl, paddingTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.zinc800 },
  chatSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  chatSectionTitle: { fontSize: 14, fontWeight: '900', color: colors.white },
  chatBubble: { marginBottom: spacing.md, padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.lg, borderLeftWidth: 3, borderLeftColor: colors.fuchsia500 },
  chatUserName: { fontSize: 10, fontWeight: '900', color: colors.fuchsia500, marginBottom: 2 },
  chatText: { fontSize: 13, color: colors.white },
  chatEmpty: { fontSize: 12, color: colors.zinc500, fontStyle: 'italic', marginBottom: spacing.md },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  chatInput: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: colors.zinc800, borderRadius: borderRadius.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.white },
  chatSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.fuchsia600, alignItems: 'center', justifyContent: 'center' },
});

export default BattleArena;
