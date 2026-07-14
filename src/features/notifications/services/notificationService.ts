import type { ProjectDetail } from '../../projects/services/projectDetailService';
import type { PublicUserProfile } from '../../users/services/userService';

export type NotificationType =
  | 'connection_request'
  | 'message_request'
  | 'project_message_request'
  | 'crevia_suggestion'
  | 'project_invite'
  | 'project_activity'
  | 'system';

export type NotificationStatus = 'new' | 'read' | 'actioned' | 'archived';

export type NotificationCategory = 'all' | 'requests' | 'suggestions' | 'projects';

export type NotificationActor = Pick<
  PublicUserProfile,
  'id' | 'displayName' | 'ruolo' | 'settore' | 'citta' | 'avatarUrl' | 'isOnline'
>;

export type NotificationProject = Pick<
  ProjectDetail,
  'id' | 'nome' | 'settore' | 'citta' | 'openRoles'
>;

export type NotificationActionKind =
  | 'accept_connection'
  | 'decline_connection'
  | 'accept_message'
  | 'ignore_message'
  | 'view_profile'
  | 'view_project'
  | 'open_chat'
  | 'dismiss';

export type NotificationAction = {
  kind: NotificationActionKind;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  category: Exclude<NotificationCategory, 'all'>;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  status: NotificationStatus;
  actor: NotificationActor | null;
  project: NotificationProject | null;
  conversationId: string | null;
  actions: NotificationAction[];
};

export type NotificationInboxSummary = {
  unreadCount: number;
  pendingConnectionRequests: number;
  pendingMessageRequests: number;
};

export type NotificationServiceResult<T> = {
  data: T | null;
  error: string | null;
};

const wait = (milliseconds = 160) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const now = Date.now();
const minutesAgo = (minutes: number) =>
  new Date(now - minutes * 60 * 1000).toISOString();

const cloneActor = (actor: NotificationActor | null) =>
  actor ? { ...actor } : null;

const cloneProject = (project: NotificationProject | null) =>
  project ? { ...project, openRoles: [...project.openRoles] } : null;

const cloneNotification = (notification: NotificationItem): NotificationItem => ({
  ...notification,
  actor: cloneActor(notification.actor),
  project: cloneProject(notification.project),
  actions: notification.actions.map((action) => ({ ...action })),
});

const getActor = async (userId: string): Promise<NotificationActor | null> => {
  const { mockPublicUsers } = await import('../../users/mocks/userMockData');
  const user = mockPublicUsers.find((item) => item.id === userId);
  if (!user) return null;

  return {
    id: user.id,
    displayName: user.displayName,
    ruolo: user.ruolo,
    settore: user.settore,
    citta: user.citta,
    avatarUrl: user.avatarUrl,
    isOnline: user.isOnline,
  };
};

const getProject = async (
  projectId: string
): Promise<NotificationProject | null> => {
  const { mockProjectDetails } = await import('../../projects/mocks/projectMockData');
  const project = mockProjectDetails.find((item) => item.id === projectId);
  if (!project) return null;

  return {
    id: project.id,
    nome: project.nome,
    settore: project.settore,
    citta: project.citta,
    openRoles: [...project.openRoles],
  };
};

let notifications: NotificationItem[] | null = null;

async function ensureNotifications() {
  if (notifications) return notifications;

  const [marco, sara, luca, giulia, projectOne, projectThree, projectFour] =
    await Promise.all([
      getActor('user-marco'),
      getActor('user-sara'),
      getActor('user-luca'),
      getActor('user-giulia'),
      getProject('1'),
      getProject('3'),
      getProject('4'),
    ]);

  notifications = [
    {
      id: 'notification-connection-marco',
      type: 'connection_request',
      category: 'requests',
      title: 'Marco vuole collegarsi con te',
      body: 'Ha visto il tuo profilo e vuole aggiungerti alla sua rete di builder.',
      createdAt: minutesAgo(18),
      readAt: null,
      status: 'new',
      actor: marco,
      project: null,
      conversationId: null,
      actions: [
        { kind: 'accept_connection', label: 'Accetta', variant: 'primary' },
        { kind: 'decline_connection', label: 'Rifiuta', variant: 'secondary' },
        { kind: 'view_profile', label: 'Profilo', variant: 'secondary' },
      ],
    },
    {
      id: 'notification-message-sara',
      type: 'message_request',
      category: 'requests',
      title: 'Nuova richiesta messaggio',
      body: 'Sara vorrebbe chiederti un parere su una UX per onboarding mobile.',
      createdAt: minutesAgo(46),
      readAt: null,
      status: 'new',
      actor: sara,
      project: null,
      conversationId: null,
      actions: [
        { kind: 'accept_message', label: 'Accetta', variant: 'primary' },
        { kind: 'ignore_message', label: 'Ignora', variant: 'secondary' },
        { kind: 'view_profile', label: 'Profilo', variant: 'secondary' },
      ],
    },
    {
      id: 'notification-project-message-techstart',
      type: 'project_message_request',
      category: 'projects',
      title: 'TechStart Milano ti ha scritto',
      body: 'Il team cerca un profilo mobile per chiudere il primo prototipo.',
      createdAt: minutesAgo(120),
      readAt: minutesAgo(118),
      status: 'read',
      actor: null,
      project: projectOne,
      conversationId: 'conversation-4',
      actions: [
        { kind: 'open_chat', label: 'Apri chat', variant: 'primary' },
        { kind: 'view_project', label: 'Progetto', variant: 'secondary' },
      ],
    },
    {
      id: 'notification-suggestion-luca',
      type: 'crevia_suggestion',
      category: 'suggestions',
      title: 'Builder compatibile suggerito',
      body: 'Luca lavora su metriche fintech e potrebbe completare bene il tuo team.',
      createdAt: minutesAgo(260),
      readAt: null,
      status: 'new',
      actor: luca,
      project: null,
      conversationId: null,
      actions: [
        { kind: 'view_profile', label: 'Vedi profilo', variant: 'primary' },
        { kind: 'dismiss', label: 'Nascondi', variant: 'secondary' },
      ],
    },
    {
      id: 'notification-project-invite-designhub',
      type: 'project_invite',
      category: 'projects',
      title: 'Invito a collaborare',
      body: 'DesignHub ha un ruolo aperto coerente con il tuo profilo.',
      createdAt: minutesAgo(360),
      readAt: null,
      status: 'new',
      actor: giulia,
      project: projectThree,
      conversationId: null,
      actions: [
        { kind: 'view_project', label: 'Apri progetto', variant: 'primary' },
        { kind: 'dismiss', label: 'Non ora', variant: 'secondary' },
      ],
    },
    {
      id: 'notification-project-activity-finlab',
      type: 'project_activity',
      category: 'projects',
      title: 'Aggiornamento da un progetto seguito',
      body: 'FinLab ha pubblicato nuove posizioni nel team prodotto.',
      createdAt: minutesAgo(720),
      readAt: minutesAgo(700),
      status: 'read',
      actor: null,
      project: projectFour,
      conversationId: null,
      actions: [{ kind: 'view_project', label: 'Dettagli', variant: 'primary' }],
    },
    {
      id: 'notification-system-profile',
      type: 'system',
      category: 'suggestions',
      title: 'Completa il tuo profilo builder',
      body: 'Aggiungi disponibilita e competenze per ricevere suggerimenti piu precisi.',
      createdAt: minutesAgo(980),
      readAt: minutesAgo(960),
      status: 'read',
      actor: null,
      project: null,
      conversationId: null,
      actions: [{ kind: 'dismiss', label: 'Ok', variant: 'secondary' }],
    },
  ];

  return notifications;
}

const summarize = (items: NotificationItem[]): NotificationInboxSummary => ({
  unreadCount: items.filter((item) => item.status === 'new').length,
  pendingConnectionRequests: items.filter(
    (item) => item.type === 'connection_request' && item.status !== 'actioned'
  ).length,
  pendingMessageRequests: items.filter(
    (item) =>
      (item.type === 'message_request' || item.type === 'project_message_request') &&
      item.status !== 'actioned'
  ).length,
});

export async function getNotificationInboxSummary(): Promise<
  NotificationServiceResult<NotificationInboxSummary>
> {
  await wait(80);
  const items = await ensureNotifications();
  return { data: summarize(items), error: null };
}

export async function listNotifications(
  category: NotificationCategory = 'all'
): Promise<NotificationServiceResult<NotificationItem[]>> {
  await wait();
  const items = await ensureNotifications();
  const filtered =
    category === 'all'
      ? items
      : items.filter((notification) => notification.category === category);

  return {
    data: filtered
      .slice()
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
      .map(cloneNotification),
    error: null,
  };
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<NotificationServiceResult<NotificationItem>> {
  await wait(80);
  const items = await ensureNotifications();
  const notification = items.find((item) => item.id === notificationId);
  if (!notification) return { data: null, error: 'Notifica non trovata' };

  if (notification.status === 'new') {
    notification.status = 'read';
    notification.readAt = new Date().toISOString();
  }

  return { data: cloneNotification(notification), error: null };
}

export async function markAllNotificationsAsRead(): Promise<
  NotificationServiceResult<NotificationInboxSummary>
> {
  await wait(120);
  const items = await ensureNotifications();
  const readAt = new Date().toISOString();
  items.forEach((notification) => {
    if (notification.status === 'new') {
      notification.status = 'read';
      notification.readAt = readAt;
    }
  });

  return { data: summarize(items), error: null };
}

export async function respondToConnectionRequest(
  notificationId: string,
  response: 'accepted' | 'declined'
): Promise<NotificationServiceResult<NotificationItem>> {
  await wait(140);
  const items = await ensureNotifications();
  const notification = items.find((item) => item.id === notificationId);
  if (!notification || notification.type !== 'connection_request') {
    return { data: null, error: 'Richiesta non trovata' };
  }

  notification.status = 'actioned';
  notification.readAt = notification.readAt ?? new Date().toISOString();
  notification.title =
    response === 'accepted'
      ? 'Richiesta di collegamento accettata'
      : 'Richiesta di collegamento rifiutata';
  notification.body =
    response === 'accepted'
      ? `${notification.actor?.displayName ?? 'Il builder'} ora fa parte dei tuoi collegamenti.`
      : `Hai rifiutato la richiesta di ${notification.actor?.displayName ?? 'questo builder'}.`;
  notification.actions =
    response === 'accepted'
      ? [{ kind: 'view_profile', label: 'Vedi profilo', variant: 'secondary' }]
      : [];

  return { data: cloneNotification(notification), error: null };
}

export async function resolveNotification(
  notificationId: string
): Promise<NotificationServiceResult<NotificationItem>> {
  await wait(100);
  const items = await ensureNotifications();
  const notification = items.find((item) => item.id === notificationId);
  if (!notification) return { data: null, error: 'Notifica non trovata' };

  notification.status = 'actioned';
  notification.readAt = notification.readAt ?? new Date().toISOString();
  notification.actions = [];

  return { data: cloneNotification(notification), error: null };
}

// Punto unico di sostituzione: collega qui REST, WebSocket o push bridge backend.
