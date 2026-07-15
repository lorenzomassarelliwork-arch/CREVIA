import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { chatService, CURRENT_USER_ID } from '../services/chatService';
import type { ChatConversation, ChatMessage } from '../types';
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

const SWIPE_ACTIONS_WIDTH = 222;

type ChatsScreenStyles = ReturnType<typeof createStyles>;

type SwipeableConversationRowProps = {
  actionIconColor: string;
  children: ReactNode;
  deleteLabel: string;
  isMuted: boolean;
  isPinned: boolean;
  muteLabel: string;
  pinLabel: string;
  styles: ChatsScreenStyles;
  onDelete: () => void;
  onInteractionEnd: () => void;
  onInteractionStart: () => void;
  onMute: () => void;
  onPin: () => void;
};

function SwipeableConversationRow({
  actionIconColor,
  children,
  deleteLabel,
  isMuted,
  isPinned,
  muteLabel,
  pinLabel,
  styles,
  onDelete,
  onInteractionEnd,
  onInteractionStart,
  onMute,
  onPin,
}: SwipeableConversationRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startOffset = useRef(0);
  const isOpen = useRef(false);

  const animateTo = (value: number) => {
    isOpen.current = value !== 0;
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: true,
      damping: 22,
      mass: 0.8,
      stiffness: 230,
    }).start();
  };

  const runAction = (action: () => void) => {
    animateTo(0);
    action();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          const horizontalMove = Math.abs(gesture.dx) > 6;
          const isMostlyHorizontal =
            Math.abs(gesture.dx) > Math.abs(gesture.dy) * 0.98;
          return (
            horizontalMove &&
            isMostlyHorizontal &&
            (gesture.dx < 0 || isOpen.current)
          );
        },
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          const horizontalMove = Math.abs(gesture.dx) > 6;
          const isMostlyHorizontal =
            Math.abs(gesture.dx) > Math.abs(gesture.dy) * 0.98;
          return (
            horizontalMove &&
            isMostlyHorizontal &&
            (gesture.dx < 0 || isOpen.current)
          );
        },
        onPanResponderGrant: () => {
          translateX.stopAnimation((value) => {
            startOffset.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          const nextValue = Math.max(
            -SWIPE_ACTIONS_WIDTH,
            Math.min(0, startOffset.current + gesture.dx)
          );
          translateX.setValue(nextValue);
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -28 || gesture.vx < -0.35) {
            animateTo(-SWIPE_ACTIONS_WIDTH);
          } else if (gesture.dx > 28 || gesture.vx > 0.35) {
            animateTo(0);
          } else {
            animateTo(isOpen.current ? -SWIPE_ACTIONS_WIDTH : 0);
          }
        },
        onPanResponderTerminate: () =>
          animateTo(isOpen.current ? -SWIPE_ACTIONS_WIDTH : 0),
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [translateX]
  );

  return (
    <View
      style={styles.swipeRow}
      onTouchCancel={onInteractionEnd}
      onTouchEnd={onInteractionEnd}
      onTouchStart={onInteractionStart}
    >
      <View style={styles.swipeActions}>
        <TouchableOpacity
          accessibilityLabel={pinLabel}
          accessibilityRole="button"
          style={[styles.swipeAction, styles.pinAction]}
          onPress={() => runAction(onPin)}
        >
          <Ionicons
            name={isPinned ? 'pin-outline' : 'pin'}
            size={21}
            color={actionIconColor}
          />
          <Text numberOfLines={1} style={styles.swipeActionText}>
            {pinLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={muteLabel}
          accessibilityRole="button"
          style={[styles.swipeAction, styles.muteAction]}
          onPress={() => runAction(onMute)}
        >
          <Ionicons
            name={isMuted ? 'notifications-outline' : 'notifications-off-outline'}
            size={21}
            color={actionIconColor}
          />
          <Text numberOfLines={1} style={styles.swipeActionText}>
            {muteLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={deleteLabel}
          accessibilityRole="button"
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => runAction(onDelete)}
        >
          <Ionicons name="trash-outline" size={21} color={actionIconColor} />
          <Text numberOfLines={1} style={styles.swipeActionText}>
            {deleteLabel}
          </Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[styles.swipeForeground, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function getMessageContent(
  message: ChatMessage,
  labels: { photo: string; document: string; voiceMessage: string }
) {
  if (message.text) return message.text;
  const attachment = message.attachments[0];
  if (attachment?.kind === 'image') return labels.photo;
  if (attachment?.kind === 'audio') return labels.voiceMessage;
  if (attachment?.kind === 'document') return attachment.fileName || labels.document;
  return '';
}

export default function ChatsScreen({ navigation }: ChatsScreenProps) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const copy = CHAT_COPY[language];
  const [isNewConversationVisible, setIsNewConversationVisible] = useState(false);
  const [previewConversation, setPreviewConversation] =
    useState<ChatConversation | null>(null);
  const [previewMessages, setPreviewMessages] = useState<ChatMessage[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewRequestId = useRef(0);
  const longPressedConversationId = useRef<string | null>(null);
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
    setConversationMuted,
    setConversationPinned,
    setQuery,
  } = useConversations();

  const openConversation = (conversationId: string) => {
    void triggerHaptic();
    navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('Conversation', { conversationId });
  };

  const handleConversationPress = (conversationId: string) => {
    if (longPressedConversationId.current === conversationId) {
      longPressedConversationId.current = null;
      return;
    }
    openConversation(conversationId);
  };

  const showConversationPreview = async (conversation: ChatConversation) => {
    longPressedConversationId.current = conversation.id;
    setTimeout(() => {
      if (longPressedConversationId.current === conversation.id) {
        longPressedConversationId.current = null;
      }
    }, 900);
    void triggerHaptic();
    const requestId = ++previewRequestId.current;
    setPreviewConversation(conversation);
    setPreviewMessages([]);
    setIsPreviewLoading(true);

    try {
      const details = await chatService.getConversationPreview(conversation.id);
      if (previewRequestId.current !== requestId) return;
      setPreviewConversation(details.conversation);
      setPreviewMessages(details.messages);
    } catch {
      if (previewRequestId.current === requestId) setPreviewMessages([]);
    } finally {
      if (previewRequestId.current === requestId) setIsPreviewLoading(false);
    }
  };

  const closeConversationPreview = () => {
    previewRequestId.current += 1;
    setPreviewConversation(null);
    setPreviewMessages([]);
    setIsPreviewLoading(false);
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
    const otherParticipants = getOtherParticipants(item, CURRENT_USER_ID);
    const fallbackPreview =
      item.kind === 'group'
        ? `${item.participants.length} ${language === 'it' ? 'partecipanti' : 'members'}`
        : otherParticipants[0]?.role ?? '';
    const lastMessagePreview = item.currentUserHasLeft
      ? copy.leftGroupNotice
      : item.lastMessage
        ? getMessageContent(item.lastMessage, copy) || fallbackPreview
        : fallbackPreview;

    return (
      <SwipeableConversationRow
        actionIconColor={colors.white}
        deleteLabel={copy.delete}
        isMuted={item.isMuted}
        isPinned={item.isPinned}
        muteLabel={item.isMuted ? copy.unmuteChat : copy.muteChat}
        pinLabel={item.isPinned ? copy.unpinChat : copy.pinChat}
        styles={styles}
        onDelete={() => requestConversationDeletion(item)}
        onInteractionEnd={() => navigation.setOptions({ swipeEnabled: true })}
        onInteractionStart={() => navigation.setOptions({ swipeEnabled: false })}
        onMute={() => {
          void triggerHaptic();
          void setConversationMuted(item.id, !item.isMuted);
        }}
        onPin={() => {
          void triggerHaptic();
          void setConversationPinned(item.id, !item.isPinned);
        }}
      >
        <TouchableOpacity
          accessibilityLabel={`${title}. ${lastMessagePreview}`}
          accessibilityRole="button"
          activeOpacity={0.72}
          delayLongPress={420}
          style={styles.conversationCard}
          onPress={() => handleConversationPress(item.id)}
          onLongPress={() => void showConversationPreview(item)}
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
              {item.isPinned ? (
                <Ionicons name="pin" size={13} color={colors.primary} />
              ) : null}
              {item.isMuted ? (
                <Ionicons name="notifications-off" size={13} color={colors.gray} />
              ) : null}
              <Text style={styles.time}>
                {formatTimestamp(item.updatedAt, language, copy.yesterday)}
              </Text>
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
      </SwipeableConversationRow>
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

  const previewTitle = previewConversation
    ? getConversationTitle(previewConversation, CURRENT_USER_ID)
    : '';
  const previewAvatarUrl = previewConversation
    ? getConversationAvatarUrl(previewConversation, CURRENT_USER_ID)
    : null;

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
          directionalLockEnabled
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={emptyState}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              progressViewOffset={24}
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

      <Modal
        animationType="fade"
        onRequestClose={closeConversationPreview}
        transparent
        visible={previewConversation !== null}
      >
        <Pressable style={styles.previewOverlay} onPress={closeConversationPreview}>
          <Pressable
            accessibilityViewIsModal
            style={styles.previewCard}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.previewHeader}>
              {previewAvatarUrl ? (
                <Image source={{ uri: previewAvatarUrl }} style={styles.previewAvatar} />
              ) : (
                <View style={[styles.previewAvatar, styles.previewAvatarFallback]}>
                  {previewConversation?.kind === 'group' ? (
                    <Ionicons name="people" size={20} color={colors.primary} />
                  ) : (
                    <Text style={styles.previewAvatarText}>
                      {getInitials(previewTitle)}
                    </Text>
                  )}
                </View>
              )}
              <View style={styles.previewHeaderCopy}>
                <Text numberOfLines={1} style={styles.previewTitle}>
                  {previewTitle}
                </Text>
                <Text style={styles.previewSubtitle}>{copy.previewTitle}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={copy.cancel}
                accessibilityRole="button"
                style={styles.previewClose}
                onPress={closeConversationPreview}
              >
                <Ionicons name="close" size={21} color={colors.textStrong} />
              </TouchableOpacity>
            </View>

            <View style={styles.previewPrivacyNotice}>
              <Ionicons name="eye-off-outline" size={17} color={colors.primary} />
              <Text style={styles.previewPrivacyText}>{copy.previewPrivacy}</Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.previewMessagesContent}
              showsVerticalScrollIndicator={false}
              style={styles.previewMessages}
            >
              {isPreviewLoading ? (
                <ActivityIndicator color={colors.primary} style={styles.previewLoader} />
              ) : previewMessages.length === 0 ? (
                <View style={styles.previewEmpty}>
                  <Ionicons name="chatbubble-outline" size={26} color={colors.gray} />
                  <Text style={styles.previewEmptyText}>{copy.previewEmpty}</Text>
                </View>
              ) : (
                previewMessages.map((message) => {
                  const isOwn = message.senderId === CURRENT_USER_ID;
                  const sender = previewConversation?.participants.find(
                    (participant) => participant.id === message.senderId
                  );
                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.previewMessageRow,
                        isOwn && styles.previewMessageRowOwn,
                      ]}
                    >
                      {!isOwn && previewConversation?.kind === 'group' ? (
                        <Text style={styles.previewSender}>{sender?.displayName}</Text>
                      ) : null}
                      <View
                        style={[
                          styles.previewBubble,
                          isOwn && styles.previewBubbleOwn,
                        ]}
                      >
                        <Text
                          style={[
                            styles.previewMessageText,
                            isOwn && styles.previewMessageTextOwn,
                          ]}
                        >
                          {getMessageContent(message, copy)}
                        </Text>
                        <Text
                          style={[
                            styles.previewMessageTime,
                            isOwn && styles.previewMessageTimeOwn,
                          ]}
                        >
                          {formatTimestamp(message.sentAt, language, copy.yesterday)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
