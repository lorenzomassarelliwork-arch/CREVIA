import { CURRENT_USER_ID } from '../../chat/services/chatService';
import {
  createOwnedProjectDetail,
  deleteProjectDetail,
  updateProjectDetailFromProfileProject,
} from '../../projects/services/projectDetailService';
import type { AppLanguage } from '../../../theme/AppPreferencesProvider';

export type Profile = {
  id?: string;
  nome: string;
  ruolo: string;
  settore: string;
  bio: string;
  bioLanguage?: AppLanguage;
  foto?: string | null;
  fotoCopertina?: string | null;
  collegamenti: number;
  seguaci: number;
  dataNascita: string;
  nazione: string;
  citta: string;
  privacyDataNascita: boolean;
  privacyNazione: boolean;
  privacyCitta: boolean;
  isBuilder: boolean;
  builderProfileCompleted: boolean;
};

export type Project = {
  id?: string;
  nome: string;
  settore: string;
  stato: string;
  citta: string;
  descrizione: string;
  ruoloUtente: string;
  collaboratori: string;
  foto?: string | null;
  openRoles: string[];
};

export type Experience = {
  id?: string;
  titolo: string;
  settore?: string;
  progetto: string;
  paginaProgetto?: string;
  inizio: Date | string;
  fine: Date | string | null;
  inCorso: boolean;
  descrizione: string;
};

export type ProfileSocialListType = 'connections' | 'followers';

export type ProfileSocialUser = {
  id: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  isFollowedByCurrentUser: boolean;
};

export type ServiceResult<T> = {
  data: T | null;
  error?: string | null;
};

export type AppPreferences = {
  notifichePush: boolean;
  emailAggiornamenti: boolean;
  suggerimentiPersonalizzati: boolean;
  feedbackTattile: boolean;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let fakeProfile: Profile = {
  id: CURRENT_USER_ID,
  nome: 'Luca Rossi',
  ruolo: 'Founder',
  settore: 'Prodotti Digitali',
  bio: 'Appassionato di UX e startup digitali con una forte propensione al design e ai progetti che uniscono creatività e tecnologia.',
  bioLanguage: 'it',
  foto: null,
  fotoCopertina:
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  collegamenti: 128,
  seguaci: 342,
  dataNascita: '15/03/1991',
  nazione: 'Italia',
  citta: 'Milano',
  privacyDataNascita: true,
  privacyNazione: false,
  privacyCitta: true,
  isBuilder: true,
  builderProfileCompleted: true,
};

let fakeProjects: Project[] = [
  {
    id: '4',
    nome: 'FinLab',
    settore: 'Fintech',
    stato: 'Italia',
    citta: 'Milano',
    descrizione:
      'Laboratorio fintech per sperimentare prodotti su pagamenti digitali, educazione finanziaria e data analysis.',
    ruoloUtente: 'Founder',
    collaboratori: 'Luca Rossi (Creatore)',
    foto: null,
    openRoles: ['Data analyst', 'Backend developer', 'Product manager'],
  },
];

let fakeExperiences: Experience[] = [
  {
    id: 'exp_1',
    titolo: 'UI/UX Designer',
    progetto: 'Crevia App',
    inizio: '2022-04-01',
    fine: null,
    inCorso: true,
    descrizione: 'Progetto mobile focalizzato su usabilità e accessibilità.',
  },
  {
    id: 'exp_2',
    titolo: 'Product Designer',
    progetto: 'Portfolio Digitale',
    inizio: '2021-01-01',
    fine: '2022-03-01',
    inCorso: false,
    descrizione: 'Sviluppo di un portfolio online per professionisti creativi.',
  },
];

let fakeConnections: ProfileSocialUser[] = [
  {
    id: 'user-marco',
    displayName: 'Marco Rossi',
    role: 'Sviluppatore Frontend',
    avatarUrl: null,
    isOnline: true,
    isFollowedByCurrentUser: true,
  },
  {
    id: 'user-sara',
    displayName: 'Sara Bianchi',
    role: 'UX Designer',
    avatarUrl: null,
    isOnline: false,
    isFollowedByCurrentUser: true,
  },
  {
    id: 'user-luca',
    displayName: 'Luca Ferrari',
    role: 'Data Analyst',
    avatarUrl: null,
    isOnline: false,
    isFollowedByCurrentUser: false,
  },
];

let fakeFollowers: ProfileSocialUser[] = [
  {
    id: 'user-giulia',
    displayName: 'Giulia Marino',
    role: 'Marketing Specialist',
    avatarUrl: null,
    isOnline: true,
    isFollowedByCurrentUser: true,
  },
  {
    id: 'user-andrea',
    displayName: 'Andrea Conti',
    role: 'Product Designer',
    avatarUrl: null,
    isOnline: false,
    isFollowedByCurrentUser: false,
  },
];

function syncSocialCounts() {
  fakeProfile = {
    ...fakeProfile,
    collegamenti: fakeConnections.length,
    seguaci: fakeFollowers.length,
  };
}

let fakeAppPreferences: AppPreferences = {
  notifichePush: true,
  emailAggiornamenti: true,
  suggerimentiPersonalizzati: true,
  feedbackTattile: false,
};

export async function getProfile(): Promise<ServiceResult<Profile>> {
  await delay(250);
  syncSocialCounts();
  return { data: { ...fakeProfile } };
}

export async function updateProfile(
  profile: Partial<Profile>
): Promise<ServiceResult<Profile>> {
  await delay(250);
  fakeProfile = { ...fakeProfile, ...profile };
  syncSocialCounts();
  return { data: { ...fakeProfile }, error: null };
}

export async function completeBuilderProfile(
  profile: Pick<
    Profile,
    'nome' | 'ruolo' | 'settore' | 'bio' | 'dataNascita' | 'nazione' | 'citta'
  >
): Promise<ServiceResult<Profile>> {
  await delay(300);
  fakeProfile = {
    ...fakeProfile,
    ...profile,
    id: fakeProfile.id ?? CURRENT_USER_ID,
    isBuilder: true,
    builderProfileCompleted: true,
  };

  return { data: { ...fakeProfile }, error: null };
}

export async function getAppPreferences(): Promise<ServiceResult<AppPreferences>> {
  await delay(250);
  return { data: { ...fakeAppPreferences }, error: null };
}

export async function updateAppPreferences(
  preferences: Partial<AppPreferences>
): Promise<ServiceResult<AppPreferences>> {
  await delay(250);
  fakeAppPreferences = { ...fakeAppPreferences, ...preferences };
  return { data: { ...fakeAppPreferences }, error: null };
}

export async function getProjects(): Promise<ServiceResult<Project[]>> {
  await delay(250);
  return { data: [...fakeProjects] };
}

export async function addProject(
  project: Project
): Promise<ServiceResult<Project>> {
  await delay(300);
  const newProject = { ...project, id: `proj_${Date.now()}` };
  fakeProjects = [...fakeProjects, newProject];
  createOwnedProjectDetail(newProject, fakeProfile);
  return { data: newProject, error: null };
}

export async function updateProject(
  project: Project
): Promise<ServiceResult<Project>> {
  await delay(300);
  fakeProjects = fakeProjects.map((item) => (item.id === project.id ? { ...item, ...project } : item));
  updateProjectDetailFromProfileProject(project, fakeProfile);
  return { data: project, error: null };
}

export async function deleteProject(
  projectId: string
): Promise<ServiceResult<null>> {
  await delay(250);
  fakeProjects = fakeProjects.filter((item) => item.id !== projectId);
  deleteProjectDetail(projectId);
  return { data: null, error: null };
}

export async function getExperiences(): Promise<ServiceResult<Experience[]>> {
  await delay(250);
  return { data: [...fakeExperiences] };
}

export async function getProfileSocialUsers(
  listType: ProfileSocialListType
): Promise<ServiceResult<ProfileSocialUser[]>> {
  await delay(250);
  const users = listType === 'connections' ? fakeConnections : fakeFollowers;
  return { data: users.map((user) => ({ ...user })), error: null };
}

export async function removeProfileSocialUser(
  listType: ProfileSocialListType,
  userId: string
): Promise<ServiceResult<null>> {
  await delay(200);
  if (listType === 'connections') {
    fakeConnections = fakeConnections.filter((user) => user.id !== userId);
  } else {
    fakeFollowers = fakeFollowers.filter((user) => user.id !== userId);
  }
  syncSocialCounts();
  return { data: null, error: null };
}

export async function setProfileSocialFollowState(
  listType: ProfileSocialListType,
  userId: string,
  isFollowedByCurrentUser: boolean
): Promise<ServiceResult<ProfileSocialUser | null>> {
  await delay(200);
  const updateUser = (user: ProfileSocialUser) =>
    user.id === userId ? { ...user, isFollowedByCurrentUser } : user;
  const users = listType === 'connections' ? fakeConnections : fakeFollowers;
  const updatedUser = users.find((user) => user.id === userId);
  if (!updatedUser) return { data: null, error: 'Utente non trovato.' };

  if (listType === 'connections') {
    fakeConnections = fakeConnections.map(updateUser);
  } else {
    fakeFollowers = fakeFollowers.map(updateUser);
  }

  return { data: { ...updatedUser, isFollowedByCurrentUser }, error: null };
}

export async function blockProfileSocialUser(
  userId: string
): Promise<ServiceResult<null>> {
  await delay(200);
  const wasConnection = fakeConnections.some((user) => user.id === userId);
  const wasFollower = fakeFollowers.some((user) => user.id === userId);
  fakeConnections = fakeConnections.filter((user) => user.id !== userId);
  fakeFollowers = fakeFollowers.filter((user) => user.id !== userId);
  if (wasConnection || wasFollower) syncSocialCounts();
  return { data: null, error: null };
}

export async function addExperience(
  experience: Experience
): Promise<ServiceResult<Experience>> {
  await delay(300);
  const newExperience = { ...experience, id: `exp_${Date.now()}` };
  fakeExperiences = [...fakeExperiences, newExperience];
  return { data: newExperience, error: null };
}

export async function updateExperience(
  experience: Experience
): Promise<ServiceResult<Experience>> {
  await delay(300);
  fakeExperiences = fakeExperiences.map((item) => (item.id === experience.id ? { ...item, ...experience } : item));
  return { data: experience, error: null };
}

export async function deleteExperience(
  experienceId: string
): Promise<ServiceResult<null>> {
  await delay(250);
  fakeExperiences = fakeExperiences.filter((item) => item.id !== experienceId);
  return { data: null, error: null };
}
