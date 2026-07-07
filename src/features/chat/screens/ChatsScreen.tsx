import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';

import type {
  MainTabParamList,
  RootStackParamList,
} from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import NewConversationModal from '../components/NewConversationModal';
import { CHAT_COPY } from '../chatCopy';
import {
  getConversationAvatarUrl,
  getConversationPresence,
  getConversationTitle,
  getOtherParticipants,
} from '../chatSelectors';
import { useConversations } from '../hooks/useConversations';
import { CURRENT_USER_ID } from '../services/chatService';
import type { ChatConversation } from '../types';
import createStyles from './ChatsScreen.styles';

type ChatsScreenProps = MaterialTopTabScreenProps<MainTabParamList, 'Chat'>;

function getInitials(displayName: string) {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function formatTimestamp(value: string, language: 'it' | 'en', yesterday: string) {
  const date = new Date(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (dayDifference === 0) {
    return new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
  if (dayDifference === 1) return yesterday;

  return new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-US', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export default function ChatsScreen({ navigation }: ChatsScreenProps) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = CHAT_COPY[language];
  const [isNewConversationVisible, setIsNewConversationVisible] = useState(false);
  const {
    conversations,
    deleteConversation,
    error,
    hasConversations,
    isLoading,
    isRefreshing,
    query,
    refresh,
    retry,
    setQuery,
  } = useConversations();

  const openConversation = (conversationId: string) => {
    void triggerHaptic();
    navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('Conversation', { conversationId });
  };

  const requestConversationDeletion = (conversation: ChatConversation) => {
    const title = getConversationTitle(conversation, CURRENT_USER_ID);
    Alert.alert(copy.deleteChatTitle, `${title}\n\n${copy.deleteChatMessage}`, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.delete,
        style: 'destructive',
        onPress: () => {
          void triggerHaptic();
          void deleteConversation(conversation.id);
        },
      },
    ]);
  };

  const renderConversation = ({ item }: { item: ChatConversation }) => {
    const title = getConversationTitle(item, CURRENT_USER_ID);
    const avatarUrl = getConversationAvatarUrl(item, CURRENT_USER_ID);
    const presence = getConversationPresence(item, CURRENT_USER_ID);
    const canDeleteConversation =
      item.kind === 'direct' || item.currentUserHasLeft;
    const otherParticipants = getOtherParticipants(item, CURRENT_USER_ID);
    const fallbackPreview =
      item.kind === 'group'
        ? `${item.participants.length} ${language === 'it' ? 'partecipanti' : 'members'}`
        : otherParticipants[0]?.role ?? '';
    const lastMessagePreview =
      item.currentUserHasLeft
        ? copy.leftGroupNotice
        : item.lastMessage?.text ||
          (item.lastMessage?.attachments[0]?.kind === 'image'
            ? copy.photo
            : item.lastMessage?.attachments[0]?.kind === 'audio'
              ? copy.voiceMessage
              : fallbackPreview);

    return (
      <TouchableOpacity
        accessibilityLabel={`${title}. ${item.lastMessage?.text ?? ''}`}
        accessibilityRole="button"
        activeOpacity={0.72}
        style={styles.conversationCard}
        onPress={() => openConversation(item.id)}
        onLongPress={() => {
          if (canDeleteConversation) requestConversationDeletion(item);
        }}
      >
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              {item.kind === 'group' ? (
                <Ionicons name="people" size={23} color={colors.primary} />
              ) : (
                <Text style={styles.avatarInitials}>{getInitials(title)}</Text>
              )}
            </View>
          )}
          {presence.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.conversationBody}>
          <View style={styles.rowTop}>
            <Text numberOfLines={1} style={styles.participantName}>
              {title}
            </Text>
            <Text style={styles.time}>
              {formatTimestamp(item.updatedAt, language, copy.yesterday)}
            </Text>
            {canDeleteConversation && (
              <TouchableOpacity
                accessibilityLabel={copy.deleteChat}
                accessibilityRole="button"
                hitSlop={8}
                style={styles.moreButton}
                onPress={(event) => {
                  event.stopPropagation();
                  requestConversationDeletion(item);
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={17} color={colors.gray} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.rowBottom}>
            <Text
              numberOfLines={1}
              style={[
                styles.messagePreview,
                item.unreadCount > 0 && styles.messageUnread,
              ]}
            >
              {lastMessagePreview}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const emptyState = (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubbles-outline" size={34} color={colors.primary} />
      </View>
      <Text style={styles.stateTitle}>
        {hasConversations ? copy.noResultsTitle : copy.emptyTitle}
      </Text>
      <Text style={styles.stateDescription}>
        {hasConversations ? copy.noResultsDescription : copy.emptyDescription}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{copy.subtitle}</Text>
            <Text style={styles.title}>{copy.title}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={copy.createNew}
            accessibilityRole="button"
            activeOpacity={0.72}
            style={styles.addButton}
            onPress={() => {
              void triggerHaptic();
              setIsNewConversationVisible(true);
            }}
          >
            <Ionicons name="add" size={27} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={19} color={colors.gray} />
        <TextInput
          accessibilityLabel={copy.searchPlaceholder}
          placeholder={copy.searchPlaceholder}
          placeholderTextColor={colors.gray}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity
            accessibilityLabel={language === 'it' ? 'Cancella ricerca' : 'Clear search'}
            accessibilityRole="button"
            onPress={() => setQuery('')}
          >
            <Ionicons name="close-circle" size={19} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error && !hasConversations ? (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={42} color={colors.gray} />
          <Text style={styles.stateTitle}>{copy.loadError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.75}
            style={styles.retryButton}
            onPress={() => void retry()}
          >
            <Text style={styles.retryText}>{copy.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            conversations.length === 0 && { flexGrow: 1 },
          ]}
          data={conversations}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={emptyState}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              refreshing={isRefreshing}
              tintColor={colors.primary}
              onRefresh={() => void refresh()}
            />
          }
          renderItem={renderConversation}
          showsVerticalScrollIndicator={false}
        />
      )}

      <NewConversationModal
        visible={isNewConversationVisible}
        onClose={() => setIsNewConversationVisible(false)}
        onCreated={(conversationId) => {
          setIsNewConversationVisible(false);
          openConversation(conversationId);
        }}
      />
    </View>
  );
}
