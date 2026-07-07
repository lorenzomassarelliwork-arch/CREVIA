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
import * as ImagePicker from 'expo-image-picker';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import AddGroupParticipantsModal from '../components/AddGroupParticipantsModal';
import SharedMediaSection from '../components/SharedMediaSection';
import { CHAT_COPY } from '../chatCopy';
import { chatService, CURRENT_USER_ID } from '../services/chatService';
import type { ChatConversation, ChatMediaItem, ChatUser } from '../types';
import createStyles from './GroupInfoScreen.styles';

type GroupInfoScreenProps = NativeStackScreenProps<RootStackParamList, 'GroupInfo'>;

function getInitials(displayName: string) {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function GroupInfoScreen({
  navigation,
  route,
}: GroupInfoScreenProps) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = CHAT_COPY[language];
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [media, setMedia] = useState<ChatMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMemberPickerVisible, setIsMemberPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [details, mediaPage] = await Promise.all([
        chatService.getConversation(route.params.conversationId),
        chatService.listConversationMedia(route.params.conversationId),
      ]);
      if (details.conversation.kind !== 'group') throw new Error('Not a group');
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
      void loadGroup();
    }, [loadGroup])
  );

  const changeGroupImage = async () => {
    if (!conversation || conversation.currentUserHasLeft) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(copy.groupPhoto, copy.mediaPermissionError);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset) return;

      setIsUpdating(true);
      const updated = await chatService.updateGroupImage(conversation.id, asset.uri);
      setConversation(updated);
      void triggerHaptic();
    } catch {
      setError(copy.groupInfoError);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleMain = (participant: ChatUser) => {
    if (!conversation) return;
    const isMain = conversation.mainUserIds.includes(participant.id);
    setIsUpdating(true);
    setError(null);
    void chatService
      .setGroupMain(conversation.id, participant.id, !isMain)
      .then((updated) => {
        setConversation(updated);
        void triggerHaptic();
      })
      .catch(() => setError(copy.groupInfoError))
      .finally(() => setIsUpdating(false));
  };

  const removeParticipant = (participant: ChatUser) => {
    if (!conversation) return;

    Alert.alert(copy.removeParticipantTitle, copy.removeParticipantMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.removeParticipant,
        style: 'destructive',
        onPress: () => {
          setIsUpdating(true);
          setError(null);
          void chatService
            .removeGroupParticipant(conversation.id, participant.id)
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

  const manageParticipant = (participant: ChatUser) => {
    if (!conversation) return;
    const isMain = conversation.mainUserIds.includes(participant.id);

    Alert.alert(copy.manageParticipant, participant.displayName, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: isMain ? copy.removeMain : copy.makeMain,
        onPress: () => toggleMain(participant),
      },
      {
        text: copy.removeParticipant,
        style: 'destructive',
        onPress: () => removeParticipant(participant),
      },
    ]);
  };

  const leaveGroup = () => {
    if (!conversation || conversation.currentUserHasLeft) return;

    Alert.alert(copy.leaveGroupTitle, copy.leaveGroupMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.leaveGroup,
        style: 'destructive',
        onPress: () => {
          setIsUpdating(true);
          void chatService
            .leaveGroup(conversation.id)
            .then(() => {
              void triggerHaptic();
              navigation.pop(2);
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

  if (!conversation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.textStrong} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{copy.groupInfo}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error ?? copy.groupInfoError}</Text>
        </View>
      </View>
    );
  }

  const isCurrentUserMain = conversation.mainUserIds.includes(CURRENT_USER_ID);

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
        <Text style={styles.headerTitle}>{copy.groupInfo}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <TouchableOpacity
            accessibilityLabel={copy.changeGroupPhoto}
            accessibilityRole="button"
            activeOpacity={conversation.currentUserHasLeft ? 1 : 0.75}
            disabled={conversation.currentUserHasLeft || isUpdating}
            style={styles.groupAvatarWrap}
            onPress={() => void changeGroupImage()}
          >
            {conversation.avatarUrl ? (
              <Image source={{ uri: conversation.avatarUrl }} style={styles.groupAvatar} />
            ) : (
              <View style={[styles.groupAvatar, styles.groupAvatarFallback]}>
                <Ionicons name="people" size={38} color={colors.primary} />
              </View>
            )}
            {!conversation.currentUserHasLeft && (
              <View style={styles.editAvatarBadge}>
                {isUpdating ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Ionicons name="camera" size={16} color={colors.white} />
                )}
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.groupTitle}>{conversation.title}</Text>
          <Text style={styles.groupSubtitle}>
            {conversation.participants.length} {copy.participants}
          </Text>
          {!conversation.currentUserHasLeft && (
            <Text style={styles.changePhotoLabel}>{copy.changeGroupPhoto}</Text>
          )}
        </View>

        {conversation.currentUserHasLeft && (
          <View style={styles.leftNotice}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            <View style={styles.leftNoticeCopy}>
              <Text style={styles.leftNoticeTitle}>{copy.leftGroupNotice}</Text>
              <Text style={styles.leftNoticeText}>{copy.readOnlyConversation}</Text>
            </View>
          </View>
        )}

        {error && <Text style={styles.inlineError}>{error}</Text>}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{copy.participants}</Text>
          <Text style={styles.sectionCount}>{conversation.participants.length}</Text>
        </View>

        {isCurrentUserMain && !conversation.currentUserHasLeft && (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.75}
            disabled={isUpdating}
            style={styles.addParticipantsButton}
            onPress={() => setIsMemberPickerVisible(true)}
          >
            <View style={styles.addParticipantsIcon}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.addParticipantsText}>{copy.addParticipants}</Text>
            <Ionicons name="chevron-forward" size={19} color={colors.gray} />
          </TouchableOpacity>
        )}

        <View style={styles.participantCard}>
          {conversation.participants.map((participant, index) => {
            const isMain = conversation.mainUserIds.includes(participant.id);
            const isCurrentUser = participant.id === CURRENT_USER_ID;
            const canManageRole =
              isCurrentUserMain &&
              !conversation.currentUserHasLeft &&
              !isCurrentUser;

            return (
              <View
                key={participant.id}
                style={[
                  styles.participantRow,
                  index === conversation.participants.length - 1 &&
                    styles.participantRowLast,
                ]}
              >
                {participant.avatarUrl ? (
                  <Image source={{ uri: participant.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitials}>
                      {getInitials(participant.displayName)}
                    </Text>
                  </View>
                )}
                <View style={styles.participantCopy}>
                  <View style={styles.participantNameRow}>
                    <Text numberOfLines={1} style={styles.participantName}>
                      {isCurrentUser ? copy.you : participant.displayName}
                    </Text>
                    {isMain && (
                      <View style={styles.mainBadge}>
                        <Text style={styles.mainBadgeText}>{copy.mainLabel}</Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} style={styles.participantRole}>
                    {participant.role}
                  </Text>
                </View>
                {canManageRole && (
                  <TouchableOpacity
                    accessibilityLabel={copy.manageParticipant}
                    accessibilityRole="button"
                    disabled={isUpdating}
                    style={styles.memberMenuButton}
                    onPress={() => manageParticipant(participant)}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <SharedMediaSection media={media} />

        {!conversation.currentUserHasLeft && (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.75}
            disabled={isUpdating}
            style={styles.leaveButton}
            onPress={leaveGroup}
          >
            <Ionicons name="exit-outline" size={20} color={colors.error} />
            <Text style={styles.leaveButtonText}>{copy.leaveGroup}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AddGroupParticipantsModal
        conversationId={conversation.id}
        visible={isMemberPickerVisible}
        onClose={() => setIsMemberPickerVisible(false)}
        onAdded={setConversation}
      />
    </View>
  );
}
