import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  getAppPreferences,
  getProfile,
  updateAppPreferences,
  updateProfile,
} from '../services/profileService';
import type { AppPreferences, Profile } from '../services/profileService';

type PrivacyPreferences = Pick<
  Profile,
  'privacyDataNascita' | 'privacyNazione' | 'privacyCitta'
>;

const INITIAL_PRIVACY: PrivacyPreferences = {
  privacyDataNascita: false,
  privacyNazione: false,
  privacyCitta: false,
};

const INITIAL_APP_PREFERENCES: AppPreferences = {
  notifichePush: false,
  emailAggiornamenti: false,
  suggerimentiPersonalizzati: false,
  feedbackTattile: false,
};

export function useSettingsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [privacyPreferences, setPrivacyPreferences] =
    useState<PrivacyPreferences>(INITIAL_PRIVACY);
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(
    INITIAL_APP_PREFERENCES
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);

    const [profileResult, appPreferencesResult] = await Promise.all([
      getProfile(),
      getAppPreferences(),
    ]);

    if (profileResult.data) {
      setProfile(profileResult.data);
      setPrivacyPreferences({
        privacyDataNascita: profileResult.data.privacyDataNascita,
        privacyNazione: profileResult.data.privacyNazione,
        privacyCitta: profileResult.data.privacyCitta,
      });
    }

    if (appPreferencesResult.data) {
      setAppPreferences(appPreferencesResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const togglePrivacyPreference = useCallback(
    (field: keyof PrivacyPreferences) => {
      setPrivacyPreferences((current) => ({
        ...current,
        [field]: !current[field],
      }));
    },
    []
  );

  const toggleAppPreference = useCallback((field: keyof AppPreferences) => {
    setAppPreferences((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }, []);

  const saveSettings = useCallback(async () => {
    if (!profile) return;

    setSaving(true);

    const [profileResult, appPreferencesResult] = await Promise.all([
      updateProfile(privacyPreferences),
      updateAppPreferences(appPreferences),
    ]);

    if (!profileResult.error && !appPreferencesResult.error) {
      setProfile(profileResult.data ?? { ...profile, ...privacyPreferences });
      Alert.alert(
        'Impostazioni aggiornate',
        'Le preferenze del profilo e dell app sono state salvate.'
      );
    } else {
      Alert.alert(
        'Salvataggio non riuscito',
        'Si e verificato un problema durante il salvataggio delle impostazioni.'
      );
    }

    setSaving(false);
  }, [appPreferences, privacyPreferences, profile]);

  return {
    profile,
    privacyPreferences,
    appPreferences,
    loading,
    saving,
    togglePrivacyPreference,
    toggleAppPreference,
    saveSettings,
  };
}
