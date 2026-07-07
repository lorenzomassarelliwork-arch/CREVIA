import type { ChatConversation, ChatUser } from './types';

export function getOtherParticipants(
  conversation: ChatConversation,
  currentUserId: string
): ChatUser[] {
  return conversation.participants.filter((user) => user.id !== currentUserId);
}

export function getConversationTitle(
  conversation: ChatConversation,
  currentUserId: string
): string {
  if (conversation.title) return conversation.title;

  return (
    getOtherParticipants(conversation, currentUserId)
      .map((user) => user.displayName)
      .join(', ') || 'Chat'
  );
}

export function getConversationAvatarUrl(
  conversation: ChatConversation,
  currentUserId: string
): string | null {
  return (
    conversation.avatarUrl ??
    getOtherParticipants(conversation, currentUserId)[0]?.avatarUrl ??
    null
  );
}

export function getConversationPresence(
  conversation: ChatConversation,
  currentUserId: string
) {
  const otherParticipants = getOtherParticipants(conversation, currentUserId);
  return {
    isOnline: otherParticipants.some((user) => user.isOnline),
    onlineCount: otherParticipants.filter((user) => user.isOnline).length,
    participantCount: conversation.participants.length,
  };
}
