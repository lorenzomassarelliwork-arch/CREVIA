import { getFeed } from '../../../api/api';
import type { Post } from '../../../api/api';

export const fetchProjects = async (): Promise<Post[]> => {
  try {
    const { data, error } = await getFeed();
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Errore nel recupero progetti:", error);
    return []; // Ritorna array vuoto in caso di errore
  }
};
