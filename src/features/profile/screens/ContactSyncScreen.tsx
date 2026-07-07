import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import {
  getLastContactSync,
  syncDeviceContacts,
  type ContactSyncInfo,
} from '../services/contactSyncService';
import createStyles from './SettingsDetail.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactSync'>;

const COPY = {
  it: {
    header: 'Sincronizza contatti',
    title: 'Trova persone che conosci',
    description:
      'Crevia legge la rubrica e prepara la ricerca degli utenti registrati. I contatti non vengono salvati localmente dall’app.',
    contacts: 'Contatti sincronizzati',
    lastSync: 'Ultima sincronizzazione',
    never: 'Mai',
    sync: 'Sincronizza ora',
    resync: 'Sincronizza di nuovo',
    success: 'Sincronizzazione completata',
    successMessage: 'Sono stati letti {count} contatti dal dispositivo.',
    denied: 'Accesso ai contatti non consentito.',
    deniedMessage: 'Puoi abilitarlo dalle impostazioni di iOS.',
    settings: 'Apri impostazioni',
    cancel: 'Annulla',
    error: 'Non è stato possibile sincronizzare i contatti.',
    unavailable: 'La sincronizzazione dei contatti non è disponibile sul web.',
  },
  en: {
    header: 'Sync contacts',
    title: 'Find people you know',
    description:
      'Crevia reads the address book and prepares the search for registered users. Contacts are not stored locally by the app.',
    contacts: 'Synced contacts',
    lastSync: 'Last sync',
    never: 'Never',
    sync: 'Sync now',
    resync: 'Sync again',
    success: 'Sync completed',
    successMessage: '{count} contacts were read from the device.',
    denied: 'Contact access was not granted.',
    deniedMessage: 'You can enable it from iOS Settings.',
    settings: 'Open Settings',
    cancel: 'Cancel',
    error: 'Contacts could not be synchronized.',
    unavailable: 'Contact sync is unavailable on web.',
  },
} as const;

export default function ContactSyncScreen({ navigation }: Props) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = COPY[language];
  const [syncInfo, setSyncInfo] = useState<ContactSyncInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getLastContactSync().then(setSyncInfo);
  }, []);

  const syncContacts = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(copy.header, copy.unavailable);
      return;
    }

    setLoading(true);
    const result = await syncDeviceContacts();
    setLoading(false);

    if (result.error === 'permission_denied') {
      Alert.alert(copy.denied, copy.deniedMessage, [
        { text: copy.cancel, style: 'cancel' },
        { text: copy.settings, onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
    if (result.error || !result.data) {
      Alert.alert(copy.header, copy.error);
      return;
    }

    setSyncInfo(result.data);
    await triggerHaptic();
    Alert.alert(
      copy.success,
      copy.successMessage.replace('{count}', String(result.data.contactCount))
    );
  };

  const formattedDate = syncInfo
    ? new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(syncInfo.lastSyncAt))
    : copy.never;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{copy.header}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="people" size={30} color={colors.primary} />
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.description}>{copy.description}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{copy.contacts}</Text>
            <Text style={styles.infoValue}>{syncInfo?.contactCount ?? 0}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>{copy.lastSync}</Text>
            <Text style={styles.infoValue}>{formattedDate}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          disabled={loading}
          onPress={() => void syncContacts()}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="sync" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>
                {syncInfo ? copy.resync : copy.sync}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
