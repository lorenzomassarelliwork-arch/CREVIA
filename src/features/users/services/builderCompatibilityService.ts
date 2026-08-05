import { getProfile, type Profile } from '../../profile/services/profileService';
import { mockPublicUsers } from '../mocks/userMockData';
import type { PublicUserProfile } from './userService';

export type CompatibilityProfile = Pick<Profile, 'citta' | 'settore'>;

export type BuilderCompatibilityResult = {
  data: PublicUserProfile[] | null;
  error: string | null;
};

const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const cloneUser = (user: PublicUserProfile): PublicUserProfile => ({
  ...user,
  progetti: [...user.progetti],
  esperienze: [...user.esperienze],
});

export function selectCompatibleBuilders(
  users: PublicUserProfile[],
  profile: CompatibilityProfile
): PublicUserProfile[] {
  const userCity = normalize(profile.citta);
  const userSector = normalize(profile.settore);

  if (!userCity && !userSector) return [];

  const exactMatches = users.filter(
    (user) =>
      Boolean(userCity) &&
      Boolean(userSector) &&
      normalize(user.citta) === userCity &&
      normalize(user.settore) === userSector
  );

  if (exactMatches.length > 0) return exactMatches;

  return users.filter(
    (user) =>
      (Boolean(userCity) && normalize(user.citta) === userCity) ||
      (Boolean(userSector) && normalize(user.settore) === userSector)
  );
}

export async function getCompatibleBuilders(
  userId: string,
  profile?: CompatibilityProfile
): Promise<BuilderCompatibilityResult> {
  void userId;

  const profileResponse = profile ? null : await getProfile();
  const resolvedProfile = profile ?? profileResponse?.data;
  if (!resolvedProfile) {
    return { data: [], error: profileResponse?.error ?? null };
  }

  return {
    data: selectCompatibleBuilders(mockPublicUsers, resolvedProfile).map(cloneUser),
    error: null,
  };
}
