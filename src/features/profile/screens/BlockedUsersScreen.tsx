import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { chatService } from '../../chat/services/chatService';
import type { BlockedUserEntry } from '../../chat/types';
import createStyles from './BlockedUsersScreen.styles';

type BlockedUsersScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'BlockedUsers'
>;

const COPY = {
  it: {
    title: 'Utenti bloccati',
    description:
      'Gli utenti bloccati non possono contattarti. Puoi sbloccarli in qualsiasi momento.',
    emptyTitle: 'Nessun utente bloccato',
    emptyDescription: 'Quando blocchi qualcuno dalla chat, apparirà in questa lista.',
    unblock: 'Sblocca',
    unblockTitle: 'Sbloccare questo utente?',
    unblockMessage: 'Potrà nuovamente contattarti e scambiare messaggi con te.',
    cancel: 'Annulla',
    loadError: 'Non siamo riusciti a caricare gli utenti bloccati.',
    retry: 'Riprova',
    blockedOn: 'Bloccato il',
    back: 'Torna a Profilo e Privacy',
  },
  en: {
    title: 'Blocked users',
    description:
      'Blocked users cannot contact you. You can unblock them at any time.',
    emptyTitle: 'No blocked users',
    emptyDescription: 'When you block someone from a chat, they will appear here.',
    unblock: 'Unblock',
    unblockTitle: 'Unblock this user?',
    unblockMessage: 'They will be able to contact you and exchange messages again.',
    cancel: 'Cancel',
    loadError: 'We could not load blocked users.',
    retry: 'Try again',
    blockedOn: 'Blocked on',
    back: 'Back to Profile and Privacy',
  },
} as const;

function getInitials(displayName: string) {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function BlockedUsersScreen({
  navigation,
}: BlockedUsersScreenProps) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const copy = COPY[language];
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await chatService.listBlockedUsers();
      setBlockedUsers(page.items);
    } catch {
      setError(copy.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [copy.loadError]);

  useFocusEffect(
    useCallback(() => {
      void loadBlockedUsers();
    }, [loadBlockedUsers])
  );

  const requestUnblock = (entry: BlockedUserEntry) => {
    Alert.alert(copy.unblockTitle, `${entry.user.displayName}\n\n${copy.unblockMessage}`, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.unblock,
        onPress: () => {
          setUpdatingUserId(entry.user.id);
          setError(null);
          void chatService
            .setBlockedUser(entry.user.id, false)
            .then(() => {
              setBlockedUsers((current) =>
                current.filter((item) => item.user.id !== entry.user.id)
              );
              void triggerHaptic();
            })
            .catch(() => setError(copy.loadError))
            .finally(() => setUpdatingUserId(null));
        },
      },
    ]);
  };

  const formatBlockedAt = (value: string) =>
    new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel={copy.back}
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {copy.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error && blockedUsers.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={38} color={colors.gray} />
          <Text style={styles.stateTitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void loadBlockedUsers()}>
            <Text style={styles.retryText}>{copy.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            blockedUsers.length === 0 && styles.emptyListContent,
          ]}
          data={blockedUsers}
          keyExtractor={(entry) => entry.user.id}
          ListHeaderComponent={
            blockedUsers.length > 0 ? (
              <View>
                <Text style={styles.description}>{copy.description}</Text>
                {error ? <Text style={styles.inlineError}>{error}</Text> : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="shield-checkmark-outline" size={34} color={colors.primary} />
              </View>
              <Text style={styles.stateTitle}>{copy.emptyTitle}</Text>
              <Text style={styles.stateDescription}>{copy.emptyDescription}</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              {item.user.avatarUrl ? (
                <Image source={{ uri: item.user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {getInitials(item.user.displayName)}
                  </Text>
                </View>
              )}
              <View style={styles.userCopy}>
                <Text numberOfLines={1} style={styles.userName}>
                  {item.user.displayName}
                </Text>
                <Text numberOfLines={1} style={styles.userRole}>
                  {item.user.role}
                </Text>
                <Text style={styles.blockedDate}>
                  {copy.blockedOn} {formatBlockedAt(item.blockedAt)}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={`${copy.unblock} ${item.user.displayName}`}
                accessibilityRole="button"
                disabled={updatingUserId !== null}
                style={styles.unblockButton}
                onPress={() => requestUnblock(item)}
              >
                {updatingUserId === item.user.id ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={styles.unblockText}>{copy.unblock}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
