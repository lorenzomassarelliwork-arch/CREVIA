import { mockProjectDetails } from '../mocks/projectMockData';
import { CURRENT_USER_ID } from '../../chat/services/chatService';
import {
  getSavedProjectIds,
  setProjectSaved as persistProjectSaved,
} from './savedProjectService';

export type ProjectMembershipStatus = 'none' | 'pending' | 'member' | 'founder' | 'admin';

export type ProjectDetail = {
  id: string;
  nome: string;
  settore: string;
  stato: string;
  citta: string;
  descrizione: string;
  coverImage?: string | null;
  founderId: string;
  founderName: string;
  memberIds: string[];
  followerCount: number;
  builderCount: number;
  isFollowing: boolean;
  isSaved: boolean;
  membershipStatus: ProjectMembershipStatus;
  openRoles: string[];
  updates: string[];
};

export type ProjectServiceResult<T> = {
  data: T | null;
  error: string | null;
};

type ProfileProjectInput = {
  id?: string;
  nome: string;
  settore: string;
  stato: string;
  citta: string;
  descrizione: string;
  foto?: string | null;
  openRoles: string[];
};

type FounderInput = {
  id?: string;
  nome: string;
};

const wait = (milliseconds = 180) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const cloneProject = (project: ProjectDetail): ProjectDetail => ({
  ...project,
  memberIds: [...project.memberIds],
  openRoles: [...project.openRoles],
  updates: [...project.updates],
});

const cloneProjectForCurrentUser = async (
  project: ProjectDetail
): Promise<ProjectDetail> => {
  const savedProjectIds = await getSavedProjectIds(CURRENT_USER_ID);
  return cloneProject({
    ...project,
    isSaved: savedProjectIds.includes(project.id),
  });
};

export async function getProjectDetail(
  projectId: string
): Promise<ProjectServiceResult<ProjectDetail>> {
  await wait();

  const project = mockProjectDetails.find((item) => item.id === projectId);
  if (!project) return { data: null, error: 'Progetto non trovato' };

  return {
    data: await cloneProjectForCurrentUser(project),
    error: null,
  };
}

export async function requestProjectJoin(
  projectId: string
): Promise<ProjectServiceResult<ProjectDetail>> {
  await wait(160);

  const project = mockProjectDetails.find((item) => item.id === projectId);
  if (!project) return { data: null, error: 'Progetto non trovato' };

  if (project.membershipStatus === 'none') {
    project.membershipStatus = 'pending';
  }

  return { data: await cloneProjectForCurrentUser(project), error: null };
}

export async function leaveProject(
  projectId: string,
  userId: string
): Promise<ProjectServiceResult<ProjectDetail>> {
  await wait(160);

  const project = mockProjectDetails.find((item) => item.id === projectId);
  if (!project) return { data: null, error: 'Progetto non trovato' };

  if (project.membershipStatus !== 'member') {
    return { data: await cloneProjectForCurrentUser(project), error: null };
  }

  project.membershipStatus = 'none';
  project.memberIds = project.memberIds.filter((memberId) => memberId !== userId);
  project.builderCount = Math.max(0, project.builderCount - 1);

  return { data: await cloneProjectForCurrentUser(project), error: null };
}

export async function setProjectSaved(
  projectId: string,
  isSaved: boolean
): Promise<ProjectServiceResult<ProjectDetail>> {
  await wait(140);

  const project = mockProjectDetails.find((item) => item.id === projectId);
  if (!project) return { data: null, error: 'Progetto non trovato' };

  await persistProjectSaved(CURRENT_USER_ID, projectId, isSaved);

  return {
    data: cloneProject({ ...project, isSaved }),
    error: null,
  };
}

const toOwnedProjectDetail = (
  project: ProfileProjectInput,
  founder: FounderInput
): ProjectDetail => ({
  id: project.id ?? `proj_${Date.now()}`,
  nome: project.nome,
  settore: project.settore,
  stato: project.stato || 'Italia',
  citta: project.citta,
  descrizione: project.descrizione,
  coverImage: project.foto ?? null,
  founderId: founder.id ?? 'current-user',
  founderName: founder.nome,
  memberIds: [founder.id ?? 'current-user'],
  followerCount: 0,
  builderCount: 1,
  isFollowing: true,
  isSaved: true,
  membershipStatus: 'founder',
  openRoles: [...project.openRoles],
  updates: [
    'Progetto creato dal tuo profilo builder.',
    'Flusso pronto per sincronizzare immagine, descrizione e ruoli con il backend.',
  ],
});

export function createOwnedProjectDetail(
  project: ProfileProjectInput,
  founder: FounderInput
) {
  const detail = toOwnedProjectDetail(project, founder);
  mockProjectDetails.push(detail);
  return cloneProject(detail);
}

export function updateProjectDetailFromProfileProject(
  project: ProfileProjectInput,
  founder: FounderInput
) {
  const projectIndex = mockProjectDetails.findIndex((item) => item.id === project.id);
  const updatedProject = toOwnedProjectDetail(project, founder);

  if (projectIndex >= 0) {
    mockProjectDetails[projectIndex] = {
      ...mockProjectDetails[projectIndex],
      ...updatedProject,
      followerCount: mockProjectDetails[projectIndex].followerCount,
      builderCount: mockProjectDetails[projectIndex].builderCount,
      memberIds: [...mockProjectDetails[projectIndex].memberIds],
      membershipStatus: mockProjectDetails[projectIndex].membershipStatus,
      updates: [...mockProjectDetails[projectIndex].updates],
    };
    return cloneProject(mockProjectDetails[projectIndex]);
  }

  mockProjectDetails.push(updatedProject);
  return cloneProject(updatedProject);
}

export function deleteProjectDetail(projectId: string) {
  const projectIndex = mockProjectDetails.findIndex((item) => item.id === projectId);
  if (projectIndex >= 0) mockProjectDetails.splice(projectIndex, 1);
}
