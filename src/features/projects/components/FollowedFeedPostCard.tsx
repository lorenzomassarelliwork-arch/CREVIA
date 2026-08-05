import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from '../../../i18n/LocalizedText';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import type { ColorPalette } from '../../../theme/colors';
import type { FollowedFeedPost } from '../services/followedFeedService';

type FollowedFeedPostCardProps = {
  post: FollowedFeedPost;
  currentUserId: string;
  actionLoading: string | null;
  onToggleLike: (post: FollowedFeedPost) => Promise<void> | void;
  onAddComment: (post: FollowedFeedPost, body: string) => Promise<boolean>;
  onDeleteComment: (post: FollowedFeedPost, commentId: string) => void;
  onReport: (post: FollowedFeedPost) => Promise<boolean>;
  onOpenEntity: (entityType: 'user' | 'project', entityId: string) => void;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

export default function FollowedFeedPostCard({
  post,
  currentUserId,
  actionLoading,
  onToggleLike,
  onAddComment,
  onDeleteComment,
  onReport,
  onOpenEntity,
}: FollowedFeedPostCardProps) {
  const { colors, language } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const likeLoading = actionLoading === `${post.id}-like`;
  const commentLoading = actionLoading === `${post.id}-comment`;
  const reportLoading = actionLoading === `${post.id}-report`;
  const canReport = post.authorId !== currentUserId;

  const formattedDate = new Intl.DateTimeFormat(
    language === 'it' ? 'it-IT' : 'en-US',
    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
  ).format(new Date(post.createdAt));

  const submitComment = async () => {
    if (!commentDraft.trim() || commentLoading) return;
    const created = await onAddComment(post, commentDraft);
    if (created) {
      setCommentDraft('');
      setCommentsVisible(true);
    }
  };

  const confirmReport = () => {
    setMenuVisible(false);
    Alert.alert(
      'Segnalare questo post?',
      'La segnalazione verrà inviata al team di Crevia per una verifica.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Segnala',
          style: 'destructive',
          onPress: () => void onReport(post),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.sourceTarget}
          activeOpacity={0.7}
          onPress={() => onOpenEntity(post.sourceType, post.sourceId)}
        >
          {post.sourceAvatarUri ? (
            <Image source={{ uri: post.sourceAvatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(post.sourceName)}</Text>
            </View>
          )}
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.sourceName}>
              {post.sourceName}
            </Text>
            <Text style={styles.meta}>
              {post.sourceType === 'project' ? 'Pagina progetto' : 'Profilo'} ·{' '}
              {formattedDate}
            </Text>
          </View>
        </TouchableOpacity>

        {canReport && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setMenuVisible(true)}
            disabled={actionLoading !== null || post.isReportedByCurrentUser}
          >
            {reportLoading ? (
              <ActivityIndicator size="small" color={colors.gray} />
            ) : (
              <Ionicons
                name="ellipsis-horizontal"
                size={21}
                color={post.isReportedByCurrentUser ? colors.disabled : colors.gray}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
      {post.imageUri ? (
        <Image source={{ uri: post.imageUri }} style={styles.postImage} />
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.action}
          onPress={() => void onToggleLike(post)}
          disabled={actionLoading !== null}
        >
          {likeLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={post.isLikedByCurrentUser ? 'heart' : 'heart-outline'}
              size={19}
              color={post.isLikedByCurrentUser ? colors.delete : colors.gray}
            />
          )}
          <Text style={styles.actionText}>{post.likeCount} Mi piace</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.action}
          onPress={() => setCommentsVisible((current) => !current)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.gray} />
          <Text style={styles.actionText}>{post.comments.length} Commenti</Text>
        </TouchableOpacity>
      </View>

      {commentsVisible && (
        <View style={styles.commentsSection}>
          {post.comments.length === 0 && (
            <Text style={styles.noComments}>Nessun commento. Scrivi il primo.</Text>
          )}
          {post.comments.map((comment) => {
            const canDelete =
              comment.authorId === currentUserId || post.authorId === currentUserId;
            const deleteLoading =
              actionLoading === `${post.id}-comment-delete-${comment.id}`;

            return (
              <View key={comment.id} style={styles.commentRow}>
                <TouchableOpacity
                  style={styles.commentTarget}
                  activeOpacity={0.7}
                  onPress={() =>
                    onOpenEntity(comment.authorType, comment.authorId)
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
                    style={styles.deleteCommentButton}
                    disabled={actionLoading !== null}
                    onPress={() => onDeleteComment(post, comment.id)}
                  >
                    {deleteLoading ? (
                      <ActivityIndicator size="small" color={colors.delete} />
                    ) : (
                      <Ionicons name="trash-outline" size={15} color={colors.delete} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <View style={styles.composer}>
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
              disabled={commentLoading || !commentDraft.trim()}
              onPress={() => void submitComment()}
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

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menu} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.menuTitle}>Azioni sul post</Text>
            <TouchableOpacity
              style={styles.menuAction}
              onPress={confirmReport}
              disabled={post.isReportedByCurrentUser}
            >
              <Ionicons name="flag-outline" size={20} color={colors.delete} />
              <View style={styles.menuCopy}>
                <Text style={styles.menuActionTitle}>
                  {post.isReportedByCurrentUser ? 'Post già segnalato' : 'Segnala post'}
                </Text>
                <Text style={styles.menuActionText}>
                  Contenuto offensivo, spam o non conforme.
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.cancelText}>Annulla</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sourceTarget: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
    headerCopy: { flex: 1 },
    sourceName: { color: colors.secondary, fontSize: 14, fontWeight: '800' },
    meta: { color: colors.gray, fontSize: 11, marginTop: 2 },
    moreButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { color: colors.secondary, fontSize: 14, lineHeight: 21 },
    postImage: {
      width: '100%',
      height: 190,
      borderRadius: 11,
      backgroundColor: colors.border,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 11,
    },
    action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { color: colors.gray, fontSize: 12, fontWeight: '700' },
    commentsSection: { gap: 9 },
    noComments: { color: colors.gray, fontSize: 12 },
    commentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      padding: 10,
      borderRadius: 11,
      backgroundColor: colors.actionSurface,
    },
    commentTarget: {
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
    commentAvatarText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
    commentCopy: { flex: 1 },
    commentAuthor: { color: colors.secondary, fontSize: 12, fontWeight: '800' },
    commentBody: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 2 },
    deleteCommentButton: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    composer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
      padding: 18,
    },
    menu: {
      backgroundColor: colors.cardBackground,
      borderRadius: 18,
      padding: 18,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuTitle: { color: colors.secondary, fontSize: 17, fontWeight: '800' },
    menuAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 13,
      borderRadius: 12,
      backgroundColor: colors.dangerSoft,
    },
    menuCopy: { flex: 1 },
    menuActionTitle: { color: colors.delete, fontSize: 14, fontWeight: '800' },
    menuActionText: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    cancelButton: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 11,
      backgroundColor: colors.actionSurface,
    },
    cancelText: { color: colors.secondary, fontSize: 14, fontWeight: '700' },
  });
