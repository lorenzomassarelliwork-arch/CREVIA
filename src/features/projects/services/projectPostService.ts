export type ProjectPostKind = 'update' | 'milestone' | 'hiring';

export type ProjectPost = {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  kind: ProjectPostKind;
  body: string;
  imageUri?: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
};

export type CreateProjectPostInput = {
  projectId: string;
  authorId: string;
  authorName: string;
  kind: ProjectPostKind;
  body: string;
  imageUri?: string | null;
};

export type ProjectPostServiceResult<T> = {
  data: T;
  error: string | null;
};

const wait = (milliseconds = 160) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

let mockProjectPosts: ProjectPost[] = [
  {
    id: 'post-4-1',
    projectId: '4',
    authorId: 'current-user',
    authorName: 'Lorenzo Rossi',
    kind: 'milestone',
    body:
      'Abbiamo chiuso la prima mappa delle feature MVP. Il prossimo step e validare il flusso pagamenti con 5 utenti test.',
    imageUri: null,
    createdAt: new Date('2026-07-10T09:30:00.000Z').toISOString(),
    likeCount: 12,
    commentCount: 3,
  },
  {
    id: 'post-4-2',
    projectId: '4',
    authorId: 'current-user',
    authorName: 'Lorenzo Rossi',
    kind: 'hiring',
    body:
      'Cerchiamo un backend developer interessato a API, pagamenti e sicurezza. Collaborazione iniziale su prototipo.',
    imageUri: null,
    createdAt: new Date('2026-07-08T15:45:00.000Z').toISOString(),
    likeCount: 8,
    commentCount: 1,
  },
  {
    id: 'post-1-1',
    projectId: '1',
    authorId: 'user-marco',
    authorName: 'Marco Rossi',
    kind: 'update',
    body:
      'Stiamo raccogliendo disponibilita per una sessione di product review. Chi vuole partecipare puo scriverci in chat.',
    imageUri: null,
    createdAt: new Date('2026-07-09T12:15:00.000Z').toISOString(),
    likeCount: 18,
    commentCount: 5,
  },
];

const clonePost = (post: ProjectPost): ProjectPost => ({ ...post });

const sortPosts = (posts: ProjectPost[]) =>
  [...posts].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );

export async function listProjectPosts(
  projectId: string
): Promise<ProjectPostServiceResult<ProjectPost[]>> {
  await wait();

  return {
    data: sortPosts(mockProjectPosts.filter((post) => post.projectId === projectId)).map(
      clonePost
    ),
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

  const post: ProjectPost = {
    id: `post_${Date.now()}`,
    projectId: input.projectId,
    authorId: input.authorId,
    authorName: input.authorName,
    kind: input.kind,
    body: trimmedBody,
    imageUri: input.imageUri ?? null,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  mockProjectPosts = [post, ...mockProjectPosts];

  return { data: clonePost(post), error: null };
}

export async function deleteProjectPost(
  postId: string
): Promise<ProjectPostServiceResult<null>> {
  await wait(140);
  mockProjectPosts = mockProjectPosts.filter((post) => post.id !== postId);
  return { data: null, error: null };
}
