import type { AppLanguage } from '../theme/AppPreferencesProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TranslationRequest = {
  contentId: string;
  sourceLanguage: AppLanguage;
  targetLanguage: AppLanguage;
  text: string;
  updatedAt?: string;
};

export interface TranslationProvider {
  translate(request: TranslationRequest): Promise<string>;
}

class TranslationService {
  private provider: TranslationProvider | null = null;
  private cache = new Map<string, string>();

  configure(provider: TranslationProvider) {
    this.provider = provider;
    this.cache.clear();
  }

  async translate(request: TranslationRequest): Promise<string> {
    if (request.sourceLanguage === request.targetLanguage || !this.provider) {
      return request.text;
    }

    const cacheKey = [
      request.contentId,
      request.updatedAt ?? '',
      request.targetLanguage,
    ].join(':');
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const persisted = await AsyncStorage.getItem(`@crevia/translation:${cacheKey}`);
    if (persisted) {
      this.cache.set(cacheKey, persisted);
      return persisted;
    }

    const translated = await this.provider.translate(request);
    this.cache.set(cacheKey, translated);
    await AsyncStorage.setItem(`@crevia/translation:${cacheKey}`, translated);
    return translated;
  }
}

export const translationService = new TranslationService();
