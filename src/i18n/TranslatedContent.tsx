import { useEffect, useState } from 'react';
import { Text, type TextProps } from 'react-native';

import { useAppPreferences, type AppLanguage } from '../theme/AppPreferencesProvider';
import { translationService } from './translationService';

type TranslatedContentProps = TextProps & {
  contentId: string;
  sourceLanguage: AppLanguage;
  text: string;
  updatedAt?: string;
};

export function TranslatedContent({
  contentId,
  sourceLanguage,
  text,
  updatedAt,
  ...textProps
}: TranslatedContentProps) {
  const { language } = useAppPreferences();
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let active = true;
    setDisplayText(text);

    translationService
      .translate({ contentId, sourceLanguage, targetLanguage: language, text, updatedAt })
      .then((translated) => {
        if (active) setDisplayText(translated);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [contentId, language, sourceLanguage, text, updatedAt]);

  return <Text {...textProps}>{displayText}</Text>;
}
