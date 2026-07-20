import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chatService, CURRENT_USER_ID } from '../../chat/services/chatService';
import {
  getProjectDetail,
  leaveProject,
  requestProjectJoin,
  setProjectFollowing,
} from '../services/projectDetailService';
import type { ProjectDetail } from '../services/projectDetailService';
import {
  createProjectPost,
  listProjectPosts,
  type ProjectPost,
  type ProjectPostKind,
} from '../services/projectPostService';
import type { RootStackParamList } from '../../../navigation/types';
import type { ColorPalette } from '../../../theme/colors';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { LocalizedText as Text } from '../../../i18n/LocalizedText';

type ProjectDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProjectDetail'
>;

const postKindOptions: { value: ProjectPostKind; label: string }[] = [
  { value: 'update', label: 'Update' },
  { value: 'milestone', label: 'Traguardo' },
  { value: 'hiring', label: 'Ruolo aperto' },
];

const postKindLabels: Record<ProjectPostKind, string> = {
  update: 'Update',
  milestone: 'Traguardo',
  hiring: 'Ruolo aperto',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

const formatPostDate = (date: string) =>
  new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

export default function ProjectDetailScreen({
  navigation,
  route,
}: ProjectDetailScreenProps) {
  const { colors, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ProjectPost[]>([]);
  const [postBody, setPostBody] = useState('');
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [postKind, setPostKind] = useState<ProjectPostKind>('update');
  const [postLoading, setPostLoading] = useState(false);

  const loadProject = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const [projectResponse, postsResponse] = await Promise.all([
        getProjectDetail(route.params.projectId),
        listProjectPosts(route.params.projectId),
      ]);

      setProject(projectResponse.data);
      setPosts(postsResponse.data);
      setError(projectResponse.error ?? postsResponse.error);
      setLoading(false);
      setRefreshing(false);
    },
    [route.params.projectId]
  );

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const isManager =
    project?.membershipStatus === 'founder' || project?.membershipStatus === 'admin';

  const joinProject = async () => {
    if (!project) return;

    void triggerHaptic();
    setActionLoading('join');
    const response = await requestProjectJoin(project.id);
    if (response.data) setProject(response.data);
    setActionLoading(null);
  };

  const confirmLeaveProject = () => {
    if (!project || project.membershipStatus !== 'member') return;

    void triggerHaptic();
    Alert.alert(
      'Uscire dal progetto?',
      'Non sarai piu indicato come membro di questo progetto. Potrai richiedere di unirti di nuovo in seguito.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('leave');
            const response = await leaveProject(project.id, CURRENT_USER_ID);
            if (response.data) setProject(response.data);
            setActionLoading(null);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleMembershipPress = () => {
    if (!project) return;

    if (project.membershipStatus === 'none') {
      void joinProject();
    }
  };

  const toggleFollowing = async () => {
    if (!project) return;

    void triggerHaptic();
    setActionLoading('follow');
    const response = await setProjectFollowing(project.id, !project.isFollowing);
    if (response.data) setProject(response.data);
    setActionLoading(null);
  };

  const messageFounder = async () => {
    if (!project || project.founderId === CURRENT_USER_ID) return;

    void triggerHaptic();
    setActionLoading('message');
    try {
      const conversation = await chatService.createDirectConversation(project.founderId);
      navigation.navigate('Conversation', { conversationId: conversation.id });
    } catch (conversationError) {
      Alert.alert(
        'Chat non disponibile',
        conversationError instanceof Error
          ? conversationError.message
          : 'Non e stato possibile aprire la chat.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const showManagementNotice = (label: string) => {
    void triggerHaptic();
    Alert.alert(
      label,
      'Flusso predisposto: quando ci sara il backend qui gestirai dati, membri e opportunita reali.'
    );
  };

  const pickPostImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permesso richiesto',
        'Consenti a Crevia di accedere alle foto per allegare immagini ai post.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled) {
      setPostImageUri(result.assets[0]?.uri ?? null);
    }
  };

  const publishPost = async () => {
    if (!project || !isManager) return;

    void triggerHaptic();
    setPostLoading(true);

    const response = await createProjectPost({
      projectId: project.id,
      authorId: CURRENT_USER_ID,
      authorName: project.founderName,
      kind: postKind,
      body: postBody,
      imageUri: postImageUri,
    });

    setPostLoading(false);

    if (response.error || !response.data) {
      Alert.alert('Post non pubblicato', response.error ?? 'Riprova tra poco.');
      return;
    }

    setPosts((current) => [response.data as ProjectPost, ...current]);
    setPostBody('');
    setPostImageUri(null);
    setPostKind('update');
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centerState}>
        <FontAwesome5 name="building" size={40} color={colors.gray} />
        <Text style={styles.errorTitle}>{error ?? 'Progetto non trovato'}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const joinLabel =
    project.membershipStatus === 'pending'
      ? 'Richiesta inviata'
      : project.membershipStatus === 'member'
        ? 'Sei membro'
        : project.membershipStatus === 'founder'
          ? 'Sei founder'
          : 'Unisciti';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textStrong} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progetto</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={toggleFollowing}
          disabled={actionLoading !== null}
        >
          <Ionicons
            name={project.isFollowing ? 'bookmark' : 'bookmark-outline'}
            size={21}
            color={project.isFollowing ? colors.primary : colors.gray}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadProject(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          {project.coverImage ? (
            <Image source={{ uri: project.coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.projectIcon}>
              <FontAwesome5 name="building" size={28} color={colors.primary} />
            </View>
          )}
          <Text style={styles.name}>{project.nome}</Text>
          <Text style={styles.meta}>{project.settore} - {project.citta}, {project.stato}</Text>
          <Text style={styles.description}>{project.descrizione}</Text>

          <TouchableOpacity
            style={styles.founderRow}
            disabled={project.founderId === CURRENT_USER_ID}
            onPress={() =>
              navigation.navigate('PublicUserProfile', { userId: project.founderId })
            }
          >
            <View style={styles.founderIcon}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.founderCopy}>
              <Text style={styles.founderLabel}>Founder</Text>
              <Text style={styles.founderName}>{project.founderName}</Text>
            </View>
            {project.founderId !== CURRENT_USER_ID && (
              <Ionicons name="chevron-forward" size={18} color={colors.gray} />
            )}
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{project.builderCount}</Text>
              <Text style={styles.statLabel}>Builders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{project.followerCount}</Text>
              <Text style={styles.statLabel}>Seguaci</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              disabled={
                actionLoading !== null ||
                project.membershipStatus === 'pending' ||
                project.membershipStatus === 'founder' ||
                project.membershipStatus === 'admin'
              }
              style={[
                styles.primaryButton,
                project.membershipStatus !== 'none' && styles.primaryButtonSoft,
              ]}
              onPress={handleMembershipPress}
              onLongPress={confirmLeaveProject}
            >
              {actionLoading === 'join' || actionLoading === 'leave' ? (
                <ActivityIndicator
                  color={project.membershipStatus === 'none' ? colors.white : colors.primary}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    project.membershipStatus !== 'none' && styles.primaryButtonTextSoft,
                  ]}
                >
                  {joinLabel}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              disabled={actionLoading !== null || project.founderId === CURRENT_USER_ID}
              style={styles.secondaryButton}
              onPress={messageFounder}
            >
              {actionLoading === 'message' ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                  <Text style={styles.secondaryButtonText}>Founder</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isManager && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestione founder</Text>
            <View style={styles.managementGrid}>
              <TouchableOpacity
                style={styles.managementButton}
                onPress={() => showManagementNotice('Modifica progetto')}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
                <Text style={styles.managementText}>Modifica</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.managementButton}
                onPress={() => showManagementNotice('Gestisci membri')}
              >
                <Ionicons name="people-outline" size={21} color={colors.primary} />
                <Text style={styles.managementText}>Membri</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Post progetto</Text>
            <Text style={styles.sectionCounter}>{posts.length}</Text>
          </View>

          {isManager && (
            <View style={styles.composerCard}>
              <View style={styles.postKindRow}>
                {postKindOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.8}
                    style={[
                      styles.postKindChip,
                      postKind === option.value && styles.postKindChipActive,
                    ]}
                    onPress={() => setPostKind(option.value)}
                  >
                    <Text
                      style={[
                        styles.postKindText,
                        postKind === option.value && styles.postKindTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.composerInput}
                placeholder="Pubblica un aggiornamento per chi segue il progetto..."
                placeholderTextColor={colors.gray}
                multiline
                value={postBody}
                onChangeText={setPostBody}
              />

              {postImageUri && (
                <View style={styles.composerImageWrap}>
                  <Image source={{ uri: postImageUri }} style={styles.composerImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setPostImageUri(null)}
                  >
                    <Ionicons name="close" size={18} color={colors.white} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.composerActions}>
                <TouchableOpacity style={styles.iconActionButton} onPress={pickPostImage}>
                  <Ionicons name="image-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.publishButton,
                    postLoading && styles.publishButtonDisabled,
                  ]}
                  onPress={publishPost}
                  disabled={postLoading}
                >
                  {postLoading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.publishButtonText}>Pubblica</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {posts.length === 0 ? (
            <View style={styles.emptyPostsCard}>
              <Ionicons name="newspaper-outline" size={24} color={colors.gray} />
              <Text style={styles.emptyPostsText}>Ancora nessun post pubblicato.</Text>
            </View>
          ) : (
            posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar}>
                    <Text style={styles.postAvatarText}>{getInitials(post.authorName)}</Text>
                  </View>
                  <View style={styles.postHeaderCopy}>
                    <Text style={styles.postAuthor}>{post.authorName}</Text>
                    <Text style={styles.postDate}>{formatPostDate(post.createdAt)}</Text>
                  </View>
                  <View style={styles.postBadge}>
                    <Text style={styles.postBadgeText}>{postKindLabels[post.kind]}</Text>
                  </View>
                </View>
                {post.body ? <Text style={styles.postBody}>{post.body}</Text> : null}
                {post.imageUri ? (
                  <Image source={{ uri: post.imageUri }} style={styles.postImage} />
                ) : null}
                <View style={styles.postFooter}>
                  <View style={styles.postMetric}>
                    <Ionicons name="heart-outline" size={16} color={colors.gray} />
                    <Text style={styles.postMetricText}>{post.likeCount}</Text>
                  </View>
                  <View style={styles.postMetric}>
                    <Ionicons name="chatbubble-outline" size={15} color={colors.gray} />
                    <Text style={styles.postMetricText}>{post.commentCount}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ruoli aperti</Text>
          <View style={styles.tagsWrap}>
            {project.openRoles.map((role) => (
              <View key={role} style={styles.tag}>
                <Text style={styles.tagText}>{role}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aggiornamenti</Text>
          {project.updates.map((update) => (
            <View key={update} style={styles.updateCard}>
              <Ionicons name="ellipse" size={8} color={colors.primary} />
              <Text style={styles.updateText}>{update}</Text>
            </View>
          ))}
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
      paddingHorizontal: 16,
      paddingTop: Math.max(topInset, 24) + 14,
      paddingBottom: 15,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 38,
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    scroll: {
      padding: 20,
      gap: 16,
      paddingBottom: 88 + Math.max(bottomInset, 10),
    },
    centerState: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 14,
      padding: 24,
    },
    errorTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      color: colors.secondary,
      textAlign: 'center',
    },
    heroCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      gap: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    projectIcon: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverImage: {
      width: '100%',
      height: 176,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    name: { fontSize: 24, fontWeight: 'bold', color: colors.secondary },
    meta: { fontSize: 14, fontWeight: '600', color: colors.primary },
    description: { fontSize: 14, color: colors.secondary, lineHeight: 22 },
    founderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.actionSurface,
    },
    founderIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.border,
    },
    founderCopy: { flex: 1 },
    founderLabel: { fontSize: 12, color: colors.gray },
    founderName: { fontSize: 15, fontWeight: 'bold', color: colors.secondary },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    statBox: { flex: 1, alignItems: 'center', gap: 2 },
    statNumber: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
    statLabel: { fontSize: 12, color: colors.gray },
    statDivider: { width: 1, height: 32, backgroundColor: colors.border },
    actionRow: { flexDirection: 'row', gap: 10 },
    primaryButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonSoft: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: 'bold',
    },
    primaryButtonTextSoft: { color: colors.primary },
    secondaryButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    section: { gap: 10 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionCounter: {
      minWidth: 28,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      textAlign: 'center',
      color: colors.primary,
      fontWeight: '800',
      fontSize: 12,
    },
    managementGrid: { flexDirection: 'row', gap: 10 },
    managementButton: {
      flex: 1,
      minHeight: 74,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    managementText: {
      fontSize: 13,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    composerCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    postKindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    postKindChip: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      backgroundColor: colors.actionSurface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    postKindChipActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    postKindText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    postKindTextActive: { color: colors.primary },
    composerInput: {
      minHeight: 88,
      borderRadius: 8,
      backgroundColor: colors.inputSurface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      color: colors.textStrong,
      fontSize: 14,
      lineHeight: 20,
      textAlignVertical: 'top',
    },
    composerImageWrap: {
      position: 'relative',
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.border,
    },
    composerImage: { width: '100%', height: 156 },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    composerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    iconActionButton: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: colors.actionSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    publishButton: {
      minWidth: 118,
      height: 42,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    publishButtonDisabled: { opacity: 0.72 },
    publishButtonText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '800',
    },
    emptyPostsCard: {
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      alignItems: 'center',
      gap: 8,
    },
    emptyPostsText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    postCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    postAvatar: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    postAvatarText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '800',
    },
    postHeaderCopy: { flex: 1 },
    postAuthor: { color: colors.secondary, fontSize: 14, fontWeight: '800' },
    postDate: { color: colors.gray, fontSize: 11, marginTop: 1 },
    postBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: colors.actionSurface,
    },
    postBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
    postBody: { color: colors.secondary, fontSize: 14, lineHeight: 21 },
    postImage: {
      width: '100%',
      height: 172,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    postFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    postMetric: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    postMetricText: { color: colors.gray, fontSize: 12, fontWeight: '700' },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
    },
    tagText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    updateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    updateText: { flex: 1, color: colors.secondary, fontSize: 14, lineHeight: 20 },
  });
