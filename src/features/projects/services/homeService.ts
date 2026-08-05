import { mockProjectDetails } from '../mocks/projectMockData';
import type { ProjectDetail } from './projectDetailService';
import type { PublicUserProfile } from '../../users/services/userService';
import { getProfile } from '../../profile/services/profileService';
import { CURRENT_USER_ID } from '../../chat/services/chatService';
import { getSavedProjectIds } from './savedProjectService';
import { getCompatibleBuilders } from '../../users/services/builderCompatibilityService';
import {
  listFollowedFeed,
  type FollowedFeedPost,
} from './followedFeedService';

export type HomeDiscoveryData = {
  currentUserName: string;
  currentUserAvatarUri: string | null;
  featuredProjects: ProjectDetail[];
  savedProjects: ProjectDetail[];
  formingTeams: ProjectDetail[];
  nearbyProjects: ProjectDetail[];
  compatibleBuilders: PublicUserProfile[];
  followedFeed: FollowedFeedPost[];
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

const getRecommendedProjects = (
  projects: ProjectDetail[],
  profile: { citta: string; settore: string }
) => {
  const normalize = (value: string) =>
    value
      .trim()
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  const userCity = normalize(profile.citta);
  const userSector = normalize(profile.settore);

  const exactMatches = projects.filter(
    (project) =>
      Boolean(userCity) &&
      Boolean(userSector) &&
      normalize(project.citta) === userCity &&
      normalize(project.settore) === userSector
  );

  if (exactMatches.length > 0) return exactMatches;

  return projects.filter(
    (project) =>
      (Boolean(userCity) && normalize(project.citta) === userCity) ||
      (Boolean(userSector) && normalize(project.settore) === userSector)
  );
};

export async function getHomeDiscovery(): Promise<
  HomeServiceResult<HomeDiscoveryData>
> {
  await wait();

  const [profileResponse, savedProjectIds, followedFeedResponse] = await Promise.all([
    getProfile(),
    getSavedProjectIds(CURRENT_USER_ID),
    listFollowedFeed(CURRENT_USER_ID),
  ]);
  const profile = profileResponse.data;
  const projects = mockProjectDetails.map((project) =>
    cloneProject({
      ...project,
      isSaved: savedProjectIds.includes(project.id),
    })
  );
  const recommendedProjects = profile
    ? getRecommendedProjects(projects, profile)
    : [];
  const compatibleBuildersResponse = profile
    ? await getCompatibleBuilders(CURRENT_USER_ID, profile)
    : { data: [] as PublicUserProfile[] };

  return {
    data: {
      currentUserName: profile?.nome ?? 'Lorenzo',
      currentUserAvatarUri: profile?.foto ?? null,
      featuredProjects: recommendedProjects,
      savedProjects: projects.filter((project) => project.isSaved),
      formingTeams: projects.filter((project) => project.openRoles.length > 0),
      nearbyProjects: projects.filter((project) => project.citta === 'Milano'),
      compatibleBuilders: compatibleBuildersResponse.data ?? [],
      followedFeed: followedFeedResponse.data,
    },
    error: null,
  };
}
