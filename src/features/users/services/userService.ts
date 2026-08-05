import { getUserAvatarUrl } from './userIdentityService';

export type PublicUserExperience = {
  id: string;
  titolo: string;
  progetto: string;
  periodo: string;
};

export type PublicUserProfile = {
  id: string;
  nome: string;
  cognome: string;
  displayName: string;
  mansione: 'Studente' | 'Lavoratore';
  ruolo: string;
  settore: string;
  stato: string;
  citta: string;
  bio: string;
  avatarUrl: string | null;
  isOnline: boolean;
  isBuilder: boolean;
  collegamenti: number;
  seguaci: number;
  progetti: string[];
  esperienze: PublicUserExperience[];
};

export type UserServiceResult<T> = {
  data: T | null;
  error: string | null;
};

const wait = (milliseconds = 180) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const clonePublicUser = (user: PublicUserProfile): PublicUserProfile => ({
  ...user,
  avatarUrl: getUserAvatarUrl(user.id) ?? user.avatarUrl,
  esperienze: [...user.esperienze],
  progetti: [...user.progetti],
});

export async function getPublicUserProfile(
  userId: string
): Promise<UserServiceResult<PublicUserProfile>> {
  const { mockPublicUsers } = await import('../mocks/userMockData');
  await wait();

  const user = mockPublicUsers.find((item) => item.id === userId);
  return user
    ? { data: clonePublicUser(user), error: null }
    : { data: null, error: 'Utente non trovato' };
}

export async function setBuilderConnection(
  userId: string,
  isBuilder: boolean
): Promise<UserServiceResult<PublicUserProfile>> {
  const { mockPublicUsers } = await import('../mocks/userMockData');
  await wait(140);

  const user = mockPublicUsers.find((item) => item.id === userId);
  if (!user) return { data: null, error: 'Utente non trovato' };

  user.isBuilder = isBuilder;
  user.collegamenti += isBuilder ? 1 : -1;

  return { data: clonePublicUser(user), error: null };
}

export async function reportPublicUser(
  userId: string
): Promise<UserServiceResult<{ userId: string }>> {
  await wait(120);
  return { data: { userId }, error: null };
}
