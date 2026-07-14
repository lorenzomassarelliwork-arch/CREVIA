import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { CHAT_COPY } from '../chatCopy';
import { chatService } from '../services/chatService';
import type { ChatUser } from '../types';
import createStyles from './NewConversationModal.styles';

type ComposerMode = 'choice' | 'direct' | 'group';

type NewConversationModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
};

function getInitials(displayName: string) {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function NewConversationModal({
  visible,
  onClose,
  onCreated,
}: NewConversationModalProps) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const copy = CHAT_COPY[language];
  const [mode, setMode] = useState<ComposerMode>('choice');
  const [query, setQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) return;
    setMode('choice');
    setQuery('');
    setGroupName('');
    setUsers([]);
    setSelectedUserIds([]);
    setError(null);
  }, [visible]);

  useEffect(() => {
    if (!visible || mode === 'choice') return undefined;

    let active = true;
    setIsLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      chatService
        .searchUsers({
          query,
          excludeExistingDirectConversations: mode === 'direct',
        })
        .then((results) => {
          if (active) setUsers(results);
        })
        .catch(() => {
          if (active) setError(copy.loadError);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [copy.loadError, mode, query, visible]);

  const goBack = () => {
    if (mode === 'choice') {
      onClose();
      return;
    }
    setMode('choice');
    setQuery('');
    setGroupName('');
    setSelectedUserIds([]);
    setError(null);
  };

  const startDirectConversation = async (userId: string) => {
    void triggerHaptic();
    setCreatingUserId(userId);
    setError(null);
    try {
      const conversation = await chatService.createDirectConversation(userId);
      onCreated(conversation.id);
    } catch {
      setError(copy.createConversationError);
    } finally {
      setCreatingUserId(null);
    }
  };

  const toggleUser = (userId: string) => {
    void triggerHaptic();
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUserIds.length < 2) return;

    void triggerHaptic();
    setIsCreatingGroup(true);
    setError(null);
    try {
      const conversation = await chatService.createGroupConversation({
        title: groupName,
        participantIds: selectedUserIds,
      });
      onCreated(conversation.id);
    } catch {
      setError(copy.createConversationError);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const renderUser = ({ item }: { item: ChatUser }) => {
    const isSelected = selectedUserIds.includes(item.id);
    const isCreating = creatingUserId === item.id;

    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.72}
        disabled={creatingUserId !== null || isCreatingGroup}
        style={styles.userRow}
        onPress={() =>
          mode === 'direct'
            ? void startDirectConversation(item.id)
            : toggleUser(item.id)
        }
      >
        <View style={styles.avatarWrap}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{getInitials(item.displayName)}</Text>
            </View>
          )}
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.userCopy}>
          <Text numberOfLines={1} style={styles.userName}>
            {item.displayName}
          </Text>
          <Text numberOfLines={1} style={styles.userRole}>
            {item.role}
          </Text>
        </View>
        {isCreating ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : mode === 'direct' ? (
          <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        ) : (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={15} color={colors.white} />}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const canCreateGroup = groupName.trim().length > 0 && selectedUserIds.length >= 2;

  return (
    <Modal
      animationType="slide"
      onRequestClose={goBack}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.headerButton}
            onPress={goBack}
          >
            <Ionicons
              name={mode === 'choice' ? 'close' : 'chevron-back'}
              size={22}
              color={colors.textStrong}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'choice'
              ? copy.createNew
              : mode === 'direct'
                ? copy.newConversation
                : copy.newGroup}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {mode === 'choice' ? (
          <View style={styles.choiceContent}>
            <Text style={styles.choiceTitle}>{copy.chooseAction}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.75}
              style={styles.choiceCard}
              onPress={() => setMode('direct')}
            >
              <View style={styles.choiceIcon}>
                <Ionicons name="chatbubble-ellipses-outline" size={25} color={colors.primary} />
              </View>
              <View style={styles.choiceCopy}>
                <Text style={styles.choiceCardTitle}>{copy.newConversation}</Text>
                <Text style={styles.choiceDescription}>
                  {copy.newConversationDescription}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={21} color={colors.gray} />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.75}
              style={styles.choiceCard}
              onPress={() => setMode('group')}
            >
              <View style={styles.choiceIcon}>
                <Ionicons name="people-outline" size={27} color={colors.primary} />
              </View>
              <View style={styles.choiceCopy}>
                <Text style={styles.choiceCardTitle}>{copy.newGroup}</Text>
                <Text style={styles.choiceDescription}>{copy.newGroupDescription}</Text>
              </View>
              <Ionicons name="chevron-forward" size={21} color={colors.gray} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.peopleContent}>
            {mode === 'group' && (
              <View style={styles.groupNameSection}>
                <Text style={styles.fieldLabel}>{copy.groupName}</Text>
                <TextInput
                  maxLength={60}
                  placeholder={copy.groupNamePlaceholder}
                  placeholderTextColor={colors.gray}
                  style={styles.groupNameInput}
                  value={groupName}
                  onChangeText={setGroupName}
                />
              </View>
            )}

            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={19} color={colors.gray} />
              <TextInput
                autoCapitalize="none"
                placeholder={copy.searchUsers}
                placeholderTextColor={colors.gray}
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && (
                <TouchableOpacity accessibilityRole="button" onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={19} color={colors.gray} />
                </TouchableOpacity>
              )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : (
              <FlatList
                contentContainerStyle={[
                  styles.userList,
                  users.length === 0 && styles.emptyList,
                ]}
                data={users}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View style={styles.centerState}>
                    <Ionicons name="people-outline" size={38} color={colors.gray} />
                    <Text style={styles.emptyText}>{copy.noUsers}</Text>
                  </View>
                }
                renderItem={renderUser}
                showsVerticalScrollIndicator={false}
              />
            )}

            {mode === 'group' && (
              <View style={styles.groupFooter}>
                <Text style={styles.selectionText}>
                  {selectedUserIds.length < 2
                    ? copy.selectAtLeastTwo
                    : `${selectedUserIds.length} ${copy.selected}`}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  disabled={!canCreateGroup || isCreatingGroup}
                  style={[
                    styles.createButton,
                    (!canCreateGroup || isCreatingGroup) && styles.createButtonDisabled,
                  ]}
                  onPress={() => void createGroup()}
                >
                  {isCreatingGroup ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.createButtonText}>{copy.createGroup}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
