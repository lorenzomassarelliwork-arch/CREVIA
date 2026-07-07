import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { chatService, CURRENT_USER_ID } from '../services/chatService';
import type {
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  ChatReplyPreview,
  SendMessageInput,
} from '../types';

type SendDraft = {
  text: string;
  attachments?: ChatAttachment[];
  replyTo?: ChatReplyPreview | null;
};

function createClientMessageId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function replaceMessage(messages: ChatMessage[], updated: ChatMessage) {
  const exists = messages.some((message) => message.id === updated.id);
  return exists
    ? messages.map((message) => (message.id === updated.id ? updated : message))
    : [...messages, updated];
}

export function useConversation(conversationId: string) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const details = await chatService.getConversation(conversationId);
      setConversation(details.conversation);
      setMessages(details.messages);
      await chatService.markConversationAsRead(conversationId);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load conversation'
      );
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      void loadConversation();
    }, [loadConversation])
  );

  useEffect(
    () =>
      chatService.subscribeToConversation(conversationId, (event) => {
        if (event.type === 'typing.changed') {
          if (event.userId === CURRENT_USER_ID) return;
          setTypingUserIds((current) =>
            event.isTyping
              ? Array.from(new Set([...current, event.userId]))
              : current.filter((id) => id !== event.userId)
          );
          return;
        }

        setMessages((current) => replaceMessage(current, event.message));
      }),
    [conversationId]
  );

  const deliverMessage = useCallback(
    async (optimisticMessage: ChatMessage) => {
      const input: SendMessageInput = {
        clientMessageId: optimisticMessage.id,
        text: optimisticMessage.text,
        attachments: optimisticMessage.attachments,
        replyTo: optimisticMessage.replyTo,
      };

      try {
        const sentMessage = await chatService.sendMessage(conversationId, input);
        setMessages((current) => replaceMessage(current, sentMessage));
        return true;
      } catch (sendError) {
        setMessages((current) =>
          current.map((message) =>
            message.id === optimisticMessage.id
              ? { ...message, status: 'failed' }
              : message
          )
        );
        setError(
          sendError instanceof Error ? sendError.message : 'Unable to send message'
        );
        return false;
      }
    },
    [conversationId]
  );

  const sendMessage = useCallback(
    async ({ text, attachments = [], replyTo = null }: SendDraft) => {
      const normalizedText = text.trim();
      if ((!normalizedText && attachments.length === 0) || isSending) return false;

      const optimisticMessage: ChatMessage = {
        id: createClientMessageId(),
        conversationId,
        senderId: CURRENT_USER_ID,
        text: normalizedText,
        attachments,
        replyTo,
        reactions: [],
        sentAt: new Date().toISOString(),
        status: 'sending',
      };

      setIsSending(true);
      setError(null);
      setMessages((current) => [...current, optimisticMessage]);
      const sent = await deliverMessage(optimisticMessage);
      setIsSending(false);
      return sent;
    },
    [conversationId, deliverMessage, isSending]
  );

  const retryMessage = useCallback(
    async (message: ChatMessage) => {
      setError(null);
      const retryingMessage: ChatMessage = { ...message, status: 'sending' };
      setMessages((current) => replaceMessage(current, retryingMessage));
      return deliverMessage(retryingMessage);
    },
    [deliverMessage]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        const updated = await chatService.toggleReaction(
          conversationId,
          messageId,
          emoji
        );
        setMessages((current) => replaceMessage(current, updated));
      } catch (reactionError) {
        setError(
          reactionError instanceof Error
            ? reactionError.message
            : 'Unable to update reaction'
        );
      }
    },
    [conversationId]
  );

  return {
    conversation,
    error,
    isLoading,
    isSending,
    messages,
    retry: loadConversation,
    retryMessage,
    sendMessage,
    toggleReaction,
    typingUserIds,
  };
}
