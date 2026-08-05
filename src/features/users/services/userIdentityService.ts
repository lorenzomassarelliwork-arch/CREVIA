export type UserIdentity = {
  id: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  isOnline: boolean;
};

const initialIdentities: UserIdentity[] = [
  {
    id: 'current-user',
    displayName: 'Luca Rossi',
    role: 'Founder',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  },
  {
    id: 'user-marco',
    displayName: 'Marco Rossi',
    role: 'Sviluppatore Frontend',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  },
  {
    id: 'user-sara',
    displayName: 'Sara Bianchi',
    role: 'UX Designer',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    isOnline: false,
  },
  {
    id: 'user-luca',
    displayName: 'Luca Ferrari',
    role: 'Data Analyst',
    avatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    isOnline: false,
  },
  {
    id: 'user-giulia',
    displayName: 'Giulia Marino',
    role: 'Marketing Specialist',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  },
  {
    id: 'user-andrea',
    displayName: 'Andrea Conti',
    role: 'Product Designer',
    avatarUrl:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=200&q=80',
    isOnline: false,
  },
  {
    id: 'user-elisa',
    displayName: 'Elisa Romano',
    role: 'Project Manager',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    isOnline: true,
  },
  {
    id: 'user-davide',
    displayName: 'Davide Greco',
    role: 'Backend Developer',
    avatarUrl:
      'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=200&q=80',
    isOnline: false,
  },
];

const identities = new Map(
  initialIdentities.map((identity) => [identity.id, { ...identity }])
);

// Mock repository centralizzato. Con il backend manterra la stessa interfaccia,
// sostituendo la Map con i dati restituiti dalle API o dalla cache utente.
export function getUserIdentity(userId: string): UserIdentity | null {
  const identity = identities.get(userId);
  return identity ? { ...identity } : null;
}

export function getUserAvatarUrl(userId: string): string | null {
  return identities.get(userId)?.avatarUrl ?? null;
}

export function listUserIdentities(): UserIdentity[] {
  return [...identities.values()].map((identity) => ({ ...identity }));
}

export function updateUserIdentity(
  userId: string,
  changes: Partial<Omit<UserIdentity, 'id'>>
): UserIdentity | null {
  const current = identities.get(userId);
  if (!current) return null;
  const updated = { ...current, ...changes };
  identities.set(userId, updated);
  return { ...updated };
}
