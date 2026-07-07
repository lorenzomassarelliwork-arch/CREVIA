import { Children, isValidElement, type ReactNode } from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';

import { useAppPreferences } from '../theme/AppPreferencesProvider';
import { translateUi } from './uiTranslations';

function translateNode(node: ReactNode, language: 'it' | 'en'): ReactNode {
  if (typeof node === 'string') return translateUi(node, language);
  if (Array.isArray(node)) return Children.map(node, (child) => translateNode(child, language));
  if (isValidElement(node)) return node;
  return node;
}

export function LocalizedText({ children, ...props }: TextProps) {
  const { language } = useAppPreferences();
  return <NativeText {...props}>{translateNode(children, language)}</NativeText>;
}

export function LocalizedTextInput({ placeholder, ...props }: TextInputProps) {
  const { language } = useAppPreferences();
  return (
    <NativeTextInput
      {...props}
      placeholder={placeholder ? translateUi(placeholder, language) : placeholder}
    />
  );
}
