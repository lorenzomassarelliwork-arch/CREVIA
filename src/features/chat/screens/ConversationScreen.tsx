import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import AudioAttachmentPlayer from '../components/AudioAttachmentPlayer';
import { CHAT_COPY } from '../chatCopy';
import {
  getConversationAvatarUrl,
  getConversationPresence,
  getConversationTitle,
  getOtherParticipants,
} from '../chatSelectors';
import { useConversation } from '../hooks/useConversation';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { CURRENT_USER_ID } from '../services/chatService';
import type {
  ChatAttachment,
  ChatDocumentAttachment,
  ChatImageAttachment,
  ChatMessage,
  ChatReplyPreview,
} from '../types';
import createStyles from './ConversationScreen.styles';

type ConversationScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Conversation'
>;

const QUICK_REACTIONS = ['👍', '❤️', '🎉', '😂'];
const MAX_PENDING_ATTACHMENTS = 10;
const MAX_GALLERY_IMAGES = 10;

function getInitials(displayName: string) {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function formatRecordingDuration(durationMs: number) {
  const seconds = Math.floor(durationMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function createAttachmentId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatFileSize(fileSize: number | null) {
  if (!fileSize) return '';
  if (fileSize < 1024 * 1024) return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ConversationScreen({
  navigation,
  route,
}: ConversationScreenProps) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const copy = CHAT_COPY[language];
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const holdRecordingStartRef = useRef<Promise<boolean> | null>(null);
  const skipNextVoiceButtonPressRef = useRef(false);
  const [draft, setDraft] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatReplyPreview | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const {
    cancelRecording,
    durationMs,
    finishRecording,
    isRecording,
    startRecording,
  } = useVoiceRecorder();
  const {
    conversation,
    error,
    isLoading,
    isSending,
    messages,
    retry,
    retryMessage,
    sendMessage,
    toggleReaction,
    typingUserIds,
  } = useConversation(route.params.conversationId);

  const title = conversation
    ? getConversationTitle(conversation, CURRENT_USER_ID)
    : copy.title;
  const avatarUrl = conversation
    ? getConversationAvatarUrl(conversation, CURRENT_USER_ID)
    : null;
  const presence = conversation
    ? getConversationPresence(conversation, CURRENT_USER_ID)
    : null;
  const directContact =
    conversation?.kind === 'direct'
      ? getOtherParticipants(conversation, CURRENT_USER_ID)[0] ?? null
      : null;
  const isDirectContactBlocked = Boolean(
    conversation &&
      directContact &&
      conversation.blockedUserIds.includes(directContact.id)
  );
  const isConversationReadOnly = Boolean(
    conversation?.currentUserHasLeft || isDirectContactBlocked
  );
  const participantNames = useMemo(
    () =>
      new Map(
        conversation?.participants.map((participant) => [
          participant.id,
          participant.displayName,
        ]) ?? []
      ),
    [conversation]
  );
  const participantsById = useMemo(
    () =>
      new Map(
        conversation?.participants.map((participant) => [
          participant.id,
          participant,
        ]) ?? []
      ),
    [conversation]
  );

  const openParticipantProfile = (userId: string) => {
    if (userId === CURRENT_USER_ID) {
      navigation.navigate('Main', { screen: 'Profile' });
    } else {
      navigation.navigate('PublicUserProfile', { userId });
    }
  };

  const getSenderName = (senderId: string) =>
    senderId === CURRENT_USER_ID
      ? copy.you
      : participantNames.get(senderId) ?? title;

  const getMessageSummary = (message: ChatMessage) =>
    message.text ||
    (message.attachments[0]?.kind === 'image'
      ? copy.photo
      : message.attachments[0]?.kind === 'document'
        ? copy.document
        : copy.voiceMessage);

  const addPendingAttachments = (attachments: ChatAttachment[]) => {
    setPendingAttachments((current) =>
      [...current, ...attachments].slice(0, MAX_PENDING_ATTACHMENTS)
    );
  };

  const createImageAttachment = (
    asset: ImagePicker.ImagePickerAsset,
    prefix = 'image'
  ): ChatImageAttachment => ({
    id: createAttachmentId(prefix),
    kind: 'image',
    uri: asset.uri,
    fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileSize: asset.fileSize ?? null,
    width: asset.width,
    height: asset.height,
  });

  const handleSend = async () => {
    if ((!draft.trim() && pendingAttachments.length === 0) || isSending) return;

    void triggerHaptic();
    const sent = await sendMessage({
      text: draft,
      attachments: pendingAttachments,
      replyTo: replyingTo,
    });
    if (sent) {
      setDraft('');
      setPendingAttachments([]);
      setReplyingTo(null);
    }
  };

  const handlePickImageFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(copy.addPhoto, copy.mediaPermissionError);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_GALLERY_IMAGES,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || result.assets.length === 0) return;

      addPendingAttachments(
        result.assets
          .slice(0, MAX_GALLERY_IMAGES)
          .map((asset) => createImageAttachment(asset))
      );
    } catch {
      Alert.alert(copy.addPhoto, copy.sendError);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(copy.takePhoto, copy.cameraPermissionError);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset) return;

      addPendingAttachments([createImageAttachment(asset, 'camera')]);
    } catch {
      Alert.alert(copy.takePhoto, copy.sendError);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: '*/*',
      });
      if (result.canceled) return;

      const attachments: ChatDocumentAttachment[] = result.assets.map((asset) => ({
        id: createAttachmentId('document'),
        kind: 'document',
        uri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        fileSize: asset.size ?? null,
      }));
      addPendingAttachments(attachments);
    } catch {
      Alert.alert(copy.addDocument, copy.sendError);
    }
  };

  const handleAddAttachment = () => {
    if (isRecording) return;
    void triggerHaptic();
    Alert.alert(copy.addAttachment, undefined, [
      { text: copy.addPhoto, onPress: () => void handlePickImageFromLibrary() },
      { text: copy.takePhoto, onPress: () => void handleTakePhoto() },
      { text: copy.addDocument, onPress: () => void handlePickDocument() },
      { text: copy.cancel, style: 'cancel' },
    ]);
  };

  const handleVoiceAction = async () => {
    if (isRecording) {
      const attachment = await finishRecording();
      if (attachment) addPendingAttachments([attachment]);
      return;
    }

    const started = await startRecording();
    if (!started) Alert.alert(copy.startRecording, copy.microphonePermissionError);
  };

  const handleHoldVoiceStart = () => {
    if (isRecording || isSending || holdRecordingStartRef.current) return;

    void triggerHaptic();
    holdRecordingStartRef.current = startRecording();
  };

  const handleHoldVoiceRelease = () => {
    const startPromise = holdRecordingStartRef.current;
    if (!startPromise) return;

    holdRecordingStartRef.current = null;
    skipNextVoiceButtonPressRef.current = true;
    setTimeout(() => {
      skipNextVoiceButtonPressRef.current = false;
    }, 0);

    void startPromise.then(async (started) => {
      if (!started) {
        Alert.alert(copy.startRecording, copy.microphonePermissionError);
        return;
      }

      const attachment = await finishRecording();
      if (!attachment) return;

      void triggerHaptic();
      const sent = await sendMessage({
        text: '',
        attachments: [attachment],
        replyTo: replyingTo,
      });
      if (sent) setReplyingTo(null);
    });
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo({
      messageId: message.id,
      senderId: message.senderId,
      text: getMessageSummary(message),
      attachmentKind: message.attachments[0]?.kind ?? null,
    });
    setSelectedMessageId(null);
  };

  const removeAttachment = (attachmentId: string) => {
    setPendingAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  const handleOpenDocument = async (attachment: ChatDocumentAttachment) => {
    try {
      await Linking.openURL(attachment.uri);
    } catch {
      Alert.alert(attachment.fileName, copy.sendError);
    }
  };

  const renderDocumentAttachment = (
    attachment: ChatDocumentAttachment,
    isOwn: boolean
  ) => (
    <TouchableOpacity
      key={attachment.id}
      accessibilityRole="button"
      activeOpacity={0.78}
      style={[
        styles.documentAttachment,
        isOwn ? styles.documentAttachmentOwn : styles.documentAttachmentOther,
      ]}
      onPress={() => void handleOpenDocument(attachment)}
    >
      <View style={[styles.documentIcon, isOwn && styles.documentIconOwn]}>
        <Ionicons
          name="document-text-outline"
          size={20}
          color={isOwn ? colors.white : colors.primary}
        />
      </View>
      <View style={styles.documentCopy}>
        <Text
          numberOfLines={1}
          style={[styles.documentName, isOwn && styles.documentNameOwn]}
        >
          {attachment.fileName}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.documentMeta, isOwn && styles.documentMetaOwn]}
        >
          {formatFileSize(attachment.fileSize) || attachment.mimeType}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.senderId === CURRENT_USER_ID;
    const sender = participantsById.get(item.senderId);
    const showSenderAvatar = conversation?.kind === 'group' && !isOwn && sender;
    const time = new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(item.sentAt));
    const isSelected = selectedMessageId === item.id;

    return (
      <View
        style={[
          styles.messageGroup,
          isOwn ? styles.messageGroupOwn : styles.messageGroupOther,
        ]}
      >
        <View
          style={[
            styles.messageContentRow,
            isOwn && styles.messageContentRowOwn,
          ]}
        >
          {showSenderAvatar && (
            <TouchableOpacity
              activeOpacity={0.72}
              style={styles.messageSenderAvatarButton}
              onPress={() => openParticipantProfile(sender.id)}
            >
              {sender.avatarUrl ? (
                <Image
                  source={{ uri: sender.avatarUrl }}
                  style={styles.messageSenderAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.messageSenderAvatar,
                    styles.messageSenderAvatarFallback,
                  ]}
                >
                  <Text style={styles.messageSenderInitials}>
                    {getInitials(sender.displayName)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        <TouchableOpacity
          activeOpacity={0.86}
          delayLongPress={250}
          style={[
            styles.messageBubble,
            isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
            item.status === 'failed' && styles.messageBubbleFailed,
          ]}
          onLongPress={() => {
            if (isConversationReadOnly) return;
            void triggerHaptic();
            setSelectedMessageId((current) => (current === item.id ? null : item.id));
          }}
        >
          {item.replyTo && (
            <View
              style={[
                styles.quotedReply,
                isOwn ? styles.quotedReplyOwn : styles.quotedReplyOther,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.quotedReplyAuthor,
                  isOwn && styles.quotedReplyTextOwn,
                ]}
              >
                {getSenderName(item.replyTo.senderId)}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.quotedReplyText,
                  isOwn && styles.quotedReplyTextOwn,
                ]}
              >
                {item.replyTo.text}
              </Text>
            </View>
          )}

          {item.attachments.map((attachment) =>
            attachment.kind === 'image' ? (
              <Image
                key={attachment.id}
                resizeMode="cover"
                source={{ uri: attachment.uri }}
                style={styles.messageImage}
              />
            ) : attachment.kind === 'document' ? (
              renderDocumentAttachment(attachment, isOwn)
            ) : (
              <AudioAttachmentPlayer
                key={attachment.id}
                attachment={attachment}
                isOwn={isOwn}
              />
            )
          )}

          {item.text.length > 0 && (
            <Text
              style={[
                styles.messageText,
                isOwn ? styles.messageTextOwn : styles.messageTextOther,
                item.attachments.length > 0 && styles.messageTextWithAttachment,
              ]}
            >
              {item.text}
            </Text>
          )}

          <View style={styles.messageMeta}>
            <Text
              style={[
                styles.messageTime,
                isOwn ? styles.messageTimeOwn : styles.messageTimeOther,
              ]}
            >
              {time}
            </Text>
            {isOwn && item.status === 'failed' ? (
              <TouchableOpacity
                accessibilityLabel={copy.retry}
                accessibilityRole="button"
                disabled={isConversationReadOnly}
                onPress={() => void retryMessage(item)}
              >
                <Ionicons name="alert-circle" size={15} color={colors.error} />
              </TouchableOpacity>
            ) : isOwn ? (
              <Ionicons
                name={
                  item.status === 'sending'
                    ? 'time-outline'
                    : item.status === 'sent'
                      ? 'checkmark'
                      : 'checkmark-done'
                }
                size={13}
                color={colors.white}
              />
            ) : null}
          </View>
        </TouchableOpacity>
        </View>

        {item.reactions.length > 0 && (
          <View style={styles.reactionsRow}>
            {item.reactions.map((reaction) => (
              <TouchableOpacity
                key={reaction.emoji}
                accessibilityRole="button"
                disabled={isConversationReadOnly}
                style={styles.reactionBadge}
                onPress={() => void toggleReaction(item.id, reaction.emoji)}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                <Text style={styles.reactionCount}>{reaction.userIds.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isSelected && (
          <View style={styles.messageActions}>
            {QUICK_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                accessibilityRole="button"
                style={styles.quickReaction}
                onPress={() => {
                  void toggleReaction(item.id, emoji);
                  setSelectedMessageId(null);
                }}
              >
                <Text style={styles.quickReactionText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.actionDivider} />
            <TouchableOpacity
              accessibilityLabel={copy.reply}
              accessibilityRole="button"
              style={styles.quickReaction}
              onPress={() => handleReply(item)}
            >
              <Ionicons name="arrow-undo" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!conversation) {
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
        </View>
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={42} color={colors.gray} />
          <Text style={styles.errorTitle}>{copy.loadError}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.retryButton}
            onPress={() => void retry()}
          >
            <Text style={styles.retryText}>{copy.retry}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const presenceLabel = isDirectContactBlocked
    ? copy.blockedUserNotice
    : conversation.currentUserHasLeft
    ? copy.leftGroupNotice
    : typingUserIds.length > 0
    ? copy.typing
    : conversation.kind === 'group'
      ? `${presence?.participantCount ?? 0} ${
          presence?.participantCount === 1 ? copy.participant : copy.participants
        }${presence?.onlineCount ? ` · ${presence.onlineCount} online` : ''}`
      : presence?.isOnline
        ? copy.online
        : copy.offline;
  const canSend = draft.trim().length > 0 || pendingAttachments.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel={language === 'it' ? 'Torna alle chat' : 'Back to chats'}
            accessibilityRole="button"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textStrong} />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.7}
            style={styles.groupHeaderButton}
            onPress={() => {
              const params = { conversationId: conversation.id };
              conversation.kind === 'group'
                ? navigation.navigate('GroupInfo', params)
                : navigation.navigate('ContactInfo', params);
            }}
          >
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  {conversation.kind === 'group' ? (
                    <Ionicons name="people" size={20} color={colors.primary} />
                  ) : (
                    <Text style={styles.avatarInitials}>{getInitials(title)}</Text>
                  )}
                </View>
              )}
              {presence?.isOnline && <View style={styles.onlineDot} />}
            </View>

            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.participantName}>
                {title}
              </Text>
              <Text
                style={[
                  styles.presence,
                  typingUserIds.length > 0 &&
                    !isConversationReadOnly &&
                    styles.typingText,
                ]}
              >
                {presenceLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          contentContainerStyle={styles.messagesContent}
          data={messages}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            typingUserIds.length > 0 && !isConversationReadOnly ? (
              <View style={styles.typingBubble}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            ) : null
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onScrollBeginDrag={() => setSelectedMessageId(null)}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
        />

        {error && <Text style={styles.sendError}>{copy.sendError}</Text>}

        {isConversationReadOnly ? (
          <View style={styles.readOnlyComposer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.gray} />
            <Text style={styles.readOnlyComposerText}>
              {isDirectContactBlocked ? copy.blockedUserNotice : copy.readOnlyConversation}
            </Text>
          </View>
        ) : (
        <View style={styles.composerContainer}>
          {replyingTo && (
            <View style={styles.composerReply}>
              <View style={styles.composerReplyCopy}>
                <Text style={styles.composerReplyLabel}>
                  {copy.replyingTo} {getSenderName(replyingTo.senderId)}
                </Text>
                <Text numberOfLines={1} style={styles.composerReplyText}>
                  {replyingTo.text}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setReplyingTo(null)}
              >
                <Ionicons name="close" size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>
          )}

          {pendingAttachments.length > 0 && (
            <ScrollView
              horizontal
              contentContainerStyle={styles.pendingAttachments}
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
            >
              {pendingAttachments.map((attachment) => (
                <View key={attachment.id} style={styles.pendingAttachment}>
                  {attachment.kind === 'image' ? (
                    <Image source={{ uri: attachment.uri }} style={styles.pendingImage} />
                  ) : attachment.kind === 'document' ? (
                    <View style={styles.pendingDocument}>
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <Text numberOfLines={1} style={styles.pendingDocumentText}>
                        {attachment.fileName}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.pendingAudio}>
                      <Ionicons name="mic" size={17} color={colors.primary} />
                      <Text style={styles.pendingAudioText}>
                        {formatRecordingDuration(attachment.durationMs)}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.removeAttachment}
                    onPress={() => removeAttachment(attachment.id)}
                  >
                    <Ionicons name="close" size={13} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.composer}>
            <TouchableOpacity
              accessibilityLabel={copy.addAttachment}
              accessibilityRole="button"
              disabled={isRecording}
              style={styles.composerIconButton}
              onPress={handleAddAttachment}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>

            {isRecording ? (
              <View style={styles.recordingState}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>
                  {formatRecordingDuration(durationMs)}
                </Text>
                <TouchableOpacity
                  accessibilityLabel={copy.cancelRecording}
                  accessibilityRole="button"
                  onPress={() => void cancelRecording()}
                >
                  <Text style={styles.cancelRecording}>{copy.cancelRecording}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                accessibilityLabel={copy.messagePlaceholder}
                multiline
                placeholder={copy.messagePlaceholder}
                placeholderTextColor={colors.gray}
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
              />
            )}

            <TouchableOpacity
              accessibilityLabel={
                isRecording
                  ? copy.stopRecording
                  : canSend
                    ? copy.send
                    : copy.startRecording
              }
              accessibilityRole="button"
              activeOpacity={0.75}
              disabled={isSending}
              delayLongPress={250}
              style={[
                styles.sendButton,
                isRecording && styles.recordingButton,
                isSending && styles.sendButtonDisabled,
              ]}
              onLongPress={canSend || isRecording ? undefined : handleHoldVoiceStart}
              onPressOut={canSend || isRecording ? undefined : handleHoldVoiceRelease}
              onPress={() => {
                if (skipNextVoiceButtonPressRef.current) return;
                void (isRecording
                  ? handleVoiceAction()
                  : canSend
                    ? handleSend()
                    : handleVoiceAction());
              }}
            >
              {isSending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Ionicons
                  name={isRecording ? 'stop' : canSend ? 'send' : 'mic'}
                  size={19}
                  color={colors.white}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
