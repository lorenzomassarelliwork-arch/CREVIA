export type ChatUser = {
  id: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  isOnline: boolean;
};

export type ChatMessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

type ChatAttachmentBase = {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number | null;
};

export type ChatImageAttachment = ChatAttachmentBase & {
  kind: 'image';
  width: number;
  height: number;
};

export type ChatAudioAttachment = ChatAttachmentBase & {
  kind: 'audio';
  durationMs: number;
};

export type ChatDocumentAttachment = ChatAttachmentBase & {
  kind: 'document';
};

export type ChatAttachment =
  | ChatImageAttachment
  | ChatAudioAttachment
  | ChatDocumentAttachment;

export type ChatReplyPreview = {
  messageId: string;
  senderId: string;
  text: string;
  attachmentKind: ChatAttachment['kind'] | null;
};

export type ChatReaction = {
  emoji: string;
  userIds: string[];
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments: ChatAttachment[];
  replyTo: ChatReplyPreview | null;
  reactions: ChatReaction[];
  sentAt: string;
  status: ChatMessageStatus;
};

export type ChatConversation = {
  id: string;
  kind: 'direct' | 'group';
  title: string | null;
  avatarUrl: string | null;
  participants: ChatUser[];
  mainUserIds: string[];
  currentUserHasLeft: boolean;
  blockedUserIds: string[];
  reportedUserIds: string[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
};

export type ConversationDetails = {
  conversation: ChatConversation;
  messages: ChatMessage[];
};

export type ConversationPage = {
  items: ChatConversation[];
  nextCursor: string | null;
};

export type MessagePage = {
  items: ChatMessage[];
  nextCursor: string | null;
};

export type ChatMediaItem = {
  messageId: string;
  senderId: string;
  sentAt: string;
  attachment: ChatAttachment;
};

export type MediaPage = {
  items: ChatMediaItem[];
  nextCursor: string | null;
};

export type ListPageOptions = {
  cursor?: string;
  signal?: AbortSignal;
};

export type SendMessageInput = {
  clientMessageId: string;
  text: string;
  attachments: ChatAttachment[];
  replyTo: ChatReplyPreview | null;
};

export type SearchChatUsersOptions = {
  query: string;
  excludeExistingDirectConversations?: boolean;
  excludeConversationId?: string;
};

export type CreateGroupConversationInput = {
  title: string;
  participantIds: string[];
};

export type ChatRealtimeEvent =
  | { type: 'message.received'; message: ChatMessage }
  | { type: 'message.updated'; message: ChatMessage }
  | {
      type: 'typing.changed';
      conversationId: string;
      userId: string;
      isTyping: boolean;
    };

export interface ChatService {
  searchUsers(options: SearchChatUsersOptions): Promise<ChatUser[]>;
  createDirectConversation(userId: string): Promise<ChatConversation>;
  createGroupConversation(
    input: CreateGroupConversationInput
  ): Promise<ChatConversation>;
  updateGroupImage(
    conversationId: string,
    avatarUrl: string
  ): Promise<ChatConversation>;
  setGroupMain(
    conversationId: string,
    userId: string,
    isMain: boolean
  ): Promise<ChatConversation>;
  addGroupParticipants(
    conversationId: string,
    userIds: string[]
  ): Promise<ChatConversation>;
  removeGroupParticipant(
    conversationId: string,
    userId: string
  ): Promise<ChatConversation>;
  leaveGroup(conversationId: string): Promise<ChatConversation>;
  deleteConversation(conversationId: string): Promise<void>;
  setUserBlocked(
    conversationId: string,
    userId: string,
    isBlocked: boolean
  ): Promise<ChatConversation>;
  reportUser(conversationId: string, userId: string): Promise<ChatConversation>;
  listConversationMedia(
    conversationId: string,
    options?: ListPageOptions
  ): Promise<MediaPage>;
  listConversations(options?: ListPageOptions): Promise<ConversationPage>;
  getConversation(
    conversationId: string,
    options?: ListPageOptions
  ): Promise<ConversationDetails>;
  listMessages(
    conversationId: string,
    options?: ListPageOptions
  ): Promise<MessagePage>;
  sendMessage(
    conversationId: string,
    input: SendMessageInput
  ): Promise<ChatMessage>;
  toggleReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<ChatMessage>;
  markConversationAsRead(conversationId: string): Promise<void>;
  subscribeToConversation(
    conversationId: string,
    listener: (event: ChatRealtimeEvent) => void
  ): () => void;
}
