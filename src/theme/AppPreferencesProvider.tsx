import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  DARK_COLORS,
  LIGHT_COLORS,
  type ColorPalette,
} from './colors';

export type AppLanguage = 'it' | 'en';
export type AppThemeMode = 'automatic' | 'light' | 'dark';

type StoredPreferences = {
  hapticsEnabled: boolean;
  language: AppLanguage;
  themeMode: AppThemeMode;
};

type AppPreferencesContextValue = StoredPreferences & {
  colors: ColorPalette;
  isDark: boolean;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setThemeMode: (mode: AppThemeMode) => Promise<void>;
  triggerHaptic: () => Promise<void>;
};

const STORAGE_KEY = '@crevia/app-preferences';

const DEFAULT_PREFERENCES: StoredPreferences = {
  language: 'it',
  themeMode: 'automatic',
  hapticsEnabled: true,
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(
  null
);

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [preferences, setPreferences] =
    useState<StoredPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedValue) => {
        if (!mounted || !storedValue) return;

        const storedPreferences = JSON.parse(storedValue) as Partial<StoredPreferences>;
        setPreferences((current) => ({ ...current, ...storedPreferences }));
      })
      .catch(() => {
        // Le preferenze predefinite restano disponibili se lo storage non è leggibile.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isDark =
    preferences.themeMode === 'dark' ||
    (preferences.themeMode === 'automatic' && systemColorScheme === 'dark');
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background]);

  const updatePreferences = useCallback((patch: Partial<StoredPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
        () => undefined
      );
      return next;
    });
  }, []);

  const setLanguage = useCallback(
    async (language: AppLanguage) => {
      updatePreferences({ language });
    },
    [updatePreferences]
  );

  const setThemeMode = useCallback(
    async (themeMode: AppThemeMode) => {
      updatePreferences({ themeMode });
    },
    [updatePreferences]
  );

  const setHapticsEnabled = useCallback(
    async (hapticsEnabled: boolean) => {
      updatePreferences({ hapticsEnabled });

      if (hapticsEnabled) {
        await Haptics.selectionAsync();
      }
    },
    [updatePreferences]
  );

  const triggerHaptic = useCallback(async () => {
    if (preferences.hapticsEnabled) {
      await Haptics.selectionAsync();
    }
  }, [preferences.hapticsEnabled]);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      ...preferences,
      colors,
      isDark,
      setLanguage,
      setThemeMode,
      setHapticsEnabled,
      triggerHaptic,
    }),
    [
      colors,
      isDark,
      preferences,
      setHapticsEnabled,
      setLanguage,
      setThemeMode,
      triggerHaptic,
    ]
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferencesContextValue {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error(
      'useAppPreferences deve essere usato dentro AppPreferencesProvider'
    );
  }

  return context;
}
