import type {
  ChatConversation,
  ChatMessage,
  ChatRealtimeEvent,
  ChatService,
  CreateGroupConversationInput,
  ConversationDetails,
  ConversationPage,
  ListPageOptions,
  MediaPage,
  MessagePage,
  SendMessageInput,
  SearchChatUsersOptions,
} from '../types';

export const CURRENT_USER_ID = 'current-user';

const currentUser = {
  id: CURRENT_USER_ID,
  displayName: 'Lorenzo Rossi',
  role: 'Sviluppatore Mobile',
  avatarUrl: null,
  isOnline: true,
};

const marco = {
  id: 'user-marco',
  displayName: 'Marco Rossi',
  role: 'Sviluppatore',
  avatarUrl: null,
  isOnline: true,
};

const sara = {
  id: 'user-sara',
  displayName: 'Sara Bianchi',
  role: 'UX Designer',
  avatarUrl: null,
  isOnline: false,
};

const luca = {
  id: 'user-luca',
  displayName: 'Luca Ferrari',
  role: 'Data Analyst',
  avatarUrl: null,
  isOnline: false,
};

const chatUserDirectory = [
  marco,
  sara,
  luca,
  {
    id: 'user-giulia',
    displayName: 'Giulia Marino',
    role: 'Marketing Specialist',
    avatarUrl: null,
    isOnline: true,
  },
  {
    id: 'user-andrea',
    displayName: 'Andrea Conti',
    role: 'Product Designer',
    avatarUrl: null,
    isOnline: false,
  },
  {
    id: 'user-elisa',
    displayName: 'Elisa Romano',
    role: 'Project Manager',
    avatarUrl: null,
    isOnline: true,
  },
  {
    id: 'user-davide',
    displayName: 'Davide Greco',
    role: 'Backend Developer',
    avatarUrl: null,
    isOnline: false,
  },
];

const now = Date.now();
const minutesAgo = (minutes: number) =>
  new Date(now - minutes * 60 * 1000).toISOString();

const createMessage = (
  message: Omit<ChatMessage, 'attachments' | 'replyTo' | 'reactions'> &
    Partial<Pick<ChatMessage, 'attachments' | 'replyTo' | 'reactions'>>
): ChatMessage => ({
  attachments: [],
  replyTo: null,
  reactions: [],
  ...message,
});

const initialMessages: ChatMessage[] = [
  createMessage({
    id: 'message-1',
    conversationId: 'conversation-1',
    senderId: marco.id,
    text: 'Ciao! Ho visto il tuo profilo, ti andrebbe di sentirci per il progetto?',
    sentAt: minutesAgo(25),
    status: 'read',
  }),
  createMessage({
    id: 'message-2',
    conversationId: 'conversation-1',
    senderId: CURRENT_USER_ID,
    text: 'Volentieri, il progetto sembra molto interessante.',
    sentAt: minutesAgo(18),
    status: 'read',
    reactions: [{ emoji: '👍', userIds: [marco.id] }],
  }),
  createMessage({
    id: 'message-3',
    conversationId: 'conversation-1',
    senderId: marco.id,
    text: 'Perfetto! Ti mando qui i prossimi dettagli.',
    sentAt: minutesAgo(4),
    status: 'delivered',
    replyTo: {
      messageId: 'message-2',
      senderId: CURRENT_USER_ID,
      text: 'Volentieri, il progetto sembra molto interessante.',
      attachmentKind: null,
    },
  }),
  createMessage({
    id: 'message-4',
    conversationId: 'conversation-2',
    senderId: sara.id,
    text: 'Grazie per il collegamento! Ho dato un’occhiata al tuo progetto.',
    sentAt: minutesAgo(72),
    status: 'delivered',
  }),
  createMessage({
    id: 'message-5',
    conversationId: 'conversation-3',
    senderId: CURRENT_USER_ID,
    text: 'Ci aggiorniamo domani con il resto del team.',
    sentAt: minutesAgo(26 * 60),
    status: 'read',
  }),
  createMessage({
    id: 'message-6',
    conversationId: 'conversation-4',
    senderId: sara.id,
    text: 'Ho aggiunto le ultime modifiche alla presentazione.',
    sentAt: minutesAgo(38),
    status: 'delivered',
  }),
];

let messages = [...initialMessages];

let conversations: ChatConversation[] = [
  {
    id: 'conversation-1',
    kind: 'direct',
    title: null,
    avatarUrl: null,
    participants: [currentUser, marco],
    mainUserIds: [],
    currentUserHasLeft: false,
    blockedUserIds: [],
    reportedUserIds: [],
    lastMessage: initialMessages[2],
    unreadCount: 2,
    updatedAt: initialMessages[2].sentAt,
  },
  {
    id: 'conversation-2',
    kind: 'direct',
    title: null,
    avatarUrl: null,
    participants: [currentUser, sara],
    mainUserIds: [],
    currentUserHasLeft: false,
    blockedUserIds: [],
    reportedUserIds: [],
    lastMessage: initialMessages[3],
    unreadCount: 1,
    updatedAt: initialMessages[3].sentAt,
  },
  {
    id: 'conversation-3',
    kind: 'direct',
    title: null,
    avatarUrl: null,
    participants: [currentUser, luca],
    mainUserIds: [],
    currentUserHasLeft: false,
    blockedUserIds: [],
    reportedUserIds: [],
    lastMessage: initialMessages[4],
    unreadCount: 0,
    updatedAt: initialMessages[4].sentAt,
  },
  {
    id: 'conversation-4',
    kind: 'group',
    title: 'Team TechStart',
    avatarUrl: null,
    participants: [currentUser, marco, sara, luca],
    mainUserIds: [CURRENT_USER_ID],
    currentUserHasLeft: false,
    blockedUserIds: [],
    reportedUserIds: [],
    lastMessage: initialMessages[5],
    unreadCount: 3,
    updatedAt: initialMessages[5].sentAt,
  },
];

const listeners = new Map<string, Set<(event: ChatRealtimeEvent) => void>>();

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new Error('Request aborted');
}

function emit(conversationId: string, event: ChatRealtimeEvent) {
  listeners.get(conversationId)?.forEach((listener) => listener(event));
}

function storeMessage(message: ChatMessage) {
  const existingIndex = messages.findIndex((item) => item.id === message.id);
  messages =
    existingIndex >= 0
      ? messages.map((item) => (item.id === message.id ? message : item))
      : [...messages, message];

  conversations = conversations.map((conversation) =>
    conversation.id !== message.conversationId
      ? conversation
      : !conversation.lastMessage ||
          conversation.lastMessage.id === message.id ||
          new Date(message.sentAt).getTime() >= new Date(conversation.updatedAt).getTime()
        ? { ...conversation, lastMessage: message, updatedAt: message.sentAt }
        : conversation
  );
}

function getGroupConversation(conversationId: string) {
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation || conversation.kind !== 'group') {
    throw new Error('Group conversation not found');
  }
  return conversation;
}

function replaceConversation(updated: ChatConversation) {
  conversations = conversations.map((conversation) =>
    conversation.id === updated.id ? updated : conversation
  );
  return updated;
}

function scheduleStatusUpdate(message: ChatMessage) {
  const updateStatus = (status: ChatMessage['status']) => {
    const stored = messages.find((item) => item.id === message.id);
    if (!stored) return;

    const updated = { ...stored, status };
    storeMessage(updated);
    emit(message.conversationId, { type: 'message.updated', message: updated });
  };

  setTimeout(() => updateStatus('delivered'), 700);
  setTimeout(() => updateStatus('read'), 1700);
}

const mockChatService: ChatService = {
  async searchUsers(options: SearchChatUsersOptions) {
    await wait(120);
    const normalizedQuery = options.query.trim().toLocaleLowerCase();
    const directParticipantIds = new Set(
      conversations
        .filter((conversation) => conversation.kind === 'direct')
        .flatMap((conversation) => conversation.participants.map((user) => user.id))
    );
    const excludedConversationParticipantIds = new Set(
      conversations
        .find(
          (conversation) => conversation.id === options.excludeConversationId
        )
        ?.participants.map((user) => user.id) ?? []
    );

    return chatUserDirectory.filter((user) => {
      const matchesQuery = `${user.displayName} ${user.role}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
      const isAlreadyInDirectConversation = directParticipantIds.has(user.id);
      return (
        matchesQuery &&
        (!options.excludeExistingDirectConversations ||
          !isAlreadyInDirectConversation) &&
        !excludedConversationParticipantIds.has(user.id)
      );
    });
  },

  async createDirectConversation(userId: string) {
    const existingConversation = conversations.find(
      (conversation) =>
        conversation.kind === 'direct' &&
        conversation.participants.some((participant) => participant.id === userId)
    );
    if (existingConversation) return existingConversation;

    const participant = chatUserDirectory.find((user) => user.id === userId);
    if (!participant) throw new Error('User not found');

    const createdAt = new Date().toISOString();
    const conversation: ChatConversation = {
      id: `conversation-${Date.now()}`,
      kind: 'direct',
      title: null,
      avatarUrl: null,
      participants: [currentUser, participant],
      mainUserIds: [],
      currentUserHasLeft: false,
      blockedUserIds: [],
      reportedUserIds: [],
      lastMessage: null,
      unreadCount: 0,
      updatedAt: createdAt,
    };
    conversations = [conversation, ...conversations];
    return conversation;
  },

  async createGroupConversation(input: CreateGroupConversationInput) {
    const participantIds = Array.from(new Set(input.participantIds));
    if (!input.title.trim()) throw new Error('Group title is required');
    if (participantIds.length < 2) throw new Error('Select at least two users');

    const participants = participantIds.map((id) => {
      const participant = chatUserDirectory.find((user) => user.id === id);
      if (!participant) throw new Error('User not found');
      return participant;
    });
    const createdAt = new Date().toISOString();
    const conversation: ChatConversation = {
      id: `conversation-${Date.now()}`,
      kind: 'group',
      title: input.title.trim(),
      avatarUrl: null,
      participants: [currentUser, ...participants],
      mainUserIds: [CURRENT_USER_ID],
      currentUserHasLeft: false,
      blockedUserIds: [],
      reportedUserIds: [],
      lastMessage: null,
      unreadCount: 0,
      updatedAt: createdAt,
    };
    conversations = [conversation, ...conversations];
    return conversation;
  },

  async updateGroupImage(conversationId: string, avatarUrl: string) {
    const conversation = getGroupConversation(conversationId);
    if (conversation.currentUserHasLeft) throw new Error('You left this group');
    return replaceConversation({ ...conversation, avatarUrl });
  },

  async setGroupMain(
    conversationId: string,
    userId: string,
    isMain: boolean
  ) {
    const conversation = getGroupConversation(conversationId);
    if (
      conversation.currentUserHasLeft ||
      !conversation.mainUserIds.includes(CURRENT_USER_ID)
    ) {
      throw new Error('Only a Main can manage other Main users');
    }
    if (!conversation.participants.some((participant) => participant.id === userId)) {
      throw new Error('Participant not found');
    }
    if (userId === CURRENT_USER_ID) throw new Error('Cannot change your own role');

    const mainUserIds = isMain
      ? Array.from(new Set([...conversation.mainUserIds, userId]))
      : conversation.mainUserIds.filter((id) => id !== userId);
    return replaceConversation({ ...conversation, mainUserIds });
  },

  async addGroupParticipants(conversationId: string, userIds: string[]) {
    const conversation = getGroupConversation(conversationId);
    if (
      conversation.currentUserHasLeft ||
      !conversation.mainUserIds.includes(CURRENT_USER_ID)
    ) {
      throw new Error('Only a Main can add participants');
    }

    const existingIds = new Set(
      conversation.participants.map((participant) => participant.id)
    );
    const participantsToAdd = Array.from(new Set(userIds))
      .filter((userId) => !existingIds.has(userId))
      .map((userId) => {
        const participant = chatUserDirectory.find((user) => user.id === userId);
        if (!participant) throw new Error('User not found');
        return participant;
      });
    if (participantsToAdd.length === 0) return conversation;

    return replaceConversation({
      ...conversation,
      participants: [...conversation.participants, ...participantsToAdd],
    });
  },

  async removeGroupParticipant(conversationId: string, userId: string) {
    const conversation = getGroupConversation(conversationId);
    if (
      conversation.currentUserHasLeft ||
      !conversation.mainUserIds.includes(CURRENT_USER_ID)
    ) {
      throw new Error('Only a Main can remove participants');
    }
    if (userId === CURRENT_USER_ID) {
      throw new Error('Use leaveGroup to remove the current user');
    }
    if (!conversation.participants.some((participant) => participant.id === userId)) {
      throw new Error('Participant not found');
    }

    return replaceConversation({
      ...conversation,
      participants: conversation.participants.filter(
        (participant) => participant.id !== userId
      ),
      mainUserIds: conversation.mainUserIds.filter((id) => id !== userId),
    });
  },

  async leaveGroup(conversationId: string) {
    const conversation = getGroupConversation(conversationId);
    if (conversation.currentUserHasLeft) return conversation;

    let mainUserIds = conversation.mainUserIds.filter(
      (userId) => userId !== CURRENT_USER_ID
    );
    if (mainUserIds.length === 0) {
      const nextMain = conversation.participants.find(
        (participant) => participant.id !== CURRENT_USER_ID
      );
      if (nextMain) mainUserIds = [nextMain.id];
    }

    return replaceConversation({
      ...conversation,
      currentUserHasLeft: true,
      mainUserIds,
      unreadCount: 0,
    });
  },

  async deleteConversation(conversationId: string) {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;
    if (conversation.kind === 'group' && !conversation.currentUserHasLeft) {
      throw new Error('Leave the group before deleting the chat');
    }
    conversations = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );
    messages = messages.filter(
      (message) => message.conversationId !== conversationId
    );
    listeners.delete(conversationId);
  },

  async setUserBlocked(
    conversationId: string,
    userId: string,
    isBlocked: boolean
  ) {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation || conversation.kind !== 'direct') {
      throw new Error('Direct conversation not found');
    }
    if (!conversation.participants.some((participant) => participant.id === userId)) {
      throw new Error('User not found');
    }

    const blockedUserIds = isBlocked
      ? Array.from(new Set([...conversation.blockedUserIds, userId]))
      : conversation.blockedUserIds.filter((id) => id !== userId);
    return replaceConversation({ ...conversation, blockedUserIds });
  },

  async reportUser(conversationId: string, userId: string) {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation || conversation.kind !== 'direct') {
      throw new Error('Direct conversation not found');
    }
    if (!conversation.participants.some((participant) => participant.id === userId)) {
      throw new Error('User not found');
    }

    return replaceConversation({
      ...conversation,
      reportedUserIds: Array.from(
        new Set([...conversation.reportedUserIds, userId])
      ),
    });
  },

  async listConversationMedia(
    conversationId: string,
    options: ListPageOptions = {}
  ): Promise<MediaPage> {
    throwIfAborted(options.signal);
    if (!conversations.some((conversation) => conversation.id === conversationId)) {
      throw new Error('Conversation not found');
    }

    return {
      items: messages
        .filter((message) => message.conversationId === conversationId)
        .flatMap((message) =>
          message.attachments.map((attachment) => ({
            messageId: message.id,
            senderId: message.senderId,
            sentAt: message.sentAt,
            attachment,
          }))
        )
        .sort(
          (left, right) =>
            new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime()
        ),
      nextCursor: null,
    };
  },

  async listConversations(
    options: ListPageOptions = {}
  ): Promise<ConversationPage> {
    throwIfAborted(options.signal);
    return {
      items: [...conversations].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      ),
      nextCursor: null,
    };
  },

  async getConversation(
    conversationId: string,
    options: ListPageOptions = {}
  ): Promise<ConversationDetails> {
    throwIfAborted(options.signal);
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');

    return {
      conversation,
      messages: messages
        .filter((message) => message.conversationId === conversationId)
        .sort(
          (left, right) =>
            new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime()
        ),
    };
  },

  async listMessages(
    conversationId: string,
    options: ListPageOptions = {}
  ): Promise<MessagePage> {
    throwIfAborted(options.signal);
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');

    return {
      items: messages
        .filter((message) => message.conversationId === conversationId)
        .sort(
          (left, right) =>
            new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime()
        ),
      nextCursor: null,
    };
  },

  async sendMessage(
    conversationId: string,
    input: SendMessageInput
  ): Promise<ChatMessage> {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');
    if (conversation.currentUserHasLeft) throw new Error('You left this group');
    if (conversation.kind === 'direct' && conversation.blockedUserIds.length > 0) {
      throw new Error('User is blocked');
    }
    if (!input.text.trim() && input.attachments.length === 0) {
      throw new Error('Message is empty');
    }

    await wait(250);
    const message: ChatMessage = {
      id: input.clientMessageId,
      conversationId,
      senderId: CURRENT_USER_ID,
      text: input.text.trim(),
      attachments: input.attachments,
      replyTo: input.replyTo,
      reactions: [],
      sentAt: new Date().toISOString(),
      status: 'sent',
    };

    storeMessage(message);
    emit(conversationId, { type: 'message.updated', message });
    scheduleStatusUpdate(message);
    return message;
  },

  async toggleReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<ChatMessage> {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');
    if (conversation.currentUserHasLeft) throw new Error('You left this group');
    if (conversation.kind === 'direct' && conversation.blockedUserIds.length > 0) {
      throw new Error('User is blocked');
    }

    const message = messages.find(
      (item) => item.id === messageId && item.conversationId === conversationId
    );
    if (!message) throw new Error('Message not found');

    const currentReaction = message.reactions.find((reaction) => reaction.emoji === emoji);
    const hasReacted = currentReaction?.userIds.includes(CURRENT_USER_ID) ?? false;
    const reactions = currentReaction
      ? message.reactions
          .map((reaction) =>
            reaction.emoji === emoji
              ? {
                  ...reaction,
                  userIds: hasReacted
                    ? reaction.userIds.filter((id) => id !== CURRENT_USER_ID)
                    : [...reaction.userIds, CURRENT_USER_ID],
                }
              : reaction
          )
          .filter((reaction) => reaction.userIds.length > 0)
      : [...message.reactions, { emoji, userIds: [CURRENT_USER_ID] }];

    const updated = { ...message, reactions };
    storeMessage(updated);
    emit(conversationId, { type: 'message.updated', message: updated });
    return updated;
  },

  async markConversationAsRead(conversationId: string): Promise<void> {
    conversations = conversations.map((item) =>
      item.id === conversationId ? { ...item, unreadCount: 0 } : item
    );
  },

  subscribeToConversation(conversationId, listener) {
    const conversationListeners = listeners.get(conversationId) ?? new Set();
    conversationListeners.add(listener);
    listeners.set(conversationId, conversationListeners);

    const otherUser = conversations
      .find((item) => item.id === conversationId)
      ?.participants.find((user) => user.id !== CURRENT_USER_ID);
    const typingStart = setTimeout(() => {
      if (otherUser) {
        emit(conversationId, {
          type: 'typing.changed',
          conversationId,
          userId: otherUser.id,
          isTyping: true,
        });
      }
    }, 1200);
    const typingStop = setTimeout(() => {
      if (otherUser) {
        emit(conversationId, {
          type: 'typing.changed',
          conversationId,
          userId: otherUser.id,
          isTyping: false,
        });
      }
    }, 3600);

    return () => {
      clearTimeout(typingStart);
      clearTimeout(typingStop);
      conversationListeners.delete(listener);
      if (conversationListeners.size === 0) listeners.delete(conversationId);
    };
  },
};

// Punto unico di sostituzione: collega qui l'adapter HTTP/WebSocket del backend.
export const chatService: ChatService = mockChatService;
