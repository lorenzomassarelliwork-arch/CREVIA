import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
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
import type { RootStackParamList } from '../../../navigation/types';
import type { ColorPalette } from '../../../theme/colors';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { LocalizedText as Text } from '../../../i18n/LocalizedText';

type ProjectDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProjectDetail'
>;

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

  const loadProject = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const response = await getProjectDetail(route.params.projectId);
      setProject(response.data);
      setError(response.error);
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
          <View style={styles.projectIcon}>
            <FontAwesome5 name="building" size={28} color={colors.primary} />
          </View>
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
              <TouchableOpacity
                style={styles.managementButton}
                onPress={() => showManagementNotice('Crea opportunita')}
              >
                <Ionicons name="megaphone-outline" size={20} color={colors.primary} />
                <Text style={styles.managementText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
