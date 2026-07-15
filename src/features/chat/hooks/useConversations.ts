import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getConversationTitle } from '../chatSelectors';
import { chatService, CURRENT_USER_ID } from '../services/chatService';
import type { ChatConversation } from '../types';

function sortConversations(items: ChatConversation[]) {
  return [...items].sort((left, right) => {
    if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function useConversations() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setError(null);

    try {
      const page = await chatService.listConversations();
      setConversations(page.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load conversations'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadConversations();
    }, [loadConversations])
  );

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return conversations;

    return conversations.filter((conversation) => {
      const searchableText = [
        getConversationTitle(conversation, CURRENT_USER_ID),
        ...conversation.participants.map(
          (participant) => `${participant.displayName} ${participant.role}`
        ),
        conversation.lastMessage?.text ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [conversations, query]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    setError(null);
    try {
      await chatService.deleteConversation(conversationId);
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== conversationId)
      );
      return true;
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete conversation'
      );
      return false;
    }
  }, []);

  const setConversationPinned = useCallback(
    async (conversationId: string, isPinned: boolean) => {
      setError(null);
      try {
        const updated = await chatService.setConversationPinned(
          conversationId,
          isPinned
        );
        setConversations((current) =>
          sortConversations(
            current.map((conversation) =>
              conversation.id === conversationId ? updated : conversation
            )
          )
        );
        return true;
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : 'Unable to pin conversation'
        );
        return false;
      }
    },
    []
  );

  const setConversationMuted = useCallback(
    async (conversationId: string, isMuted: boolean) => {
      setError(null);
      try {
        const updated = await chatService.setConversationMuted(
          conversationId,
          isMuted
        );
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId ? updated : conversation
          )
        );
        return true;
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : 'Unable to mute conversation'
        );
        return false;
      }
    },
    []
  );

  return {
    conversations: filteredConversations,
    deleteConversation,
    error,
    hasConversations: conversations.length > 0,
    isLoading,
    isRefreshing,
    query,
    refresh: () => loadConversations(true),
    retry: () => loadConversations(),
    setConversationMuted,
    setConversationPinned,
    setQuery,
  };
}
