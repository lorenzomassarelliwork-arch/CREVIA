import { mockProjectDetails } from '../../projects/mocks/projectMockData';
import { mockPublicUsers } from '../../users/mocks/userMockData';
import type { SearchResult } from '../services/searchService';

export const mockSearchResults: SearchResult[] = [
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
