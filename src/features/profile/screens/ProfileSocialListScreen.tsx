import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import {
  blockProfileSocialUser,
  getProfileSocialUsers,
  removeProfileSocialUser,
  setProfileSocialFollowState,
  type ProfileSocialUser,
} from '../services/profileService';

type ProfileSocialListScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfileSocialList'
>;

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function ProfileSocialListScreen({
  navigation,
  route,
}: ProfileSocialListScreenProps) {
  const { colors, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  const { listType } = route.params;
  const title = listType === 'connections' ? 'Collegamenti' : 'Seguaci';
  const [users, setUsers] = useState<ProfileSocialUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    const response = await getProfileSocialUsers(listType);
    setUsers(response.data ?? []);
    setIsLoading(false);
  }, [listType]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const removeUser = async (user: ProfileSocialUser) => {
    setActionUserId(user.id);
    const response = await removeProfileSocialUser(listType, user.id);
    if (!response.error) {
      setUsers((current) => current.filter((item) => item.id !== user.id));
    }
    setActionUserId(null);
  };

  const toggleFollowing = async (user: ProfileSocialUser) => {
    setActionUserId(user.id);
    const response = await setProfileSocialFollowState(
      listType,
      user.id,
      !user.isFollowedByCurrentUser
    );
    if (response.data) {
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? response.data as ProfileSocialUser : item
        )
      );
    }
    setActionUserId(null);
  };

  const blockUser = async (user: ProfileSocialUser) => {
    setActionUserId(user.id);
    const response = await blockProfileSocialUser(user.id);
    if (!response.error) {
      setUsers((current) => current.filter((item) => item.id !== user.id));
    }
    setActionUserId(null);
  };

  const openUserActions = (user: ProfileSocialUser) => {
    if (actionUserId) return;
    void triggerHaptic();

    const removeLabel =
      listType === 'connections' ? 'Rimuovi collegamento' : 'Rimuovi dai seguaci';
    const actions = [
      {
        text: removeLabel,
        style: 'destructive' as const,
        onPress: () => void removeUser(user),
      },
      {
        text: user.isFollowedByCurrentUser ? 'Smetti di seguire' : 'Segui',
        onPress: () => void toggleFollowing(user),
      },
      {
        text: 'Blocca',
        style: 'destructive' as const,
        onPress: () => void blockUser(user),
      },
      { text: 'Annulla', style: 'cancel' as const },
    ];

    Alert.alert(user.displayName, 'Gestisci questa persona', actions);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Indietro"
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={23} color={colors.textStrong} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Tieni premuto o usa il menu per gestire una persona</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={users.length === 0 ? styles.emptyList : styles.list}
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.78}
              delayLongPress={280}
              style={styles.userRow}
              onPress={() => navigation.navigate('PublicUserProfile', { userId: item.id })}
              onLongPress={() => openUserActions(item)}
            >
              <View style={styles.avatarWrap}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarText}>{getInitials(item.displayName)}</Text>
                  </View>
                )}
                {item.isOnline && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.userCopy}>
                <Text numberOfLines={1} style={styles.userName}>{item.displayName}</Text>
                <Text numberOfLines={1} style={styles.userRole}>{item.role}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={`Azioni per ${item.displayName}`}
                accessibilityRole="button"
                disabled={actionUserId === item.id}
                style={styles.menuButton}
                onPress={() => openUserActions(item)}
              >
                {actionUserId === item.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="ellipsis-horizontal" size={21} color={colors.gray} />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={42} color={colors.gray} />
              <Text style={styles.emptyTitle}>Nessuna persona da mostrare</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors'], topInset: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: Math.max(topInset, 24) + 8,
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      backgroundColor: colors.background,
    },
    headerCopy: { flex: 1 },
    title: { color: colors.textStrong, fontSize: 20, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, gap: 10 },
    emptyList: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    emptyState: { alignItems: 'center', gap: 10 },
    emptyTitle: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarWrap: { position: 'relative' },
    avatar: { width: 50, height: 50, borderRadius: 16 },
    avatarFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    avatarText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
    onlineDot: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.confirm,
      borderWidth: 2,
      borderColor: colors.cardBackground,
    },
    userCopy: { flex: 1, minWidth: 0 },
    userName: { color: colors.textStrong, fontSize: 15, fontWeight: '800' },
    userRole: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
    menuButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: colors.actionSurface,
    },
  });
}
