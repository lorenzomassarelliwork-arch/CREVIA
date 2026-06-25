import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  addExperience,
  addProject,
  deleteExperience,
  deleteProject,
  getExperiences,
  getProfile,
  getProjects,
  updateExperience,
  updateProfile,
  updateProject,
} from '../services/profileService';
import type { Experience, Profile, Project } from '../services/profileService';

export type FormattedExperience = Experience & {
  periodo: string;
};

type ActiveTab = 'projects' | 'experiences';

type PrivacyValues = Pick<
  Profile,
  'privacyDataNascita' | 'privacyNazione' | 'privacyCitta'
>;

const INITIAL_PROFILE: Profile = {
  nome: '',
  ruolo: '',
  settore: '',
  bio: '',
  collegamenti: 0,
  seguaci: 0,
  dataNascita: '',
  nazione: '',
  citta: '',
  privacyDataNascita: false,
  privacyNazione: false,
  privacyCitta: false,
};

const INITIAL_PROJECT: Project = {
  nome: '',
  settore: '',
  citta: '',
  ruoloUtente: '',
  collaboratori: '',
};

const INITIAL_EXPERIENCE: Experience = {
  titolo: '',
  settore: '',
  progetto: '',
  paginaProgetto: '',
  inizio: new Date(),
  fine: null,
  inCorso: false,
  descrizione: '',
};

export function useProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftProfile, setDraftProfile] = useState<Profile>(INITIAL_PROFILE);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects');
  const [loading, setLoading] = useState<boolean>(false);
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [photoMenuVisible, setPhotoMenuVisible] = useState<boolean>(false);
  const [isCreateProjectModalVisible, setIsCreateProjectModalVisible] = useState<boolean>(false);
  const [isProjectModalVisible, setIsProjectModalVisible] = useState<boolean>(false);
  const [isExperienceModalVisible, setIsExperienceModalVisible] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showInizioPicker, setShowInizioPicker] = useState<boolean>(false);
  const [showFinePicker, setShowFinePicker] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async ({ refresh = false }: { refresh?: boolean } = {}) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const [profileResult, projectsResult, experiencesResult] = await Promise.all([
      getProfile(),
      getProjects(),
      getExperiences(),
    ]);

    setProfile(profileResult.data ?? INITIAL_PROFILE);
    setDraftProfile(profileResult.data ?? INITIAL_PROFILE);
    setProjects(projectsResult.data ?? []);
    setExperiences(experiencesResult.data ?? []);

    if (refresh) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  }, []);

  const refreshProfileData = useCallback(async () => {
    await loadData({ refresh: true });
  }, [loadData]);

  const profileSummary = useMemo(
    () => ({
      iscritti: profile?.seguaci ?? 0,
      connessioni: profile?.collegamenti ?? 0,
      ruolo: profile?.ruolo ?? '',
    }),
    [profile]
  );

  const startEditingProfile = useCallback(() => {
    setDraftProfile(profile ?? INITIAL_PROFILE);
    setEditingProfile(true);
  }, [profile]);

  const cancelEditingProfile = useCallback(() => {
    setDraftProfile(profile ?? INITIAL_PROFILE);
    setEditingProfile(false);
  }, [profile]);

  const updateDraftProfileField = useCallback(<K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraftProfile((current) => ({ ...current, [key]: value }));
  }, []);

  const saveProfile = useCallback(async () => {
    setLoading(true);
    const response = await updateProfile(draftProfile);
    if (!response.error) {
      setProfile(response.data ?? INITIAL_PROFILE);
      setEditingProfile(false);
    }
    setLoading(false);
  }, [draftProfile]);

  const openPhotoMenu = useCallback(() => setPhotoMenuVisible(true), []);
  const closePhotoMenu = useCallback(() => setPhotoMenuVisible(false), []);
  const handlePhotoChoice = useCallback(
    async (option: string) => {
      closePhotoMenu();
      setProfile((current) => current ? ({ ...current, foto: 'https://via.placeholder.com/150' }) : current);
      return option;
    },
    [closePhotoMenu]
  );

  const savePrivacySettings = useCallback(async (privacyValues: PrivacyValues) => {
    if (!profile) return;
    setLoading(true);
    const updatedProfile = { ...profile, ...privacyValues };
    const response = await updateProfile(updatedProfile);
    if (!response.error) {
      setProfile(response.data ?? updatedProfile);
      setDraftProfile(response.data ?? updatedProfile);
    }
    setLoading(false);
  }, [profile]);

  const togglePrivacyField = useCallback(async (field: keyof PrivacyValues) => {
    if (!profile) return;
    setLoading(true);
    const updatedProfile = { ...profile, [field]: !profile[field] };
    const response = await updateProfile(updatedProfile);
    if (!response.error) {
      setProfile(response.data ?? updatedProfile);
      setDraftProfile(response.data ?? updatedProfile);
    }
    setLoading(false);
  }, [profile]);

  const openCreateProjectModal = useCallback(() => {
    setSelectedProject({ ...INITIAL_PROJECT });
    setIsCreateProjectModalVisible(true);
  }, []);

  const closeCreateProjectModal = useCallback(() => {
    setSelectedProject(null);
    setIsCreateProjectModalVisible(false);
  }, []);

  const openProjectModal = useCallback((project: Project) => {
    setSelectedProject({ ...project });
    setIsProjectModalVisible(true);
  }, []);

  const closeProjectModal = useCallback(() => {
    setSelectedProject(null);
    setIsProjectModalVisible(false);
  }, []);

  const saveProject = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);

    const response = selectedProject.id
      ? await updateProject(selectedProject)
      : await addProject(selectedProject);

    if (!response.error) {
      setProjects((current) => {
        if (selectedProject.id) {
          return current.map((item) => (item.id === selectedProject.id ? response.data ?? item : item));
        }
        return response.data ? [...current, response.data] : current;
      });
      closeCreateProjectModal();
      closeProjectModal();
    }

    setLoading(false);
  }, [selectedProject, closeCreateProjectModal, closeProjectModal]);

  const removeProject = useCallback(() => {
    if (!selectedProject?.id) return;
    const projectId = selectedProject.id;

    Alert.alert(
      'Elimina Pagina Progetto',
      'Sei sicuro di voler eliminare definitivamente questa pagina progetto?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const response = await deleteProject(projectId);
            if (!response.error) {
              setProjects((current) => current.filter((item) => item.id !== projectId));
              closeProjectModal();
            }
            setLoading(false);
          },
        },
      ],
      { cancelable: true }
    );
  }, [selectedProject, closeProjectModal]);

  const openExperienceModal = useCallback((experience: Experience) => {
    setSelectedExperience({ ...experience });
    setIsExperienceModalVisible(true);
  }, []);

  const closeExperienceModal = useCallback(() => {
    setSelectedExperience(null);
    setShowInizioPicker(false);
    setShowFinePicker(false);
    setIsExperienceModalVisible(false);
  }, []);

  const createNewExperience = useCallback(() => {
    setSelectedExperience({ ...INITIAL_EXPERIENCE });
    setShowInizioPicker(false);
    setShowFinePicker(false);
    setIsExperienceModalVisible(true);
  }, []);

  const saveExperience = useCallback(async () => {
    if (!selectedExperience) return;
    setLoading(true);

    const response = selectedExperience.id
      ? await updateExperience(selectedExperience)
      : await addExperience(selectedExperience);

    if (!response.error) {
      setExperiences((current) => {
        if (selectedExperience.id) {
          return current.map((item) => (item.id === selectedExperience.id ? response.data ?? item : item));
        }
        return response.data ? [...current, response.data] : current;
      });
      closeExperienceModal();
    }

    setLoading(false);
  }, [selectedExperience, closeExperienceModal]);

  const removeExperience = useCallback(() => {
    if (!selectedExperience?.id) return;
    const experienceId = selectedExperience.id;

    Alert.alert(
      'Elimina Esperienza',
      'Sei sicuro di voler eliminare definitivamente questa esperienza?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const response = await deleteExperience(experienceId);
            if (!response.error) {
              setExperiences((current) => current.filter((item) => item.id !== experienceId));
              closeExperienceModal();
            }
            setLoading(false);
          },
        },
      ],
      { cancelable: true }
    );
  }, [selectedExperience, closeExperienceModal]);

  const updateSelectedExperienceValue = useCallback(<K extends keyof Experience>(key: K, value: Experience[K]) => {
    setSelectedExperience((current) => current ? ({ ...current, [key]: value }) : current);
  }, []);

  const updateSelectedProjectValue = useCallback(<K extends keyof Project>(key: K, value: Project[K]) => {
    setSelectedProject((current) => current ? ({ ...current, [key]: value }) : current);
  }, []);

  const formattedExperiences = useMemo<FormattedExperience[]>(
    () =>
      experiences.map((item) => ({
        ...item,
        periodo: item.inCorso ? `Dal ${item.inizio} - Oggi` : `Dal ${item.inizio} al ${item.fine}`,
      })),
    [experiences]
  );

  return {
    profile,
    draftProfile,
    projects,
    experiences: formattedExperiences,
    activeTab,
    loading,
    editingProfile,
    photoMenuVisible,
    isCreateProjectModalVisible,
    isProjectModalVisible,
    isExperienceModalVisible,
    selectedProject,
    selectedExperience,
    showInizioPicker,
    showFinePicker,
    profileSummary,
    startEditingProfile,
    cancelEditingProfile,
    updateDraftProfileField,
    saveProfile,
    openPhotoMenu,
    closePhotoMenu,
    handlePhotoChoice,
    openCreateProjectModal,
    closeCreateProjectModal,
    openProjectModal,
    closeProjectModal,
    saveProject,
    removeProject,
    openExperienceModal,
    closeExperienceModal,
    createNewExperience,
    saveExperience,
    removeExperience,
    updateSelectedExperienceValue,
    updateSelectedProjectValue,
    setActiveTab,
    setShowInizioPicker,
    setShowFinePicker,
    togglePrivacyField,
    savePrivacySettings,
    refreshing,
    refreshProfileData,
  };
}
