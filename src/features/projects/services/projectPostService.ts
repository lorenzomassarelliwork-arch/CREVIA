import { CURRENT_USER_ID } from '../../chat/services/chatService';
import { getUserAvatarUrl } from '../../users/services/userIdentityService';

export type ProjectPostKind = 'update' | 'milestone' | 'hiring';

export type ProjectPostComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorType: 'user' | 'project';
  authorAvatarUri: string | null;
  body: string;
  createdAt: string;
};

export type ProjectPost = {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  authorAvatarUri: string | null;
  kind: ProjectPostKind;
  body: string;
  imageUri?: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser: boolean;
  isReportedByCurrentUser: boolean;
  comments: ProjectPostComment[];
};

export type CreateProjectPostInput = {
  projectId: string;
  authorId: string;
  authorName: string;
  authorAvatarUri?: string | null;
  kind: ProjectPostKind;
  body: string;
  imageUri?: string | null;
};

export type ProjectPostServiceResult<T> = {
  data: T;
  error: string | null;
};

type StoredProjectPost = Omit<
  ProjectPost,
  | 'likeCount'
  | 'commentCount'
  | 'isLikedByCurrentUser'
  | 'isReportedByCurrentUser'
> & {
  baseLikeCount: number;
  likedByUserIds: string[];
  reportedByUserIds: string[];
};

const AVATARS = {
  currentUser: getUserAvatarUrl(CURRENT_USER_ID),
  marco: getUserAvatarUrl('user-marco'),
  sara: getUserAvatarUrl('user-sara'),
} as const;

const wait = (milliseconds = 160) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

let mockProjectPosts: StoredProjectPost[] = [
  {
    id: 'post-4-1',
    projectId: '4',
    authorId: CURRENT_USER_ID,
    authorName: 'Lorenzo Rossi',
    authorAvatarUri: AVATARS.currentUser,
    kind: 'milestone',
    body:
      'Abbiamo chiuso la prima mappa delle feature MVP. Il prossimo step e validare il flusso pagamenti con 5 utenti test.',
    imageUri: null,
    createdAt: new Date('2026-07-10T09:30:00.000Z').toISOString(),
    baseLikeCount: 11,
    likedByUserIds: ['user-marco'],
    reportedByUserIds: [],
    comments: [
      {
        id: 'project-comment-4-1',
        postId: 'post-4-1',
        authorId: 'user-marco',
        authorName: 'Marco Rossi',
        authorType: 'user',
        authorAvatarUri: AVATARS.marco,
        body: 'Ottimo, posso partecipare a uno dei test.',
        createdAt: new Date('2026-07-10T10:10:00.000Z').toISOString(),
      },
    ],
  },
  {
    id: 'post-4-2',
    projectId: '4',
    authorId: CURRENT_USER_ID,
    authorName: 'Lorenzo Rossi',
    authorAvatarUri: AVATARS.currentUser,
    kind: 'hiring',
    body:
      'Cerchiamo un backend developer interessato a API, pagamenti e sicurezza. Collaborazione iniziale su prototipo.',
    imageUri: null,
    createdAt: new Date('2026-07-08T15:45:00.000Z').toISOString(),
    baseLikeCount: 8,
    likedByUserIds: [],
    reportedByUserIds: [],
    comments: [],
  },
  {
    id: 'post-1-1',
    projectId: '1',
    authorId: 'user-marco',
    authorName: 'Marco Rossi',
    authorAvatarUri: AVATARS.marco,
    kind: 'update',
    body:
      'Stiamo raccogliendo disponibilita per una sessione di product review. Chi vuole partecipare puo scriverci in chat.',
    imageUri: null,
    createdAt: new Date('2026-07-09T12:15:00.000Z').toISOString(),
    baseLikeCount: 17,
    likedByUserIds: [CURRENT_USER_ID],
    reportedByUserIds: [],
    comments: [
      {
        id: 'project-comment-1-1',
        postId: 'post-1-1',
        authorId: 'user-sara',
        authorName: 'Sara Bianchi',
        authorType: 'user',
        authorAvatarUri: AVATARS.sara,
        body: 'Ci sono, mandatemi pure i dettagli.',
        createdAt: new Date('2026-07-09T13:05:00.000Z').toISOString(),
      },
    ],
  },
];

const cloneComment = (comment: ProjectPostComment): ProjectPostComment => ({
  ...comment,
  authorAvatarUri:
    comment.authorType === 'user'
      ? getUserAvatarUrl(comment.authorId) ?? comment.authorAvatarUri
      : comment.authorAvatarUri,
});

const toProjectPost = (
  post: StoredProjectPost,
  currentUserId: string
): ProjectPost => ({
  id: post.id,
  projectId: post.projectId,
  authorId: post.authorId,
  authorName: post.authorName,
  authorAvatarUri: getUserAvatarUrl(post.authorId) ?? post.authorAvatarUri,
  kind: post.kind,
  body: post.body,
  imageUri: post.imageUri,
  createdAt: post.createdAt,
  likeCount: post.baseLikeCount + post.likedByUserIds.length,
  commentCount: post.comments.length,
  isLikedByCurrentUser: post.likedByUserIds.includes(currentUserId),
  isReportedByCurrentUser: post.reportedByUserIds.includes(currentUserId),
  comments: post.comments.map(cloneComment),
});

const sortPosts = (posts: StoredProjectPost[]) =>
  [...posts].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );

const findPost = (postId: string) =>
  mockProjectPosts.find((post) => post.id === postId);

export async function listProjectPosts(
  projectId: string,
  currentUserId: string = CURRENT_USER_ID
): Promise<ProjectPostServiceResult<ProjectPost[]>> {
  await wait();
  return {
    data: sortPosts(
      mockProjectPosts.filter((post) => post.projectId === projectId)
    ).map((post) => toProjectPost(post, currentUserId)),
    error: null,
  };
}

export async function createProjectPost(
  input: CreateProjectPostInput
): Promise<ProjectPostServiceResult<ProjectPost | null>> {
  await wait(220);
  const trimmedBody = input.body.trim();
  if (!trimmedBody && !input.imageUri) {
    return { data: null, error: 'Scrivi un testo o aggiungi un immagine.' };
  }

  const post: StoredProjectPost = {
    id: `post_${Date.now()}`,
    projectId: input.projectId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorAvatarUri: input.authorAvatarUri ?? null,
    kind: input.kind,
    body: trimmedBody,
    imageUri: input.imageUri ?? null,
    createdAt: new Date().toISOString(),
    baseLikeCount: 0,
    likedByUserIds: [],
    reportedByUserIds: [],
    comments: [],
  };

  mockProjectPosts = [post, ...mockProjectPosts];
  return { data: toProjectPost(post, input.authorId), error: null };
}

export async function toggleProjectPostLike(
  postId: string,
  userId: string
): Promise<ProjectPostServiceResult<ProjectPost | null>> {
  await wait(100);
  const post = findPost(postId);
  if (!post) return { data: null, error: 'Post non trovato.' };

  post.likedByUserIds = post.likedByUserIds.includes(userId)
    ? post.likedByUserIds.filter((id) => id !== userId)
    : [...post.likedByUserIds, userId];
  return { data: toProjectPost(post, userId), error: null };
}

export async function addProjectPostComment(
  postId: string,
  authorId: string,
  authorName: string,
  body: string,
  authorAvatarUri: string | null = null,
  authorType: 'user' | 'project' = 'user'
): Promise<ProjectPostServiceResult<ProjectPost | null>> {
  await wait(140);
  const post = findPost(postId);
  const trimmedBody = body.trim();
  if (!post) return { data: null, error: 'Post non trovato.' };
  if (!trimmedBody) return { data: null, error: 'Scrivi un commento.' };

  post.comments.push({
    id: `project_comment_${Date.now()}`,
    postId,
    authorId,
    authorName,
    authorType,
    authorAvatarUri,
    body: trimmedBody,
    createdAt: new Date().toISOString(),
  });
  return { data: toProjectPost(post, authorId), error: null };
}

export async function reportProjectPost(
  postId: string,
  userId: string
): Promise<ProjectPostServiceResult<ProjectPost | null>> {
  await wait(120);
  const post = findPost(postId);
  if (!post) return { data: null, error: 'Post non trovato.' };
  if (post.authorId === userId) {
    return { data: null, error: 'Non puoi segnalare un tuo post.' };
  }

  if (!post.reportedByUserIds.includes(userId)) {
    post.reportedByUserIds = [...post.reportedByUserIds, userId];
  }
  return { data: toProjectPost(post, userId), error: null };
}

export async function deleteProjectPostComment(
  postId: string,
  commentId: string,
  userId: string
): Promise<ProjectPostServiceResult<ProjectPost | null>> {
  await wait(100);
  const post = findPost(postId);
  if (!post) return { data: null, error: 'Post non trovato.' };

  const comment = post.comments.find((item) => item.id === commentId);
  if (!comment || (comment.authorId !== userId && post.authorId !== userId)) {
    return { data: null, error: 'Non puoi eliminare questo commento.' };
  }

  post.comments = post.comments.filter((item) => item.id !== commentId);
  return { data: toProjectPost(post, userId), error: null };
}

export async function deleteProjectPost(
  postId: string
): Promise<ProjectPostServiceResult<null>> {
  await wait(140);
  mockProjectPosts = mockProjectPosts.filter((post) => post.id !== postId);
  return { data: null, error: null };
}
