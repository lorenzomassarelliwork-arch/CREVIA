import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../navigation/types';
import type { ColorPalette } from '../../../theme/colors';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from '../../../i18n/LocalizedText';
import { completeBuilderProfile } from '../../profile/services/profileService';

type BuilderProfileSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'BuilderProfileSetup'
>;

export default function BuilderProfileSetupScreen({
  navigation,
  route,
}: BuilderProfileSetupScreenProps) {
  const { colors } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const registration = route.params.registration;
  const [form, setForm] = useState({
    nome: `${registration.nome} ${registration.cognome}`.trim(),
    ruolo: registration.mansione || 'Builder',
    settore: registration.settore,
    bio: '',
    dataNascita: registration.dataNascita,
    nazione: registration.statoDomicilio || registration.statoResidenza,
    citta: registration.cittaDomicilio || registration.cittaResidenza,
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const completeProfile = async () => {
    if (
      !form.nome.trim() ||
      !form.ruolo.trim() ||
      !form.settore.trim() ||
      !form.bio.trim() ||
      !form.citta.trim()
    ) {
      Alert.alert(
        'Completa il profilo builder',
        'Inserisci nome, ruolo, settore, bio e citta prima di entrare in Crevia.'
      );
      return;
    }

    setLoading(true);
    const response = await completeBuilderProfile(form);
    setLoading(false);

    if (response.error) {
      Alert.alert('Profilo non salvato', response.error);
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Profile' } }],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="construct-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Crea il tuo profilo builder</Text>
        <Text style={styles.subtitle}>
          Prima crei la tua identita su Crevia, poi potrai aprire pagine progetto col tuo nome come founder.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nome pubblico *</Text>
          <TextInput
            style={styles.input}
            value={form.nome}
            onChangeText={(text) => updateField('nome', text)}
          />

          <Text style={styles.label}>Ruolo builder *</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. Founder, Designer, Developer"
            placeholderTextColor={colors.gray}
            value={form.ruolo}
            onChangeText={(text) => updateField('ruolo', text)}
          />

          <Text style={styles.label}>Settore *</Text>
          <TextInput
            style={styles.input}
            placeholder="Es. Tecnologia"
            placeholderTextColor={colors.gray}
            value={form.settore}
            onChangeText={(text) => updateField('settore', text)}
          />

          <Text style={styles.label}>Citta *</Text>
          <TextInput
            style={styles.input}
            value={form.citta}
            onChangeText={(text) => updateField('citta', text)}
          />

          <Text style={styles.label}>Bio builder *</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            multiline
            placeholder="Racconta cosa sai fare e che tipo di progetti vuoi costruire."
            placeholderTextColor={colors.gray}
            value={form.bio}
            onChangeText={(text) => updateField('bio', text)}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.82}
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={completeProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Completa profilo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (
  colors: ColorPalette,
  topInset: number,
  bottomInset: number
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: 24,
      paddingTop: Math.max(topInset, 24) + 28,
      paddingBottom: 34 + Math.max(bottomInset, 10),
    },
    iconWrap: {
      width: 58,
      height: 58,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textStrong,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMuted,
      marginBottom: 24,
    },
    form: { gap: 10 },
    label: { fontSize: 13, fontWeight: '700', color: colors.secondary },
    input: {
      backgroundColor: colors.inputSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      color: colors.textStrong,
      fontSize: 15,
    },
    bioInput: { minHeight: 118, textAlignVertical: 'top' },
    primaryButton: {
      height: 50,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
    },
    primaryButtonDisabled: { opacity: 0.7 },
    primaryButtonText: {
      color: colors.white,
      fontWeight: '800',
      fontSize: 15,
    },
  });
