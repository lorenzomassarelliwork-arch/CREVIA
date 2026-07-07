import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getConversationTitle } from '../chatSelectors';
import { chatService, CURRENT_USER_ID } from '../services/chatService';
import type { ChatConversation } from '../types';

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
    setQuery,
  };
}
