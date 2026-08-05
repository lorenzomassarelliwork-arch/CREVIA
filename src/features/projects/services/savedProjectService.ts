import AsyncStorage from '@react-native-async-storage/async-storage';

type SavedProjectsStore = Record<string, string[]>;

const STORAGE_KEY = '@crevia/saved-projects';
const CURRENT_USER_ID = 'current-user';
const DEFAULT_SAVED_PROJECT_IDS = ['1', '4'];

const readStore = async (): Promise<SavedProjectsStore> => {
  try {
    const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (!storedValue) return {};

    const parsedValue = JSON.parse(storedValue) as SavedProjectsStore;
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch {
    return {};
  }
};

const writeStore = async (store: SavedProjectsStore) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export async function getSavedProjectIds(userId: string): Promise<string[]> {
  const store = await readStore();

  if (!Object.prototype.hasOwnProperty.call(store, userId)) {
    return userId === CURRENT_USER_ID ? [...DEFAULT_SAVED_PROJECT_IDS] : [];
  }

  return Array.from(new Set(store[userId] ?? []));
}

export async function setProjectSaved(
  userId: string,
  projectId: string,
  isSaved: boolean
): Promise<string[]> {
  const store = await readStore();
  const currentIds = new Set(
    Object.prototype.hasOwnProperty.call(store, userId)
      ? store[userId] ?? []
      : userId === CURRENT_USER_ID
        ? DEFAULT_SAVED_PROJECT_IDS
        : []
  );

  if (isSaved) {
    currentIds.add(projectId);
  } else {
    currentIds.delete(projectId);
  }

  const nextIds = Array.from(currentIds);
  await writeStore({ ...store, [userId]: nextIds });
  return nextIds;
}
