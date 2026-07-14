import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  AccountManagementAction,
  RootStackParamList,
  SecuritySettingsAction,
  SettingsCategoryKey,
} from '../../../navigation/types';
import {
  useAppPreferences,
  type AppLanguage,
  type AppThemeMode,
} from '../../../theme/AppPreferencesProvider';
import createStyles from './SettingsCategoryScreen.styles';
import { SETTINGS_COPY } from './settingsCopy';

type SettingsCategoryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'SettingsCategory'
>;

type PickerType = 'language' | 'theme' | null;

const CATEGORY_ICONS: Record<
  SettingsCategoryKey,
  (keyof typeof Ionicons.glyphMap)[]
> = {
  personalization: [
    'language-outline',
    'contrast-outline',
    'phone-portrait-outline',
  ],
  profilePrivacy: [
    'mail-outline',
    'key-outline',
    'finger-print-outline',
    'document-text-outline',
  ],
  appExperience: ['people-outline'],
  accountManagement: ['pause-circle-outline', 'trash-outline'],
  help: ['chatbubble-ellipses-outline'],
};

export default function SettingsCategoryScreen({
  navigation,
  route,
}: SettingsCategoryScreenProps) {
  const {
    colors,
    hapticsEnabled,
    language,
    setHapticsEnabled,
    setLanguage,
    setThemeMode,
    themeMode,
    triggerHaptic,
  } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const [pickerType, setPickerType] = useState<PickerType>(null);
  const copy = SETTINGS_COPY[language];
  const categoryKey = route.params.category;
  const category = copy.categories[categoryKey];
  const isPersonalization = categoryKey === 'personalization';

  const currentValues = isPersonalization
    ? [
        copy.languages[language],
        copy.themes[themeMode],
        hapticsEnabled ? copy.active : copy.inactive,
      ]
    : [];

  const languageOptions: { label: string; value: AppLanguage }[] = [
    { label: copy.languages.it, value: 'it' },
    { label: copy.languages.en, value: 'en' },
  ];
  const themeOptions: { label: string; value: AppThemeMode }[] = [
    { label: copy.themes.automatic, value: 'automatic' },
    { label: copy.themes.light, value: 'light' },
    { label: copy.themes.dark, value: 'dark' },
  ];

  const openPicker = (type: Exclude<PickerType, null>) => {
    void triggerHaptic();
    setPickerType(type);
  };

  const openProfilePrivacyItem = (index: number) => {
    void triggerHaptic();

    if (index === 3) {
      navigation.navigate('TerminiCondizioni', { mode: 'view' });
      return;
    }

    const actions: SecuritySettingsAction[] = [
      'changeEmail',
      'changePassword',
      'passkey',
    ];
    navigation.navigate('SecuritySettings', { action: actions[index] });
  };

  const openRemainingItem = (index: number) => {
    void triggerHaptic();

    if (categoryKey === 'appExperience') {
      navigation.navigate('ContactSync');
      return;
    }
    if (categoryKey === 'accountManagement') {
      const actions: AccountManagementAction[] = [
        'suspendAccount',
        'deleteAccount',
      ];
      navigation.navigate('AccountManagement', { action: actions[index] });
      return;
    }
    if (categoryKey === 'help') {
      navigation.navigate('ContactSupport');
    }
  };

  const selectLanguage = async (value: AppLanguage) => {
    await triggerHaptic();
    await setLanguage(value);
    setPickerType(null);
  };

  const selectTheme = async (value: AppThemeMode) => {
    await triggerHaptic();
    await setThemeMode(value);
    setPickerType(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel={copy.backToSettings}
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {category.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>{category.description}</Text>

        <View style={styles.menuCard}>
          {category.items.map((title, index) => {
            const isHapticsRow = isPersonalization && index === 2;
            const isProfilePrivacyRow = categoryKey === 'profilePrivacy';
            const isPressable = !isHapticsRow;
            const RowComponent = isPressable
              ? TouchableOpacity
              : View;

            return (
              <RowComponent
                key={title}
                style={[
                  styles.menuRow,
                  index === category.items.length - 1 && styles.menuRowLast,
                ]}
                {...(isPressable
                  ? {
                      onPress: () =>
                        isProfilePrivacyRow
                          ? openProfilePrivacyItem(index)
                          : isPersonalization
                            ? openPicker(index === 0 ? 'language' : 'theme')
                            : openRemainingItem(index),
                    }
                  : {})}
              >
                <View style={styles.iconBox}>
                  <Ionicons
                    name={CATEGORY_ICONS[categoryKey][index]}
                    size={21}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuCopy}>
                  <Text style={styles.menuTitle}>{title}</Text>
                  {isPersonalization ? (
                    <Text style={styles.menuValue}>{currentValues[index]}</Text>
                  ) : null}
                </View>
                {isHapticsRow ? (
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={(enabled) => void setHapticsEnabled(enabled)}
                    trackColor={{
                      false: colors.toggleTrackOff,
                      true: colors.toggleTrackOn,
                    }}
                    thumbColor={hapticsEnabled ? colors.primary : colors.white}
                    ios_backgroundColor={colors.toggleTrackOff}
                  />
                ) : (
                  <>
                    {categoryKey === 'accountManagement' && index === 0 ? (
                      <Text style={styles.badge}>{copy.subscriberOnly}</Text>
                    ) : null}
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.gray}
                    />
                  </>
                )}
              </RowComponent>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={pickerType !== null}
        onRequestClose={() => setPickerType(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerType(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {pickerType === 'language' ? copy.chooseLanguage : copy.chooseTheme}
            </Text>
            {(pickerType === 'language' ? languageOptions : themeOptions).map(
              (option) => {
                const selected =
                  pickerType === 'language'
                    ? option.value === language
                    : option.value === themeMode;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.optionRow}
                    onPress={() => {
                      if (pickerType === 'language') {
                        void selectLanguage(option.value as AppLanguage);
                      } else {
                        void selectTheme(option.value as AppThemeMode);
                      }
                    }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {option.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              }
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
