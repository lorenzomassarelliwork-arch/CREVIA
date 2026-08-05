import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import type { ColorPalette } from '../../../theme/colors';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from '../../../i18n/LocalizedText';
import type { ProfilePost } from '../services/profilePostService';

type ProfilePostCardProps = {
  post: ProfilePost;
  currentUserId: string;
  actionLoading: string | null;
  onToggleLike: (postId: string) => Promise<void> | void;
  onAddComment: (postId: string, body: string) => Promise<boolean>;
  onDeleteComment: (postId: string, commentId: string) => void;
  onOpenEntity?: (entityType: 'user' | 'project', entityId: string) => void;
  onEdit?: (post: ProfilePost) => void;
  onDeletePost?: (postId: string) => void;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

export default function ProfilePostCard({
  post,
  currentUserId,
  actionLoading,
  onToggleLike,
  onAddComment,
  onDeleteComment,
  onOpenEntity,
  onEdit,
  onDeletePost,
}: ProfilePostCardProps) {
  const { colors, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');

  const likeLoading = actionLoading === `${post.id}-like`;
  const deleteLoading = actionLoading === `${post.id}-delete`;
  const commentLoading = actionLoading === `${post.id}-comment`;
  const isPostOwner = post.authorId === currentUserId;

  const submitComment = async () => {
    if (!commentDraft.trim() || commentLoading) return;
    const created = await onAddComment(post.id, commentDraft);
    if (created) setCommentDraft('');
  };

  const formattedDate = new Intl.DateTimeFormat(
    language === 'it' ? 'it-IT' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric' }
  ).format(new Date(post.createdAt));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorTarget}
          activeOpacity={onOpenEntity ? 0.7 : 1}
          disabled={!onOpenEntity}
          onPress={() => onOpenEntity?.('user', post.authorId)}
        >
          {post.authorAvatarUri ? (
            <Image source={{ uri: post.authorAvatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(post.authorName)}</Text>
            </View>
          )}
          <View style={styles.headerCopy}>
            <Text style={styles.author}>{post.authorName}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </TouchableOpacity>
        {isPostOwner && onEdit && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onEdit(post)}
            disabled={actionLoading !== null}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
        {isPostOwner && onDeletePost && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onDeletePost(post.id)}
            disabled={actionLoading !== null}
          >
            {deleteLoading ? (
              <ActivityIndicator size="small" color={colors.delete} />
            ) : (
              <Ionicons name="trash-outline" size={18} color={colors.delete} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
      {post.imageUri ? (
        <Image source={{ uri: post.imageUri }} style={styles.image} />
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.action}
          onPress={() => void onToggleLike(post.id)}
          disabled={actionLoading !== null}
        >
          {likeLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={post.isLikedByCurrentUser ? 'heart' : 'heart-outline'}
              size={18}
              color={post.isLikedByCurrentUser ? colors.delete : colors.gray}
            />
          )}
          <Text style={styles.actionText}>{post.likeCount} Mi piace</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.action}
          onPress={() => setCommentsVisible((current) => !current)}
        >
          <Ionicons name="chatbubble-outline" size={17} color={colors.gray} />
          <Text style={styles.actionText}>
            {post.comments.length} Commenti
          </Text>
        </TouchableOpacity>
      </View>

      {commentsVisible && (
        <View style={styles.commentsSection}>
          {post.comments.map((comment) => {
            const canDelete =
              isPostOwner || comment.authorId === currentUserId;
            const commentDeleteLoading =
              actionLoading === `${post.id}-comment-delete-${comment.id}`;

            return (
              <View key={comment.id} style={styles.commentRow}>
                <TouchableOpacity
                  style={styles.commentAuthorTarget}
                  activeOpacity={onOpenEntity ? 0.7 : 1}
                  disabled={!onOpenEntity}
                  onPress={() =>
                    onOpenEntity?.(comment.authorType, comment.authorId)
                  }
                >
                  {comment.authorAvatarUri ? (
                    <Image
                      source={{ uri: comment.authorAvatarUri }}
                      style={styles.commentAvatar}
                    />
                  ) : (
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {getInitials(comment.authorName)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.commentCopy}>
                    <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                    <Text style={styles.commentBody}>{comment.body}</Text>
                  </View>
                </TouchableOpacity>
                {canDelete && (
                  <TouchableOpacity
                    style={styles.commentDeleteButton}
                    onPress={() => onDeleteComment(post.id, comment.id)}
                    disabled={actionLoading !== null}
                  >
                    {commentDeleteLoading ? (
                      <ActivityIndicator size="small" color={colors.delete} />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color={colors.delete}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Scrivi un commento..."
              placeholderTextColor={colors.gray}
              value={commentDraft}
              onChangeText={setCommentDraft}
              editable={!commentLoading}
              returnKeyType="send"
              onSubmitEditing={() => void submitComment()}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => void submitComment()}
              disabled={commentLoading || !commentDraft.trim()}
            >
              {commentLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={16} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    authorTarget: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
    headerCopy: { flex: 1 },
    author: { color: colors.secondary, fontSize: 14, fontWeight: '800' },
    date: { color: colors.gray, fontSize: 11, marginTop: 2 },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 9,
      backgroundColor: colors.actionSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { color: colors.secondary, fontSize: 14, lineHeight: 21 },
    image: {
      width: '100%',
      height: 180,
      borderRadius: 10,
      backgroundColor: colors.border,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { color: colors.gray, fontSize: 12, fontWeight: '700' },
    commentsSection: { gap: 8 },
    commentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.actionSurface,
    },
    commentAuthorTarget: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentAvatarText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '800',
    },
    commentCopy: { flex: 1 },
    commentAuthor: { color: colors.secondary, fontSize: 12, fontWeight: '800' },
    commentBody: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 2,
    },
    commentDeleteButton: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentComposer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    commentInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 90,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: colors.inputSurface,
      color: colors.textStrong,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 13,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
