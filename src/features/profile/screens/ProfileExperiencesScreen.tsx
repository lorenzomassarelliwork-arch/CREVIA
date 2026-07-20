import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { getExperiences, type Experience } from '../services/profileService';

type ProfileExperiencesScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfileExperiences'
>;

function formatExperienceDate(value: Date | string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('it-IT', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ProfileExperiencesScreen({
  navigation,
}: ProfileExperiencesScreenProps) {
  const { colors } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadExperiences = useCallback(async () => {
    setIsLoading(true);
    const response = await getExperiences();
    setExperiences(response.data ?? []);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadExperiences();
    }, [loadExperiences])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Indietro"
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={23} color={colors.textStrong} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Esperienze</Text>
          <Text style={styles.subtitle}>Tocca un esperienza per vedere tutti i dettagli</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={experiences.length === 0 ? styles.emptyList : styles.list}
          data={experiences}
          keyExtractor={(item) => item.id ?? item.titolo}
          renderItem={({ item }) => {
            const period = `${formatExperienceDate(item.inizio)} - ${
              item.inCorso ? 'Oggi' : formatExperienceDate(item.fine)
            }`;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!item.id}
                style={styles.experienceCard}
                onPress={() => {
                  if (item.id) {
                    navigation.navigate('ProfileExperienceDetail', {
                      experienceId: item.id,
                    });
                  }
                }}
              >
                <View style={styles.experienceIcon}>
                  <Ionicons name="briefcase-outline" size={19} color={colors.primary} />
                </View>
                <View style={styles.experienceCopy}>
                  <Text numberOfLines={1} style={styles.experienceTitle}>{item.titolo}</Text>
                  <Text numberOfLines={1} style={styles.experienceProject}>{item.progetto}</Text>
                  <Text style={styles.period}>{period}</Text>
                  <Text numberOfLines={2} style={styles.descriptionPreview}>
                    {item.descrizione}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={19} color={colors.gray} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={42} color={colors.gray} />
              <Text style={styles.emptyTitle}>Nessuna esperienza inserita</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors'], topInset: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: Math.max(topInset, 24) + 8,
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      backgroundColor: colors.background,
    },
    title: { color: colors.textStrong, fontSize: 20, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, gap: 10 },
    emptyList: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    emptyState: { alignItems: 'center', gap: 10 },
    emptyTitle: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
    experienceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    experienceIcon: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: colors.primarySoft,
    },
    experienceCopy: { flex: 1, minWidth: 0 },
    experienceTitle: { color: colors.textStrong, fontSize: 15, fontWeight: '800' },
    experienceProject: { color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 2 },
    period: { color: colors.gray, fontSize: 11, fontWeight: '700', marginTop: 5 },
    descriptionPreview: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  });
}
