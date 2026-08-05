import { getUserAvatarUrl } from '../../users/services/userIdentityService';

export type ProfilePostComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorType: 'user' | 'project';
  authorAvatarUri: string | null;
  body: string;
  createdAt: string;
};

export type ProfilePost = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUri: string | null;
  body: string;
  imageUri: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  isReportedByCurrentUser: boolean;
  comments: ProfilePostComment[];
};

export type ProfilePostInput = {
  body: string;
  imageUri?: string | null;
};

export type ProfilePostServiceResult<T> = {
  data: T | null;
  error: string | null;
};

type StoredProfilePost = Omit<
  ProfilePost,
  'likeCount' | 'isLikedByCurrentUser' | 'isReportedByCurrentUser'
> & {
  likedByUserIds: string[];
  reportedByUserIds: string[];
};

const AVATARS = {
  currentUser: getUserAvatarUrl('current-user'),
  marco: getUserAvatarUrl('user-marco'),
  sara: getUserAvatarUrl('user-sara'),
  luca: getUserAvatarUrl('user-luca'),
  giulia: getUserAvatarUrl('user-giulia'),
  andrea: getUserAvatarUrl('user-andrea'),
} as const;

const wait = (milliseconds = 160) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

let mockProfilePosts: StoredProfilePost[] = [
  {
    id: 'profile-post-1',
    authorId: 'current-user',
    authorName: 'Luca Rossi',
    authorAvatarUri: AVATARS.currentUser,
    body: 'Sto lavorando a nuove idee per prodotti digitali e community di builder.',
    imageUri: null,
    createdAt: new Date('2026-07-12T10:15:00.000Z').toISOString(),
    updatedAt: new Date('2026-07-12T10:15:00.000Z').toISOString(),
    likedByUserIds: ['user-marco', 'user-sara'],
    reportedByUserIds: [],
    comments: [
      {
        id: 'profile-comment-1',
        postId: 'profile-post-1',
        authorId: 'user-marco',
        authorName: 'Marco Rossi',
        authorType: 'user',
        authorAvatarUri: AVATARS.marco,
        body: 'Interessante, teniamoci aggiornati.',
        createdAt: new Date('2026-07-12T12:00:00.000Z').toISOString(),
      },
      {
        id: 'profile-comment-2',
        postId: 'profile-post-1',
        authorId: '1',
        authorName: 'TechStart Milano',
        authorType: 'project',
        authorAvatarUri: null,
        body: 'Tema molto vicino alla nostra community di builder.',
        createdAt: new Date('2026-07-12T13:20:00.000Z').toISOString(),
      },
    ],
  },
  {
    id: 'profile-post-marco-1',
    authorId: 'user-marco',
    authorName: 'Marco Rossi',
    authorAvatarUri: AVATARS.marco,
    body: 'Oggi abbiamo chiuso la navigazione del primo prototipo mobile di TechStart. Prossimo passo: test con utenti reali.',
    imageUri: null,
    createdAt: new Date('2026-07-13T08:40:00.000Z').toISOString(),
    updatedAt: new Date('2026-07-13T08:40:00.000Z').toISOString(),
    likedByUserIds: ['current-user', 'user-sara', 'user-luca'],
    reportedByUserIds: [],
    comments: [
      {
        id: 'profile-comment-marco-1',
        postId: 'profile-post-marco-1',
        authorId: 'current-user',
        authorName: 'Luca Rossi',
        authorType: 'user',
        authorAvatarUri: AVATARS.currentUser,
        body: 'Ottimo avanzamento, sono curioso di vedere il prototipo.',
        createdAt: new Date('2026-07-13T09:10:00.000Z').toISOString(),
      },
    ],
  },
  {
    id: 'profile-post-sara-1',
    authorId: 'user-sara',
    authorName: 'Sara Bianchi',
    authorAvatarUri: AVATARS.sara,
    body: 'Sto preparando una nuova challenge di UX research per DesignHub. Cerco persone disponibili per brevi interviste.',
    imageUri: null,
    createdAt: new Date('2026-07-11T15:20:00.000Z').toISOString(),
    updatedAt: new Date('2026-07-11T15:20:00.000Z').toISOString(),
    likedByUserIds: ['user-marco'],
    reportedByUserIds: [],
    comments: [],
  },
  {
    id: 'profile-post-luca-1',
    authorId: 'user-luca',
    authorName: 'Luca Ferrari',
    authorAvatarUri: AVATARS.luca,
    body: 'Ho pubblicato una prima analisi sulle metriche di retention per prodotti fintech early stage.',
    imageUri: null,
    createdAt: new Date('2026-07-10T11:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-07-10T11:00:00.000Z').toISOString(),
    likedByUserIds: ['current-user'],
    reportedByUserIds: [],
    comments: [],
  },
  {
    id: 'profile-post-giulia-1',
    authorId: 'user-giulia',
    authorName: 'Giulia Marino',
    authorAvatarUri: AVATARS.giulia,
    body: 'Abbiamo raccolto i primi feedback sulla community GreenFuture: il tema più sentito è rendere semplici le azioni sostenibili quotidiane.',
    imageUri: null,
    createdAt: new Date('2026-07-09T17:30:00.000Z').toISOString(),
    updatedAt: new Date('2026-07-09T17:30:00.000Z').toISOString(),
    likedByUserIds: ['user-marco', 'user-sara'],
    reportedByUserIds: [],
    comments: [],
  },
  {
    id: 'profile-post-andrea-1',
    authorId: 'user-andrea',
    authorName: 'Andrea Conti',
    authorAvatarUri: AVATARS.andrea,
    body: 'Nuovo studio di caso in arrivo: dalla validazione rapida al prototipo testabile in cinque giorni.',
    imageUri: null,
    createdAt: new Date('2026-07-08T14:10:00.000Z').toISOString(),
    updatedAt: new Date('2026-07-08T14:10:00.000Z').toISOString(),
    likedByUserIds: [],
    reportedByUserIds: [],
    comments: [],
  },
];

const cloneComment = (comment: ProfilePostComment): ProfilePostComment => ({
  ...comment,
  authorAvatarUri:
    comment.authorType === 'user'
      ? getUserAvatarUrl(comment.authorId) ?? comment.authorAvatarUri
      : comment.authorAvatarUri,
});

const toProfilePost = (
  post: StoredProfilePost,
  currentUserId: string
): ProfilePost => ({
  id: post.id,
  authorId: post.authorId,
  authorName: post.authorName,
  authorAvatarUri: getUserAvatarUrl(post.authorId) ?? post.authorAvatarUri,
  body: post.body,
  imageUri: post.imageUri,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  likeCount: post.likedByUserIds.length,
  isLikedByCurrentUser: post.likedByUserIds.includes(currentUserId),
  isReportedByCurrentUser: post.reportedByUserIds.includes(currentUserId),
  comments: post.comments.map(cloneComment),
});

const sortPosts = (posts: StoredProfilePost[]) =>
  [...posts].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );

const findOwnedPost = (postId: string, userId: string) =>
  mockProfilePosts.find(
    (post) => post.id === postId && post.authorId === userId
  );

export async function listProfilePosts(
  profileUserId: string,
  currentUserId: string = profileUserId
): Promise<ProfilePostServiceResult<ProfilePost[]>> {
  await wait();

  return {
    data: sortPosts(
      mockProfilePosts.filter((post) => post.authorId === profileUserId)
    ).map((post) => toProfilePost(post, currentUserId)),
    error: null,
  };
}

export async function createProfilePost(
  userId: string,
  authorName: string,
  input: ProfilePostInput,
  authorAvatarUri: string | null = null
): Promise<ProfilePostServiceResult<ProfilePost>> {
  await wait(220);

  const body = input.body.trim();
  if (!body && !input.imageUri) {
    return { data: null, error: 'Scrivi un testo o aggiungi un’immagine.' };
  }

  const now = new Date().toISOString();
  const post: StoredProfilePost = {
    id: `profile_post_${Date.now()}`,
    authorId: userId,
    authorName,
    authorAvatarUri,
    body,
    imageUri: input.imageUri ?? null,
    createdAt: now,
    updatedAt: now,
    likedByUserIds: [],
    reportedByUserIds: [],
    comments: [],
  };

  mockProfilePosts = [post, ...mockProfilePosts];
  return { data: toProfilePost(post, userId), error: null };
}

export async function updateProfilePost(
  postId: string,
  userId: string,
  input: ProfilePostInput
): Promise<ProfilePostServiceResult<ProfilePost>> {
  await wait(180);

  const post = findOwnedPost(postId, userId);
  if (!post) return { data: null, error: 'Post non trovato.' };

  const body = input.body.trim();
  if (!body && !input.imageUri) {
    return { data: null, error: 'Scrivi un testo o aggiungi un’immagine.' };
  }

  post.body = body;
  post.imageUri = input.imageUri ?? null;
  post.updatedAt = new Date().toISOString();

  return { data: toProfilePost(post, userId), error: null };
}

export async function deleteProfilePost(
  postId: string,
  userId: string
): Promise<ProfilePostServiceResult<null>> {
  await wait(140);

  const post = findOwnedPost(postId, userId);
  if (!post) return { data: null, error: 'Post non trovato.' };

  mockProfilePosts = mockProfilePosts.filter((item) => item.id !== postId);
  return { data: null, error: null };
}

export async function toggleProfilePostLike(
  postId: string,
  userId: string
): Promise<ProfilePostServiceResult<ProfilePost>> {
  await wait(100);

  const post = mockProfilePosts.find((item) => item.id === postId);
  if (!post) return { data: null, error: 'Post non trovato.' };

  const hasLiked = post.likedByUserIds.includes(userId);
  post.likedByUserIds = hasLiked
    ? post.likedByUserIds.filter((id) => id !== userId)
    : [...post.likedByUserIds, userId];

  return { data: toProfilePost(post, userId), error: null };
}

export async function addProfilePostComment(
  postId: string,
  authorId: string,
  authorName: string,
  body: string,
  authorAvatarUri: string | null = null,
  authorType: 'user' | 'project' = 'user'
): Promise<ProfilePostServiceResult<ProfilePost>> {
  await wait(140);

  const post = mockProfilePosts.find((item) => item.id === postId);
  const trimmedBody = body.trim();
  if (!post) return { data: null, error: 'Post non trovato.' };
  if (!trimmedBody) return { data: null, error: 'Scrivi un commento.' };

  post.comments.push({
    id: `profile_comment_${Date.now()}`,
    postId,
    authorId,
    authorName,
    authorType,
    authorAvatarUri,
    body: trimmedBody,
    createdAt: new Date().toISOString(),
  });

  return { data: toProfilePost(post, authorId), error: null };
}

export async function reportProfilePost(
  postId: string,
  userId: string
): Promise<ProfilePostServiceResult<ProfilePost>> {
  await wait(120);

  const post = mockProfilePosts.find((item) => item.id === postId);
  if (!post) return { data: null, error: 'Post non trovato.' };
  if (post.authorId === userId) {
    return { data: null, error: 'Non puoi segnalare un tuo post.' };
  }

  if (!post.reportedByUserIds.includes(userId)) {
    post.reportedByUserIds = [...post.reportedByUserIds, userId];
  }

  return { data: toProfilePost(post, userId), error: null };
}

export async function deleteProfilePostComment(
  postId: string,
  commentId: string,
  userId: string
): Promise<ProfilePostServiceResult<ProfilePost>> {
  await wait(100);

  const post = mockProfilePosts.find((item) => item.id === postId);
  if (!post) return { data: null, error: 'Post non trovato.' };

  const comment = post.comments.find((item) => item.id === commentId);
  const canDeleteComment =
    comment && (comment.authorId === userId || post.authorId === userId);
  if (!canDeleteComment) {
    return { data: null, error: 'Commento non trovato.' };
  }

  post.comments = post.comments.filter((item) => item.id !== commentId);
  return { data: toProfilePost(post, userId), error: null };
}
