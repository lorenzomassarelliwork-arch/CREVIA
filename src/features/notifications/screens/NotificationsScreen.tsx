import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chatService } from '../../chat/services/chatService';
import { setBuilderConnection } from '../../users/services/userService';
import type { RootStackParamList } from '../../../navigation/types';
import type { ColorPalette } from '../../../theme/colors';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { LocalizedText as Text } from '../../../i18n/LocalizedText';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  resolveNotification,
  respondToConnectionRequest,
  type NotificationAction,
  type NotificationCategory,
  type NotificationItem,
  type NotificationType,
} from '../services/notificationService';

type NotificationsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Notifications'
>;

type IconName = ComponentProps<typeof Ionicons>['name'];

const FILTERS: { key: NotificationCategory; label: string }[] = [
  { key: 'all', label: 'Tutte' },
  { key: 'requests', label: 'Richieste' },
  { key: 'suggestions', label: 'Suggerimenti' },
  { key: 'projects', label: 'Progetti' },
];

const TYPE_ICONS: Record<NotificationType, IconName> = {
  connection_request: 'person-add-outline',
  message_request: 'mail-unread-outline',
  project_message_request: 'chatbubbles-outline',
  crevia_suggestion: 'sparkles-outline',
  project_invite: 'business-outline',
  project_activity: 'rocket-outline',
  system: 'shield-checkmark-outline',
};

const formatRelativeTime = (isoDate: string) => {
  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(isoDate).getTime()) / 60000)
  );

  if (diffMinutes < 60) return `${diffMinutes} min fa`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h fa`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} g fa`;
};

export default function NotificationsScreen({
  navigation,
}: NotificationsScreenProps) {
  const { colors, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const [selectedCategory, setSelectedCategory] =
    useState<NotificationCategory>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (category = selectedCategory, refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      const response = await listNotifications(category);
      setNotifications(response.data ?? []);
      setLoading(false);
      setRefreshing(false);
    },
    [selectedCategory]
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const refreshCurrentCategory = async () => {
    await loadNotifications(selectedCategory, true);
  };

  const selectCategory = (category: NotificationCategory) => {
    setSelectedCategory(category);
    void loadNotifications(category);
  };

  const markAllRead = async () => {
    void triggerHaptic();
    await markAllNotificationsAsRead();
    await loadNotifications(selectedCategory);
  };

  const openProfile = async (notification: NotificationItem) => {
    if (!notification.actor) return;
    await markNotificationAsRead(notification.id);
    navigation.navigate('PublicUserProfile', {
      userId: notification.actor.id,
      connectionRequestId:
        notification.type === 'connection_request' &&
        notification.status !== 'actioned'
          ? notification.id
          : undefined,
    });
  };

  const openProject = async (notification: NotificationItem) => {
    if (!notification.project) return;
    await markNotificationAsRead(notification.id);
    navigation.navigate('ProjectDetail', { projectId: notification.project.id });
  };

  const openChat = async (notification: NotificationItem) => {
    if (notification.conversationId) {
      await markNotificationAsRead(notification.id);
      navigation.navigate('Conversation', {
        conversationId: notification.conversationId,
      });
      return;
    }

    if (!notification.actor) return;
    const conversation = await chatService.createDirectConversation(
      notification.actor.id
    );
    await resolveNotification(notification.id);
    navigation.navigate('Conversation', { conversationId: conversation.id });
  };

  const runAction = async (
    notification: NotificationItem,
    action: NotificationAction
  ) => {
    void triggerHaptic();
    setActionLoading(`${notification.id}-${action.kind}`);

    try {
      if (action.kind === 'accept_connection' && notification.actor) {
        await setBuilderConnection(notification.actor.id, true);
        await respondToConnectionRequest(notification.id, 'accepted');
      } else if (action.kind === 'decline_connection') {
        await respondToConnectionRequest(notification.id, 'declined');
      } else if (action.kind === 'view_profile') {
        await openProfile(notification);
        return;
      } else if (action.kind === 'view_project') {
        await openProject(notification);
        return;
      } else if (action.kind === 'accept_message' || action.kind === 'open_chat') {
        await openChat(notification);
        return;
      } else if (action.kind === 'ignore_message' || action.kind === 'dismiss') {
        await resolveNotification(notification.id);
      }

      await loadNotifications(selectedCategory);
    } catch (error) {
      Alert.alert(
        'Azione non riuscita',
        error instanceof Error
          ? error.message
          : 'Non e stato possibile completare questa azione.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openNotification = async (notification: NotificationItem) => {
    if (notification.actor) {
      await openProfile(notification);
      return;
    }
    if (notification.project) {
      await openProject(notification);
      return;
    }
    await markNotificationAsRead(notification.id);
    await loadNotifications(selectedCategory);
  };

  const renderNotification = (notification: NotificationItem) => {
    const isUnread = notification.status === 'new';

    return (
      <TouchableOpacity
        key={notification.id}
        activeOpacity={0.78}
        style={[
          styles.notificationCard,
          isUnread && styles.notificationCardUnread,
        ]}
        onPress={() => void openNotification(notification)}
      >
        <View style={styles.notificationTop}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={TYPE_ICONS[notification.type]}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.notificationCopy}>
            <View style={styles.titleRow}>
              <Text numberOfLines={2} style={styles.notificationTitle}>
                {notification.title}
              </Text>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationTime}>
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </View>
        </View>

        <Text style={styles.notificationBody}>{notification.body}</Text>

        {(notification.actor || notification.project) && (
          <View style={styles.contextRow}>
            <Text numberOfLines={1} style={styles.contextText}>
              {notification.actor
                ? `${notification.actor.ruolo} - ${notification.actor.citta}`
                : `${notification.project?.settore} - ${notification.project?.citta}`}
            </Text>
          </View>
        )}

        {notification.actions.length > 0 && (
          <View style={styles.actionsRow}>
            {notification.actions.map((action) => {
              const isLoading =
                actionLoading === `${notification.id}-${action.kind}`;
              return (
                <TouchableOpacity
                  key={action.kind}
                  disabled={actionLoading !== null}
                  style={[
                    styles.actionButton,
                    action.variant === 'primary' && styles.actionButtonPrimary,
                    action.variant === 'danger' && styles.actionButtonDanger,
                  ]}
                  onPress={() => void runAction(notification, action)}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        action.variant === 'primary'
                          ? colors.white
                          : colors.primary
                      }
                    />
                  ) : (
                    <Text
                      style={[
                        styles.actionText,
                        action.variant === 'primary' && styles.actionTextPrimary,
                        action.variant === 'danger' && styles.actionTextDanger,
                      ]}
                    >
                      {action.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textStrong} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifiche</Text>
        <TouchableOpacity style={styles.headerButton} onPress={markAllRead}>
          <Ionicons name="checkmark-done" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshCurrentCategory()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filter) => {
            const selected = selectedCategory === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterButton, selected && styles.filterSelected]}
                onPress={() => selectCategory(filter.key)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-outline"
              size={42}
              color={colors.gray}
            />
            <Text style={styles.emptyTitle}>Nessuna notifica</Text>
            <Text style={styles.emptyText}>
              Qui troverai richieste, suggerimenti e aggiornamenti dai progetti.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>{notifications.map(renderNotification)}</View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (
  colors: ColorPalette,
  topInset: number,
  bottomInset: number
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Math.max(topInset, 24) + 14,
      paddingBottom: 15,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    scroll: {
      padding: 20,
      gap: 14,
      paddingBottom: 88 + Math.max(bottomInset, 10),
    },
    filterRow: { gap: 8, paddingRight: 20 },
    filterButton: {
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    filterSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
    filterTextSelected: { color: colors.white },
    centerState: {
      minHeight: 360,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      minHeight: 360,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 28,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.secondary,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.gray,
      textAlign: 'center',
      lineHeight: 20,
    },
    list: { gap: 12 },
    notificationCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    notificationCardUnread: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    notificationTop: { flexDirection: 'row', gap: 12 },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    notificationCopy: { flex: 1, gap: 3 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    notificationTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.secondary,
      lineHeight: 20,
    },
    unreadDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.primary,
      marginTop: 5,
    },
    notificationTime: { fontSize: 12, color: colors.gray, fontWeight: '600' },
    notificationBody: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
    contextRow: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.actionSurface,
    },
    contextText: { fontSize: 12, color: colors.secondary, fontWeight: '700' },
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    actionButton: {
      minWidth: 82,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    actionButtonDanger: {
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerSoft,
    },
    actionText: { fontSize: 13, fontWeight: 'bold', color: colors.primary },
    actionTextPrimary: { color: colors.white },
    actionTextDanger: { color: colors.delete },
  });
