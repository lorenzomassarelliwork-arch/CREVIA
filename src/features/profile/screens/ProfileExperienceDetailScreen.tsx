import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { getExperiences, updateExperience, type Experience } from '../services/profileService';

type ProfileExperienceDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfileExperienceDetail'
>;

function formatExperienceDate(value: Date | string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('it-IT', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ProfileExperienceDetailScreen({
  navigation,
  route,
}: ProfileExperienceDetailScreenProps) {
  const { colors, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top), [colors, insets.top]);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadExperience = useCallback(async () => {
    setIsLoading(true);
    const response = await getExperiences();
    const selectedExperience = (response.data ?? []).find(
      (item) => item.id === route.params.experienceId
    ) ?? null;
    setExperience(selectedExperience);
    setDescriptionDraft(selectedExperience?.descrizione ?? '');
    setIsLoading(false);
  }, [route.params.experienceId]);

  useEffect(() => {
    void loadExperience();
  }, [loadExperience]);

  const saveDescription = async () => {
    if (!experience || isSaving) return;

    setIsSaving(true);
    const response = await updateExperience({
      ...experience,
      descrizione: descriptionDraft.trim(),
    });
    if (response.data) {
      setExperience(response.data);
      setDescriptionDraft(response.data.descrizione);
      setIsEditing(false);
      void triggerHaptic();
    } else {
      Alert.alert('Esperienza non aggiornata', response.error ?? 'Riprova tra poco.');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerState]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!experience) {
    return (
      <View style={[styles.container, styles.centerState]}>
        <Ionicons name="briefcase-outline" size={42} color={colors.gray} />
        <Text style={styles.emptyTitle}>Esperienza non trovata</Text>
        <TouchableOpacity style={styles.backToListButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backToListText}>Torna alle esperienze</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const period = `${formatExperienceDate(experience.inizio)} - ${
    experience.inCorso ? 'Oggi' : formatExperienceDate(experience.fine)
  }`;

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
        <Text numberOfLines={1} style={styles.headerTitle}>{experience.titolo}</Text>
        <TouchableOpacity
          accessibilityLabel="Modifica descrizione"
          accessibilityRole="button"
          style={styles.editButton}
          onPress={() => {
            setDescriptionDraft(experience.descrizione);
            setIsEditing(true);
            void triggerHaptic();
          }}
        >
          <Ionicons name="pencil" size={17} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons name="briefcase-outline" size={27} color={colors.primary} />
        </View>
        <Text style={styles.title}>{experience.titolo}</Text>
        <Text style={styles.project}>{experience.progetto}</Text>
        <Text style={styles.period}>{period}</Text>
        {experience.settore ? <Text style={styles.sector}>{experience.settore}</Text> : null}

        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionLabel}>Descrizione</Text>
          {isEditing ? (
            <>
              <TextInput
                multiline
                autoFocus
                style={styles.descriptionInput}
                value={descriptionDraft}
                onChangeText={setDescriptionDraft}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  disabled={isSaving}
                  onPress={() => {
                    setDescriptionDraft(experience.descrizione);
                    setIsEditing(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  disabled={isSaving}
                  onPress={() => void saveDescription()}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Salva</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.description}>{experience.descrizione}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppPreferences>['colors'], topInset: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerState: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
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
    headerTitle: { flex: 1, color: colors.textStrong, fontSize: 17, fontWeight: '800' },
    editButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      backgroundColor: colors.primarySoft,
    },
    content: { padding: 20, paddingBottom: 44 },
    iconWrap: {
      width: 62,
      height: 62,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      backgroundColor: colors.primarySoft,
    },
    title: { color: colors.textStrong, fontSize: 23, fontWeight: '800', marginTop: 17 },
    project: { color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: 4 },
    period: { color: colors.gray, fontSize: 12, fontWeight: '700', marginTop: 12 },
    sector: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
    descriptionCard: {
      marginTop: 24,
      padding: 17,
      borderRadius: 18,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    descriptionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
    description: { color: colors.textStrong, fontSize: 15, lineHeight: 23, marginTop: 10 },
    descriptionInput: {
      minHeight: 164,
      marginTop: 10,
      padding: 12,
      borderRadius: 13,
      color: colors.textStrong,
      fontSize: 15,
      lineHeight: 23,
      textAlignVertical: 'top',
      backgroundColor: colors.inputSurface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
    cancelButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 11 },
    cancelButtonText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
    saveButton: {
      minWidth: 74,
      minHeight: 38,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 15,
      borderRadius: 11,
      backgroundColor: colors.primary,
    },
    saveButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
    emptyTitle: { color: colors.textStrong, fontSize: 17, fontWeight: '800' },
    backToListButton: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.primary },
    backToListText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  });
}
