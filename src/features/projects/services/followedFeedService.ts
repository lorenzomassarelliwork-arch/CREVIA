import { getProfileSocialUsers } from '../../profile/services/profileService';
import {
  addProfilePostComment,
  deleteProfilePostComment,
  listProfilePosts,
  reportProfilePost,
  toggleProfilePostLike,
  type ProfilePost,
} from '../../profile/services/profilePostService';
import { mockProjectDetails } from '../mocks/projectMockData';
import {
  addProjectPostComment,
  deleteProjectPostComment,
  listProjectPosts,
  reportProjectPost,
  toggleProjectPostLike,
  type ProjectPost,
} from './projectPostService';

export type FollowedFeedComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorType: 'user' | 'project';
  authorAvatarUri: string | null;
  body: string;
  createdAt: string;
};

export type FollowedFeedPost = {
  id: string;
  postId: string;
  authorId: string;
  sourceType: 'project' | 'user';
  sourceId: string;
  sourceName: string;
  sourceAvatarUri: string | null;
  body: string;
  imageUri: string | null;
  createdAt: string;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  isReportedByCurrentUser: boolean;
  comments: FollowedFeedComment[];
};

export type FollowedFeedResult<T = FollowedFeedPost[]> = {
  data: T;
  error: string | null;
};

const mapComments = (
  comments: Array<{
    id: string;
    authorId: string;
    authorName: string;
    authorType: 'user' | 'project';
    authorAvatarUri: string | null;
    body: string;
    createdAt: string;
  }>
): FollowedFeedComment[] => comments.map((comment) => ({ ...comment }));

const mapUserPost = (post: ProfilePost): FollowedFeedPost => ({
  id: `user:${post.id}`,
  postId: post.id,
  authorId: post.authorId,
  sourceType: 'user',
  sourceId: post.authorId,
  sourceName: post.authorName,
  sourceAvatarUri: post.authorAvatarUri,
  body: post.body,
  imageUri: post.imageUri,
  createdAt: post.createdAt,
  likeCount: post.likeCount,
  isLikedByCurrentUser: post.isLikedByCurrentUser,
  isReportedByCurrentUser: post.isReportedByCurrentUser,
  comments: mapComments(post.comments),
});

const mapProjectPost = (
  project: (typeof mockProjectDetails)[number],
  post: ProjectPost
): FollowedFeedPost => ({
  id: `project:${post.id}`,
  postId: post.id,
  authorId: post.authorId,
  sourceType: 'project',
  sourceId: project.id,
  sourceName: project.nome,
  sourceAvatarUri: project.coverImage ?? null,
  body: post.body,
  imageUri: post.imageUri ?? null,
  createdAt: post.createdAt,
  likeCount: post.likeCount,
  isLikedByCurrentUser: post.isLikedByCurrentUser,
  isReportedByCurrentUser: post.isReportedByCurrentUser,
  comments: mapComments(post.comments),
});

export async function listFollowedFeed(
  currentUserId: string
): Promise<FollowedFeedResult> {
  const [connectionsResult, followersResult] = await Promise.all([
    getProfileSocialUsers('connections'),
    getProfileSocialUsers('followers'),
  ]);

  const connectionIds = (connectionsResult.data ?? []).map((user) => user.id);
  const followedUserIds = (followersResult.data ?? [])
    .filter((user) => user.isFollowedByCurrentUser)
    .map((user) => user.id);
  const userIds = Array.from(new Set([...connectionIds, ...followedUserIds]));
  const followedProjects = mockProjectDetails.filter(
    (project) => project.isFollowing
  );

  const [userPostResults, projectPostResults] = await Promise.all([
    Promise.all(
      userIds.map((userId) => listProfilePosts(userId, currentUserId))
    ),
    Promise.all(
      followedProjects.map(async (project) => ({
        project,
        response: await listProjectPosts(project.id, currentUserId),
      }))
    ),
  ]);

  const userPosts = userPostResults.flatMap((response) =>
    (response.data ?? []).map(mapUserPost)
  );
  const projectPosts = projectPostResults.flatMap(({ project, response }) =>
    response.data.map((post) => mapProjectPost(project, post))
  );

  return {
    data: [...userPosts, ...projectPosts].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
    ),
    error: connectionsResult.error ?? followersResult.error ?? null,
  };
}

export async function toggleFollowedFeedPostLike(
  post: FollowedFeedPost,
  currentUserId: string
): Promise<FollowedFeedResult<FollowedFeedPost | null>> {
  if (post.sourceType === 'user') {
    const response = await toggleProfilePostLike(post.postId, currentUserId);
    return {
      data: response.data ? mapUserPost(response.data) : null,
      error: response.error,
    };
  }

  const project = mockProjectDetails.find((item) => item.id === post.sourceId);
  if (!project) return { data: null, error: 'Pagina progetto non trovata.' };
  const response = await toggleProjectPostLike(post.postId, currentUserId);
  return {
    data: response.data ? mapProjectPost(project, response.data) : null,
    error: response.error,
  };
}

export async function addFollowedFeedPostComment(
  post: FollowedFeedPost,
  currentUser: { id: string; name: string; avatarUri: string | null },
  body: string
): Promise<FollowedFeedResult<FollowedFeedPost | null>> {
  if (post.sourceType === 'user') {
    const response = await addProfilePostComment(
      post.postId,
      currentUser.id,
      currentUser.name,
      body,
      currentUser.avatarUri
    );
    return {
      data: response.data ? mapUserPost(response.data) : null,
      error: response.error,
    };
  }

  const project = mockProjectDetails.find((item) => item.id === post.sourceId);
  if (!project) return { data: null, error: 'Pagina progetto non trovata.' };
  const response = await addProjectPostComment(
    post.postId,
    currentUser.id,
    currentUser.name,
    body,
    currentUser.avatarUri
  );
  return {
    data: response.data ? mapProjectPost(project, response.data) : null,
    error: response.error,
  };
}

export async function reportFollowedFeedPost(
  post: FollowedFeedPost,
  currentUserId: string
): Promise<FollowedFeedResult<FollowedFeedPost | null>> {
  if (post.sourceType === 'user') {
    const response = await reportProfilePost(post.postId, currentUserId);
    return {
      data: response.data ? mapUserPost(response.data) : null,
      error: response.error,
    };
  }

  const project = mockProjectDetails.find((item) => item.id === post.sourceId);
  if (!project) return { data: null, error: 'Pagina progetto non trovata.' };
  const response = await reportProjectPost(post.postId, currentUserId);
  return {
    data: response.data ? mapProjectPost(project, response.data) : null,
    error: response.error,
  };
}

export async function deleteFollowedFeedPostComment(
  post: FollowedFeedPost,
  commentId: string,
  currentUserId: string
): Promise<FollowedFeedResult<FollowedFeedPost | null>> {
  if (post.sourceType === 'user') {
    const response = await deleteProfilePostComment(
      post.postId,
      commentId,
      currentUserId
    );
    return {
      data: response.data ? mapUserPost(response.data) : null,
      error: response.error,
    };
  }

  const project = mockProjectDetails.find((item) => item.id === post.sourceId);
  if (!project) return { data: null, error: 'Pagina progetto non trovata.' };
  const response = await deleteProjectPostComment(
    post.postId,
    commentId,
    currentUserId
  );
  return {
    data: response.data ? mapProjectPost(project, response.data) : null,
    error: response.error,
  };
}
