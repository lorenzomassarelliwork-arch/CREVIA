export type ProjectMembershipStatus = 'none' | 'pending' | 'member' | 'founder' | 'admin';

export type ProjectDetail = {
  id: string;
  nome: string;
  settore: string;
  stato: string;
  citta: string;
  descrizione: string;
  founderId: string;
  founderName: string;
  memberIds: string[];
  followerCount: number;
  builderCount: number;
  isFollowing: boolean;
  membershipStatus: ProjectMembershipStatus;
  openRoles: string[];
  updates: string[];
};

export type ProjectServiceResult<T> = {
  data: T | null;
  error: string | null;
};

const wait = (milliseconds = 180) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const cloneProject = (project: ProjectDetail): ProjectDetail => ({
  ...project,
  memberIds: [...project.memberIds],
  openRoles: [...project.openRoles],
  updates: [...project.updates],
});

export async function getProjectDetail(
  projectId: string
): Promise<ProjectServiceResult<ProjectDetail>> {
  const { mockProjectDetails } = await import('../mocks/projectMockData');
  await wait();

  const project = mockProjectDetails.find((item) => item.id === projectId);
  return project
    ? { data: cloneProject(project), error: null }
    : { data: null, error: 'Progetto non trovato' };
}

export async function requestProjectJoin(
  projectId: string
): Promise<ProjectServiceResult<ProjectDetail>> {
  const { mockProjectDetails } = await import('../mocks/projectMockData');
  await wait(160);

  const project = mockProjectDetails.find((item) => item.id === projectId);
  if (!project) return { data: null, error: 'Progetto non trovato' };

  if (project.membershipStatus === 'none') {
    project.membershipStatus = 'pending';
  }

  return { data: cloneProject(project), error: null };
}

export async function leaveProject(
  projectId: string,
  userId: string
): Promise<ProjectServiceResult<ProjectDetail>> {
  const { mockProjectDetails } = await import('../mocks/projectMockData');
  await wait(160);

  const project = mockProjectDetails.find((item) => item.id === projectId);
  if (!project) return { data: null, error: 'Progetto non trovato' };

  if (project.membershipStatus !== 'member') {
    return { data: cloneProject(project), error: null };
  }

  project.membershipStatus = 'none';
  project.memberIds = project.memberIds.filter((memberId) => memberId !== userId);
  project.builderCount = Math.max(0, project.builderCount - 1);

  return { data: cloneProject(project), error: null };
}

export async function setProjectFollowing(
  projectId: string,
  isFollowing: boolean
): Promise<ProjectServiceResult<ProjectDetail>> {
  const { mockProjectDetails } = await import('../mocks/projectMockData');
  await wait(140);

  const project = mockProjectDetails.find((item) => item.id === projectId);
  if (!project) return { data: null, error: 'Progetto non trovato' };

  project.isFollowing = isFollowing;
  project.followerCount += isFollowing ? 1 : -1;

  return { data: cloneProject(project), error: null };
}
