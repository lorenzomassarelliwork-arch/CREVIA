import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import type {
  RootStackParamList,
  SettingsCategoryKey,
} from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import createStyles from './SettingsScreen.styles';
import { SETTINGS_COPY } from './settingsCopy';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const CATEGORY_ICONS: Record<
  SettingsCategoryKey,
  keyof typeof Ionicons.glyphMap
> = {
  personalization: 'color-palette-outline',
  profilePrivacy: 'shield-checkmark-outline',
  appExperience: 'sparkles-outline',
  accountManagement: 'person-circle-outline',
  help: 'help-circle-outline',
};

const CATEGORY_KEYS = Object.keys(CATEGORY_ICONS) as SettingsCategoryKey[];

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = SETTINGS_COPY[language];
  const appVersion = Application.nativeApplicationVersion ?? '1.0.0';

  const handleLogout = () => {
    void triggerHaptic();
    Alert.alert(copy.logoutTitle, copy.logoutMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.exit,
        style: 'destructive',
        onPress: () => {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel={copy.backToProfile}
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{copy.settings}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>{copy.introTitle}</Text>
          <Text style={styles.introDescription}>{copy.introDescription}</Text>
        </View>

        <View style={styles.menuCard}>
          {CATEGORY_KEYS.map((categoryKey, index) => {
            const category = copy.categories[categoryKey];

            return (
              <TouchableOpacity
                key={categoryKey}
                accessibilityRole="button"
                style={[
                  styles.menuRow,
                  index === CATEGORY_KEYS.length - 1 && styles.menuRowLast,
                ]}
                onPress={() => {
                  void triggerHaptic();
                  navigation.navigate('SettingsCategory', { category: categoryKey });
                }}
              >
                <View style={styles.iconBox}>
                  <Ionicons
                    name={CATEGORY_ICONS[categoryKey]}
                    size={21}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuCopy}>
                  <Text style={styles.menuTitle}>{category.title}</Text>
                  <Text style={styles.menuDescription}>{category.summary}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>
            {copy.version} {appVersion}
          </Text>
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} Crevia
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.delete} />
            <Text style={styles.logoutText}>{copy.exit}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
