import { mockProjectDetails } from '../mocks/projectMockData';
import type { ProjectDetail } from './projectDetailService';
import { mockPublicUsers } from '../../users/mocks/userMockData';
import type { PublicUserProfile } from '../../users/services/userService';

export type HomeDiscoveryData = {
  currentUserName: string;
  featuredProjects: ProjectDetail[];
  formingTeams: ProjectDetail[];
  nearbyProjects: ProjectDetail[];
  compatibleBuilders: PublicUserProfile[];
  followedProjects: ProjectDetail[];
};

export type HomeServiceResult<T> = {
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

const cloneUser = (user: PublicUserProfile): PublicUserProfile => ({
  ...user,
  progetti: [...user.progetti],
  esperienze: [...user.esperienze],
});

export async function getHomeDiscovery(): Promise<
  HomeServiceResult<HomeDiscoveryData>
> {
  await wait();

  const projects = mockProjectDetails.map(cloneProject);
  const users = mockPublicUsers.map(cloneUser);

  return {
    data: {
      currentUserName: 'Lorenzo',
      featuredProjects: projects.filter((project) =>
        ['1', '3'].includes(project.id)
      ),
      formingTeams: projects.filter((project) => project.openRoles.length > 0),
      nearbyProjects: projects.filter((project) => project.citta === 'Milano'),
      compatibleBuilders: users.filter((user) =>
        ['Tecnologia', 'Design & UX', 'Fintech'].includes(user.settore)
      ),
      followedProjects: projects.filter(
        (project) => project.isFollowing || project.membershipStatus !== 'none'
      ),
    },
    error: null,
  };
}
