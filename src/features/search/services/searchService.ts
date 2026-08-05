import { getProfile } from '../../profile/services/profileService';
import { CURRENT_USER_ID } from '../../chat/services/chatService';
import { mockPublicUsers } from '../../users/mocks/userMockData';
import { getCompatibleBuilders } from '../../users/services/builderCompatibilityService';

export type SearchResultType = 'all' | 'user' | 'project';
export type SearchMansioneFilter = 'all' | 'Studente' | 'Lavoratore';
export type SearchPresetKey =
  | 'formingTeams'
  | 'nearbyProjects'
  | 'compatibleBuilders';

export type SearchFilters = {
  type: SearchResultType;
  mansione: SearchMansioneFilter;
  settore: string;
  stato: string;
  citta: string;
  preset: SearchPresetKey | null;
};

export type SearchResult = {
  id: string;
  type: 'user' | 'project';
  title: string;
  subtitle: string;
  mansione: 'Studente' | 'Lavoratore' | null;
  settore: string;
  stato: string;
  citta: string;
  isOnline?: boolean;
  avatarUrl?: string | null;
  builders?: number;
  openRoles?: string[];
};

export type SearchServiceResult<T> = {
  data: T;
  error: string | null;
};

const wait = (milliseconds = 140) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export const emptySearchFilters: SearchFilters = {
  type: 'all',
  mansione: 'all',
  settore: '',
  stato: '',
  citta: '',
  preset: null,
};

export function getPresetSearchState(preset: SearchPresetKey): {
  filters: SearchFilters;
  label: string;
} {
  if (preset === 'formingTeams') {
    return {
      filters: {
        ...emptySearchFilters,
        type: 'project',
        preset,
      },
      label: 'Team in formazione',
    };
  }

  if (preset === 'nearbyProjects') {
    return {
      filters: {
        ...emptySearchFilters,
        type: 'project',
        citta: 'Milano',
        preset,
      },
      label: 'Vicino a te',
    };
  }

  return {
    filters: {
      ...emptySearchFilters,
      type: 'user',
      preset,
    },
    label: 'Builder compatibili',
  };
}

const normalize = (value: string) => value.trim().toLocaleLowerCase();

export async function searchDirectory(
  query: string,
  filters: SearchFilters
): Promise<SearchServiceResult<SearchResult[]>> {
  const { mockProjectDetails } = await import('../../projects/mocks/projectMockData');
  await wait();

  const profileResponse =
    filters.preset === 'compatibleBuilders' ? await getProfile() : null;
  const compatibleBuilderIds = profileResponse?.data
    ? new Set(
        (
          await getCompatibleBuilders(CURRENT_USER_ID, profileResponse.data)
        ).data?.map((user) => user.id) ?? []
      )
    : null;

  const searchResults: SearchResult[] = [
    ...mockPublicUsers.map((user) => ({
      id: user.id,
      type: 'user' as const,
      title: user.displayName,
      subtitle: `${user.ruolo} - ${user.citta}`,
      mansione: user.mansione,
      settore: user.settore,
      stato: user.stato,
      citta: user.citta,
      isOnline: user.isOnline,
      avatarUrl: user.avatarUrl,
    })),
    ...mockProjectDetails.map((project) => ({
      id: project.id,
      type: 'project' as const,
      title: project.nome,
      subtitle: `${project.settore} - ${project.citta}`,
      mansione: null,
      settore: project.settore,
      stato: project.stato,
      citta: project.citta,
      builders: project.builderCount,
      openRoles: project.openRoles,
    })),
  ];

  const normalizedQuery = normalize(query);
  const normalizedSettore = normalize(filters.settore);
  const normalizedStato = normalize(filters.stato);
  const normalizedCitta = normalize(filters.citta);

  const data = searchResults.filter((item) => {
    const searchableText = normalize(
      `${item.title} ${item.subtitle} ${item.settore} ${item.stato} ${item.citta} ${item.mansione ?? ''}`
    );

    const matchesQuery =
      !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesType = filters.type === 'all' || item.type === filters.type;
    const matchesMansione =
      filters.mansione === 'all' ||
      (item.type === 'user' && item.mansione === filters.mansione);
    const matchesSettore =
      !normalizedSettore || normalize(item.settore).includes(normalizedSettore);
    const matchesStato =
      !normalizedStato || normalize(item.stato).includes(normalizedStato);
    const matchesCitta =
      !normalizedCitta || normalize(item.citta).includes(normalizedCitta);
    const matchesPreset =
      !filters.preset ||
      (filters.preset === 'formingTeams' &&
        item.type === 'project' &&
        (item.openRoles?.length ?? 0) > 0) ||
      (filters.preset === 'nearbyProjects' &&
        item.type === 'project' &&
        normalize(item.citta) === 'milano') ||
      (filters.preset === 'compatibleBuilders' &&
        item.type === 'user' &&
        Boolean(compatibleBuilderIds?.has(item.id)));

    return (
      matchesQuery &&
      matchesType &&
      matchesMansione &&
      matchesSettore &&
      matchesStato &&
      matchesCitta &&
      matchesPreset
    );
  });

  return { data, error: null };
}
