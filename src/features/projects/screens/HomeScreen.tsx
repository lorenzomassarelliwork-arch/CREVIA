import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, type CompositeScreenProps } from '@react-navigation/native';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  MainTabParamList,
  RootStackParamList,
} from '../../../navigation/types';
import type { ColorPalette } from '../../../theme/colors';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { LocalizedText as Text } from '../../../i18n/LocalizedText';
import {
  getHomeDiscovery,
  type HomeDiscoveryData,
} from '../services/homeService';
import type { ProjectDetail } from '../services/projectDetailService';
import type { PublicUserProfile } from '../../users/services/userService';
import type { SearchPresetKey } from '../../search/services/searchService';
import { getNotificationInboxSummary } from '../../notifications/services/notificationService';
import {
  addFollowedFeedPostComment,
  deleteFollowedFeedPostComment,
  reportFollowedFeedPost,
  toggleFollowedFeedPostLike,
  type FollowedFeedPost,
} from '../services/followedFeedService';
import { CURRENT_USER_ID } from '../../chat/services/chatService';
import FollowedFeedPostCard from '../components/FollowedFeedPostCard';

type HomeScreenProps = CompositeScreenProps<
  MaterialTopTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

type ProjectCardVariant = 'large' | 'compact';

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const [homeData, setHomeData] = useState<HomeDiscoveryData | null>(null);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedActionLoading, setFeedActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);

    const response = await getHomeDiscovery();
    setHomeData(response.data);

    refresh ? setRefreshing(false) : setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadNotificationSummary = async () => {
        const response = await getNotificationInboxSummary();
        if (isActive) {
          setNotificationUnreadCount(response.data?.unreadCount ?? 0);
        }
      };

      void loadData();
      void loadNotificationSummary();

      return () => {
        isActive = false;
      };
    }, [loadData])
  );

  const openProject = (projectId: string) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const openUser = (userId: string) => {
    navigation.navigate('PublicUserProfile', { userId });
  };

  const openFeedEntity = (
    entityType: 'user' | 'project',
    entityId: string
  ) => {
    if (entityType === 'project') {
      openProject(entityId);
    } else if (entityId === CURRENT_USER_ID) {
      navigation.navigate('Profile');
    } else {
      openUser(entityId);
    }
  };

  const updateFeedPost = (updatedPost: FollowedFeedPost) => {
    setHomeData((current) =>
      current
        ? {
            ...current,
            followedFeed: current.followedFeed.map((post) =>
              post.id === updatedPost.id ? updatedPost : post
            ),
          }
        : current
    );
  };

  const toggleFeedPostLike = async (post: FollowedFeedPost) => {
    setFeedActionLoading(`${post.id}-like`);
    const response = await toggleFollowedFeedPostLike(post, CURRENT_USER_ID);
    if (response.data) updateFeedPost(response.data);
    if (response.error) Alert.alert('Azione non riuscita', response.error);
    setFeedActionLoading(null);
  };

  const addFeedPostComment = async (post: FollowedFeedPost, body: string) => {
    if (!homeData) return false;
    setFeedActionLoading(`${post.id}-comment`);
    const response = await addFollowedFeedPostComment(
      post,
      {
        id: CURRENT_USER_ID,
        name: homeData.currentUserName,
        avatarUri: homeData.currentUserAvatarUri,
      },
      body
    );
    if (response.data) updateFeedPost(response.data);
    if (response.error) Alert.alert('Commento non pubblicato', response.error);
    setFeedActionLoading(null);
    return Boolean(response.data);
  };

  const removeFeedPostComment = (
    post: FollowedFeedPost,
    commentId: string
  ) => {
    Alert.alert(
      'Eliminare il commento?',
      'Il commento verrà rimosso dal post.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setFeedActionLoading(`${post.id}-comment-delete-${commentId}`);
            const response = await deleteFollowedFeedPostComment(
              post,
              commentId,
              CURRENT_USER_ID
            );
            if (response.data) updateFeedPost(response.data);
            if (response.error) {
              Alert.alert('Commento non eliminato', response.error);
            }
            setFeedActionLoading(null);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const reportFeedPost = async (post: FollowedFeedPost) => {
    setFeedActionLoading(`${post.id}-report`);
    const response = await reportFollowedFeedPost(post, CURRENT_USER_ID);
    if (response.data) {
      updateFeedPost(response.data);
      Alert.alert(
        'Segnalazione inviata',
        'Grazie. Il team di Crevia verificherà il contenuto.'
      );
    } else if (response.error) {
      Alert.alert('Segnalazione non inviata', response.error);
    }
    setFeedActionLoading(null);
    return Boolean(response.data);
  };

  const openSearch = (preset?: SearchPresetKey) => {
    navigation.navigate(
      'Search',
      preset ? { preset, presetAppliedAt: Date.now() } : undefined
    );
  };

  const openNotifications = () => {
    navigation.navigate('Notifications');
  };

  const renderProjectCard = (
    project: ProjectDetail,
    variant: ProjectCardVariant = 'compact'
  ) => (
    <TouchableOpacity
      key={project.id}
      activeOpacity={0.76}
      style={[
        styles.projectCard,
        variant === 'large' && styles.projectCardLarge,
      ]}
      onPress={() => openProject(project.id)}
    >
      <View style={styles.projectHeader}>
        <View style={styles.projectIcon}>
          <FontAwesome5 name="building" size={17} color={colors.primary} />
        </View>
        <View style={styles.projectTitleWrap}>
          <Text numberOfLines={1} style={styles.projectTitle}>
            {project.nome}
          </Text>
          <Text numberOfLines={1} style={styles.projectMeta}>
            {project.settore} - {project.citta}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.gray} />
      </View>

      <Text
        numberOfLines={variant === 'large' ? 3 : 2}
        style={styles.projectDescription}
      >
        {project.descrizione}
      </Text>

      <View style={styles.roleRow}>
        {project.openRoles.slice(0, 2).map((role) => (
          <View key={role} style={styles.roleChip}>
            <Text numberOfLines={1} style={styles.roleChipText}>
              {role}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.projectFooter}>
        <View style={styles.projectStat}>
          <Ionicons name="people-outline" size={15} color={colors.gray} />
          <Text style={styles.projectStatText}>{project.builderCount} builders</Text>
        </View>
        <Text style={styles.discoverText}>
          {project.membershipStatus === 'none' ? 'Scopri' : 'Apri'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderBuilderCard = (user: PublicUserProfile) => (
    <TouchableOpacity
      key={user.id}
      activeOpacity={0.76}
      style={styles.builderCard}
      onPress={() => openUser(user.id)}
    >
      <View style={styles.builderAvatar}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.builderAvatarImage} />
        ) : (
          <Text style={styles.builderInitials}>{getInitials(user.displayName)}</Text>
        )}
        {user.isOnline && <View style={styles.onlineDot} />}
      </View>
      <Text numberOfLines={1} style={styles.builderName}>
        {user.displayName}
      </Text>
      <Text numberOfLines={1} style={styles.builderRole}>
        {user.ruolo}
      </Text>
      <Text numberOfLines={1} style={styles.builderMeta}>
        {user.citta} - {user.settore}
      </Text>
    </TouchableOpacity>
  );

  const renderFollowedPost = (post: FollowedFeedPost) => (
    <FollowedFeedPostCard
      key={post.id}
      post={post}
      currentUserId={CURRENT_USER_ID}
      actionLoading={feedActionLoading}
      onToggleLike={toggleFeedPostLike}
      onAddComment={addFeedPostComment}
      onDeleteComment={removeFeedPostComment}
      onReport={reportFeedPost}
      onOpenEntity={openFeedEntity}
    />
  );

  if (loading || !homeData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>CREVIA</Text>
          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.notificationButton}
            onPress={openNotifications}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.textStrong}
            />
            {notificationUnreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>CREVIA</Text>
        <TouchableOpacity
          activeOpacity={0.78}
          style={styles.notificationButton}
          onPress={openNotifications}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={colors.textStrong}
          />
          {notificationUnreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadData(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBlock}>
          <View style={styles.introCopy}>
            <Text style={styles.greeting}>Ciao {homeData.currentUserName}</Text>
            <Text style={styles.introTitle}>Trova un progetto da costruire</Text>
            <Text style={styles.introSubtitle}>
              Team in formazione, builder compatibili e idee vicine a te.
            </Text>
          </View>
          <TouchableOpacity style={styles.searchShortcut} onPress={() => openSearch()}>
            <Ionicons name="compass-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>In partenza</Text>
            <TouchableOpacity onPress={() => openSearch('formingTeams')}>
            <Text style={styles.sectionAction}>Vedi tutto</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {homeData.featuredProjects.map((project) =>
              renderProjectCard(project, 'large')
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progetti salvati</Text>
          </View>
          {homeData.savedProjects.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {homeData.savedProjects.map((project) =>
                renderProjectCard(project, 'large')
              )}
            </ScrollView>
          ) : (
            <View style={styles.emptySavedCard}>
              <Ionicons name="bookmark-outline" size={24} color={colors.gray} />
              <Text style={styles.emptySavedText}>
                I progetti che salvi appariranno qui.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Builder compatibili</Text>
            <TouchableOpacity onPress={() => openSearch('compatibleBuilders')}>
              <Text style={styles.sectionAction}>Cerca</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {homeData.compatibleBuilders.map(renderBuilderCard)}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dai tuoi seguiti</Text>
          <View style={styles.verticalList}>
            {homeData.followedFeed.length > 0 ? (
              homeData.followedFeed.map(renderFollowedPost)
            ) : (
              <View style={styles.emptySavedCard}>
                <Ionicons name="newspaper-outline" size={24} color={colors.gray} />
                <Text style={styles.emptySavedText}>
                  I post dei tuoi seguiti appariranno qui.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (
  colors: ColorPalette,
  topInset: number,
  bottomInset: number
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Math.max(topInset, 24) + 14,
      paddingBottom: 15,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logoText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      letterSpacing: 1,
    },
    notificationButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.actionSurface,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.cardBackground,
    },
    notificationBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '800',
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: {
      padding: 20,
      gap: 22,
      paddingBottom: 88 + Math.max(bottomInset, 10),
    },
    introBlock: {
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    introCopy: { flex: 1, gap: 4 },
    greeting: { fontSize: 13, color: colors.gray, fontWeight: '600' },
    introTitle: {
      fontSize: 21,
      fontWeight: 'bold',
      color: colors.secondary,
      lineHeight: 27,
    },
    introSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    searchShortcut: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: { gap: 12 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    sectionAction: {
      fontSize: 13,
      fontWeight: 'bold',
      color: colors.primary,
    },
    horizontalList: { gap: 12, paddingRight: 20 },
    projectCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    projectCardLarge: {
      width: 280,
      minHeight: 212,
    },
    projectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    projectIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    projectTitleWrap: { flex: 1, gap: 2 },
    projectTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    projectMeta: { fontSize: 12, color: colors.primary, fontWeight: '600' },
    projectDescription: {
      fontSize: 14,
      color: colors.secondary,
      lineHeight: 21,
    },
    roleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    roleChip: {
      maxWidth: 126,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: colors.actionSurface,
    },
    roleChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    projectFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 'auto',
    },
    projectStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    projectStatText: { fontSize: 12, color: colors.gray, fontWeight: '600' },
    discoverText: { fontSize: 13, color: colors.primary, fontWeight: 'bold' },
    builderCard: {
      width: 142,
      minHeight: 154,
      borderRadius: 16,
      padding: 14,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      gap: 7,
    },
    builderAvatar: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    builderInitials: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    builderAvatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
    },
    onlineDot: {
      position: 'absolute',
      right: 4,
      bottom: 4,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.confirm,
      borderWidth: 1,
      borderColor: colors.cardBackground,
    },
    builderName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.secondary,
      textAlign: 'center',
    },
    builderRole: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    builderMeta: { fontSize: 12, color: colors.gray, textAlign: 'center' },
    verticalList: { gap: 12 },
    emptySavedCard: {
      minHeight: 92,
      padding: 18,
      borderRadius: 14,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    emptySavedText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
