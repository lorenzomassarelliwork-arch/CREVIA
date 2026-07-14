import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chatService } from '../../chat/services/chatService';
import { getProjectDetail } from '../../projects/services/projectDetailService';
import type { ProjectDetail } from '../../projects/services/projectDetailService';
import {
  getPublicUserProfile,
  reportPublicUser,
  setBuilderConnection,
} from '../services/userService';
import type { PublicUserProfile } from '../services/userService';
import type { RootStackParamList } from '../../../navigation/types';
import type { ColorPalette } from '../../../theme/colors';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { LocalizedText as Text } from '../../../i18n/LocalizedText';

type PublicUserProfileScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'PublicUserProfile'
>;

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function PublicUserProfileScreen({
  navigation,
  route,
}: PublicUserProfileScreenProps) {
  const { colors, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const response = await getPublicUserProfile(route.params.userId);
      if (!response.data) {
        setProfile(null);
        setProjects([]);
        setError(response.error ?? 'Profilo non disponibile');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const projectResults = await Promise.all(
        response.data.progetti.map((projectId) => getProjectDetail(projectId))
      );

      setProfile(response.data);
      setProjects(
        projectResults
          .map((item) => item.data)
          .filter((item): item is ProjectDetail => Boolean(item))
      );
      setLoading(false);
      setRefreshing(false);
    },
    [route.params.userId]
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const toggleBuilder = async () => {
    if (!profile) return;

    void triggerHaptic();
    setActionLoading('builder');
    const response = await setBuilderConnection(profile.id, !profile.isBuilder);
    if (response.data) setProfile(response.data);
    setActionLoading(null);
  };

  const startConversation = async () => {
    if (!profile) return;

    void triggerHaptic();
    setActionLoading('message');
    try {
      const conversation = await chatService.createDirectConversation(profile.id);
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

  const reportUser = async () => {
    if (!profile) return;

    void triggerHaptic();
    const response = await reportPublicUser(profile.id);
    if (response.data) {
      Alert.alert('Segnalazione inviata', 'Grazie, controlleremo il profilo.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="person-circle-outline" size={46} color={colors.gray} />
        <Text style={styles.errorTitle}>{error ?? 'Profilo non trovato'}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textStrong} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profilo</Text>
        <TouchableOpacity style={styles.headerButton} onPress={reportUser}>
          <Ionicons name="flag-outline" size={21} color={colors.gray} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadProfile(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>
                  {getInitials(profile.displayName)}
                </Text>
              </View>
            )}
            {profile.isOnline && <View style={styles.onlineDot} />}
          </View>

          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.role}>{profile.ruolo} - {profile.settore}</Text>
          <Text style={styles.location}>{profile.mansione} - {profile.citta}, {profile.stato}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile.collegamenti}</Text>
              <Text style={styles.statLabel}>Collegamenti</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile.seguaci}</Text>
              <Text style={styles.statLabel}>Seguaci</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              disabled={actionLoading !== null}
              style={[
                styles.primaryButton,
                profile.isBuilder && styles.primaryButtonSoft,
              ]}
              onPress={toggleBuilder}
            >
              {actionLoading === 'builder' ? (
                <ActivityIndicator color={profile.isBuilder ? colors.primary : colors.white} size="small" />
              ) : (
                <>
                  <Ionicons
                    name={profile.isBuilder ? 'checkmark' : 'person-add-outline'}
                    size={18}
                    color={profile.isBuilder ? colors.primary : colors.white}
                  />
                  <Text
                    style={[
                      styles.primaryButtonText,
                      profile.isBuilder && styles.primaryButtonTextSoft,
                    ]}
                  >
                    {profile.isBuilder ? 'Builder' : 'Aggiungi'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              disabled={actionLoading !== null}
              style={styles.secondaryButton}
              onPress={startConversation}
            >
              {actionLoading === 'message' ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                  <Text style={styles.secondaryButtonText}>Messaggia</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progetti</Text>
          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.listCard}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
            >
              <View style={styles.listIcon}>
                <FontAwesome5 name="building" size={16} color={colors.primary} />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{project.nome}</Text>
                <Text style={styles.listSubtitle}>{project.settore} - {project.citta}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Esperienze</Text>
          {profile.esperienze.map((experience) => (
            <View key={experience.id} style={styles.listCard}>
              <View style={styles.listIcon}>
                <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{experience.titolo}</Text>
                <Text style={styles.listSubtitle}>
                  {experience.progetto} - {experience.periodo}
                </Text>
              </View>
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
    profileCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      gap: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    avatarWrap: { position: 'relative' },
    avatar: { width: 82, height: 82, borderRadius: 24 },
    avatarFallback: {
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitials: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 24,
    },
    onlineDot: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.cardBackground,
      backgroundColor: colors.confirm,
    },
    name: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.secondary,
      textAlign: 'center',
    },
    role: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },
    location: { fontSize: 13, color: colors.gray, textAlign: 'center' },
    bio: {
      fontSize: 14,
      color: colors.secondary,
      lineHeight: 21,
      textAlign: 'center',
      marginTop: 4,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      marginTop: 8,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    statBox: { flex: 1, alignItems: 'center', gap: 2 },
    statNumber: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
    statLabel: { fontSize: 12, color: colors.gray },
    statDivider: { width: 1, height: 32, backgroundColor: colors.border },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    primaryButton: {
      flex: 1,
      height: 44,
      borderRadius: 8,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
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
    listCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    listIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: { flex: 1, gap: 2 },
    listTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    listSubtitle: { fontSize: 13, color: colors.gray },
  });
