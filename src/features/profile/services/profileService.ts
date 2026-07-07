import type { AppLanguage } from '../../../theme/AppPreferencesProvider';

export type Profile = {
  id?: string;
  nome: string;
  ruolo: string;
  settore: string;
  bio: string;
  bioLanguage?: AppLanguage;
  foto?: string | null;
  collegamenti: number;
  seguaci: number;
  dataNascita: string;
  nazione: string;
  citta: string;
  privacyDataNascita: boolean;
  privacyNazione: boolean;
  privacyCitta: boolean;
};

export type Project = {
  id?: string;
  nome: string;
  settore: string;
  citta: string;
  ruoloUtente: string;
  collaboratori: string;
  foto?: string | null;
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
  id: '1',
  nome: 'Luca Rossi',
  ruolo: 'Founder',
  settore: 'Prodotti Digitali',
  bio: 'Appassionato di UX e startup digitali con una forte propensione al design e ai progetti che uniscono creatività e tecnologia.',
  bioLanguage: 'it',
  foto: null,
  collegamenti: 128,
  seguaci: 342,
  dataNascita: '15/03/1991',
  nazione: 'Italia',
  citta: 'Milano',
  privacyDataNascita: true,
  privacyNazione: false,
  privacyCitta: true,
};

let fakeProjects: Project[] = [
  {
    id: 'proj_1',
    nome: 'Crevia App',
    settore: 'UX Design',
    citta: 'Milano',
    ruoloUtente: 'Founder',
    collaboratori: 'Luca Rossi (Creatore)',
    foto: null,
  },
  {
    id: 'proj_2',
    nome: 'Portfolio Digitale',
    settore: 'Personal Branding',
    citta: 'Roma',
    ruoloUtente: 'Founder',
    collaboratori: 'Luca Rossi (Creatore)',
    foto: null,
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

let fakeAppPreferences: AppPreferences = {
  notifichePush: true,
  emailAggiornamenti: true,
  suggerimentiPersonalizzati: true,
  feedbackTattile: false,
};

export async function getProfile(): Promise<ServiceResult<Profile>> {
  await delay(250);
  return { data: { ...fakeProfile } };
}

export async function updateProfile(
  profile: Partial<Profile>
): Promise<ServiceResult<Profile>> {
  await delay(250);
  fakeProfile = { ...fakeProfile, ...profile };
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
  return { data: newProject, error: null };
}

export async function updateProject(
  project: Project
): Promise<ServiceResult<Project>> {
  await delay(300);
  fakeProjects = fakeProjects.map((item) => (item.id === project.id ? { ...item, ...project } : item));
  return { data: project, error: null };
}

export async function deleteProject(
  projectId: string
): Promise<ServiceResult<null>> {
  await delay(250);
  fakeProjects = fakeProjects.filter((item) => item.id !== projectId);
  return { data: null, error: null };
}

export async function getExperiences(): Promise<ServiceResult<Experience[]>> {
  await delay(250);
  return { data: [...fakeExperiences] };
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
