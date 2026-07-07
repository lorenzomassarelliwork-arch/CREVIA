import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import SharedMediaSection from '../components/SharedMediaSection';
import { CHAT_COPY } from '../chatCopy';
import { getOtherParticipants } from '../chatSelectors';
import { chatService, CURRENT_USER_ID } from '../services/chatService';
import type { ChatConversation, ChatMediaItem } from '../types';
import createStyles from './ContactInfoScreen.styles';

type ContactInfoScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ContactInfo'
>;

function getInitials(displayName: string) {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function ContactInfoScreen({
  navigation,
  route,
}: ContactInfoScreenProps) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = CHAT_COPY[language];
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [media, setMedia] = useState<ChatMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContactInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [details, mediaPage] = await Promise.all([
        chatService.getConversation(route.params.conversationId),
        chatService.listConversationMedia(route.params.conversationId),
      ]);
      if (details.conversation.kind !== 'direct') throw new Error('Not a direct chat');
      setConversation(details.conversation);
      setMedia(mediaPage.items);
    } catch {
      setError(copy.groupInfoError);
    } finally {
      setIsLoading(false);
    }
  }, [copy.groupInfoError, route.params.conversationId]);

  useFocusEffect(
    useCallback(() => {
      void loadContactInfo();
    }, [loadContactInfo])
  );

  const contact = conversation
    ? getOtherParticipants(conversation, CURRENT_USER_ID)[0] ?? null
    : null;
  const isBlocked = Boolean(
    contact && conversation?.blockedUserIds.includes(contact.id)
  );
  const isReported = Boolean(
    contact && conversation?.reportedUserIds.includes(contact.id)
  );

  const toggleBlock = () => {
    if (!conversation || !contact) return;
    const nextBlocked = !isBlocked;

    Alert.alert(
      nextBlocked ? copy.blockUserTitle : copy.unblockUser,
      nextBlocked ? copy.blockUserMessage : contact.displayName,
      [
        { text: copy.cancel, style: 'cancel' },
        {
          text: nextBlocked ? copy.blockUser : copy.unblockUser,
          style: nextBlocked ? 'destructive' : 'default',
          onPress: () => {
            setIsUpdating(true);
            setError(null);
            void chatService
              .setUserBlocked(conversation.id, contact.id, nextBlocked)
              .then((updated) => {
                setConversation(updated);
                void triggerHaptic();
              })
              .catch(() => setError(copy.groupInfoError))
              .finally(() => setIsUpdating(false));
          },
        },
      ]
    );
  };

  const reportContact = () => {
    if (!conversation || !contact || isReported) return;

    Alert.alert(copy.reportUserTitle, copy.reportUserMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.reportUser,
        style: 'destructive',
        onPress: () => {
          setIsUpdating(true);
          setError(null);
          void chatService
            .reportUser(conversation.id, contact.id)
            .then((updated) => {
              setConversation(updated);
              void triggerHaptic();
            })
            .catch(() => setError(copy.groupInfoError))
            .finally(() => setIsUpdating(false));
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (!conversation || !contact) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.textStrong} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{copy.contactInfo}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error ?? copy.groupInfoError}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textStrong} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{copy.contactInfo}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {contact.avatarUrl ? (
            <Image source={{ uri: contact.avatarUrl }} style={styles.contactAvatar} />
          ) : (
            <View style={[styles.contactAvatar, styles.contactAvatarFallback]}>
              <Text style={styles.contactInitials}>{getInitials(contact.displayName)}</Text>
            </View>
          )}
          <Text style={styles.contactName}>{contact.displayName}</Text>
          <Text style={styles.contactRole}>{contact.role}</Text>
          <View style={styles.presenceRow}>
            <View
              style={[
                styles.presenceDot,
                !contact.isOnline && styles.presenceDotOffline,
              ]}
            />
            <Text style={styles.presenceText}>
              {contact.isOnline ? copy.online : copy.offline}
            </Text>
          </View>
        </View>

        {isBlocked && (
          <View style={styles.blockedNotice}>
            <Ionicons name="ban-outline" size={20} color={colors.error} />
            <Text style={styles.blockedNoticeText}>{copy.blockedUserNotice}</Text>
          </View>
        )}

        {error && <Text style={styles.inlineError}>{error}</Text>}

        <View style={styles.actionsCard}>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={isUpdating}
            style={styles.actionRow}
            onPress={toggleBlock}
          >
            <View style={[styles.actionIcon, isBlocked && styles.actionIconPrimary]}>
              <Ionicons
                name={isBlocked ? 'lock-open-outline' : 'ban-outline'}
                size={20}
                color={isBlocked ? colors.primary : colors.error}
              />
            </View>
            <Text style={[styles.actionText, !isBlocked && styles.actionTextDanger]}>
              {isBlocked ? copy.unblockUser : copy.blockUser}
            </Text>
            <Ionicons name="chevron-forward" size={19} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={isUpdating || isReported}
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={reportContact}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name={isReported ? 'checkmark-circle-outline' : 'flag-outline'}
                size={20}
                color={isReported ? colors.gray : colors.error}
              />
            </View>
            <Text
              style={[
                styles.actionText,
                !isReported && styles.actionTextDanger,
                isReported && styles.actionTextDisabled,
              ]}
            >
              {isReported ? copy.reportedUser : copy.reportUser}
            </Text>
            {!isReported && (
              <Ionicons name="chevron-forward" size={19} color={colors.gray} />
            )}
          </TouchableOpacity>
        </View>

        <SharedMediaSection media={media} />
      </ScrollView>
    </View>
  );
}
