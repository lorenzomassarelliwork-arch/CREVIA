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
import type { ChatConversation, ChatUser } from '../types';
import createStyles from './NewConversationModal.styles';

type AddGroupParticipantsModalProps = {
  conversationId: string;
  visible: boolean;
  onClose: () => void;
  onAdded: (conversation: ChatConversation) => void;
};

function getInitials(displayName: string) {
  return displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function AddGroupParticipantsModal({
  conversationId,
  visible,
  onClose,
  onAdded,
}: AddGroupParticipantsModalProps) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const copy = CHAT_COPY[language];
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) return;
    setQuery('');
    setUsers([]);
    setSelectedUserIds([]);
    setError(null);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;

    let active = true;
    setIsLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      chatService
        .searchUsers({ query, excludeConversationId: conversationId })
        .then((results) => {
          if (active) setUsers(results);
        })
        .catch(() => {
          if (active) setError(copy.groupInfoError);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [conversationId, copy.groupInfoError, query, visible]);

  const toggleUser = (userId: string) => {
    void triggerHaptic();
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const addParticipants = async () => {
    if (selectedUserIds.length === 0 || isAdding) return;

    setIsAdding(true);
    setError(null);
    try {
      const updated = await chatService.addGroupParticipants(
        conversationId,
        selectedUserIds
      );
      void triggerHaptic();
      onAdded(updated);
      onClose();
    } catch {
      setError(copy.groupInfoError);
    } finally {
      setIsAdding(false);
    }
  };

  const renderUser = ({ item }: { item: ChatUser }) => {
    const isSelected = selectedUserIds.includes(item.id);
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.72}
        disabled={isAdding}
        style={styles.userRow}
        onPress={() => toggleUser(item.id)}
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
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={15} color={colors.white} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
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
            onPress={onClose}
          >
            <Ionicons name="close" size={22} color={colors.textStrong} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{copy.addParticipants}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.peopleContent}>
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
                  <Text style={styles.emptyText}>{copy.noUsersToAdd}</Text>
                </View>
              }
              renderItem={renderUser}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.groupFooter}>
            <Text style={styles.selectionText}>
              {selectedUserIds.length} {copy.selected}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.75}
              disabled={selectedUserIds.length === 0 || isAdding}
              style={[
                styles.createButton,
                (selectedUserIds.length === 0 || isAdding) &&
                  styles.createButtonDisabled,
              ]}
              onPress={() => void addParticipants()}
            >
              {isAdding ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.createButtonText}>
                  {copy.addSelectedParticipants}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
