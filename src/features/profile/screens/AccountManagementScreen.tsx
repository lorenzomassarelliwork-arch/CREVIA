import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import {
  deleteAccount,
  getAccountManagementState,
  suspendAccount,
  type AccountManagementState,
} from '../../auth/services/accountManagementService';
import createStyles from './SettingsDetail.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountManagement'>;

const COPY = {
  it: {
    suspendHeader: 'Sospendi account',
    deleteHeader: 'Elimina account',
    suspendTitle: 'Metti in pausa il tuo account',
    suspendDescription:
      'Il profilo e i contenuti non saranno visibili finché l’account non verrà riattivato.',
    subscriber: 'Abbonamento richiesto',
    subscriberActive: 'Crevia Plus attivo',
    subscriberMissing: 'Disponibile solo per utenti abbonati',
    alreadySuspended: 'Account già sospeso',
    suspendButton: 'Sospendi account',
    suspendConfirm: 'Confermi la sospensione dell’account?',
    suspendConfirmMessage: 'Verrai disconnesso da Crevia.',
    cancel: 'Annulla',
    confirm: 'Sospendi',
    deleteTitle: 'Eliminazione definitiva',
    deleteDescription:
      'Profilo, progetti, esperienze e dati associati verranno eliminati definitivamente.',
    deleteWarning: 'Questa operazione non può essere annullata.',
    deleteInstruction: 'Scrivi ELIMINA per confermare',
    deleteWord: 'ELIMINA',
    deleteButton: 'Elimina definitivamente',
    deleteConfirm: 'Ultima conferma',
    deleteConfirmMessage: 'Vuoi eliminare definitivamente il tuo account?',
    deleteAction: 'Elimina',
    error: 'Operazione non riuscita. Riprova.',
  },
  en: {
    suspendHeader: 'Suspend account',
    deleteHeader: 'Delete account',
    suspendTitle: 'Pause your account',
    suspendDescription:
      'Your profile and content will be hidden until the account is reactivated.',
    subscriber: 'Subscription required',
    subscriberActive: 'Crevia Plus active',
    subscriberMissing: 'Available to subscribers only',
    alreadySuspended: 'Account already suspended',
    suspendButton: 'Suspend account',
    suspendConfirm: 'Suspend your account?',
    suspendConfirmMessage: 'You will be signed out of Crevia.',
    cancel: 'Cancel',
    confirm: 'Suspend',
    deleteTitle: 'Permanent deletion',
    deleteDescription:
      'Your profile, projects, experience and associated data will be permanently deleted.',
    deleteWarning: 'This action cannot be undone.',
    deleteInstruction: 'Type DELETE to confirm',
    deleteWord: 'DELETE',
    deleteButton: 'Delete permanently',
    deleteConfirm: 'Final confirmation',
    deleteConfirmMessage: 'Permanently delete your account?',
    deleteAction: 'Delete',
    error: 'The operation failed. Try again.',
  },
} as const;

export default function AccountManagementScreen({ navigation, route }: Props) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const copy = COPY[language];
  const isSuspend = route.params.action === 'suspendAccount';
  const [state, setState] = useState<AccountManagementState | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getAccountManagementState().then(setState);
  }, []);

  const performSuspend = async () => {
    setLoading(true);
    const result = await suspendAccount();
    setLoading(false);
    if (result.error) {
      Alert.alert(copy.suspendHeader, copy.error);
      return;
    }
    await triggerHaptic();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const requestSuspend = () => {
    Alert.alert(copy.suspendConfirm, copy.suspendConfirmMessage, [
      { text: copy.cancel, style: 'cancel' },
      { text: copy.confirm, style: 'destructive', onPress: () => void performSuspend() },
    ]);
  };

  const performDelete = async () => {
    setLoading(true);
    const result = await deleteAccount();
    setLoading(false);
    if (result.error) {
      Alert.alert(copy.deleteHeader, copy.error);
      return;
    }
    await triggerHaptic();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const requestDelete = () => {
    Alert.alert(copy.deleteConfirm, copy.deleteConfirmMessage, [
      { text: copy.cancel, style: 'cancel' },
      { text: copy.deleteAction, style: 'destructive', onPress: () => void performDelete() },
    ]);
  };

  const header = isSuspend ? copy.suspendHeader : copy.deleteHeader;
  const canSuspend = Boolean(state?.isSubscriber && !state.isSuspended);
  const canDelete = confirmation.trim().toUpperCase() === copy.deleteWord;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{header}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons
              name={isSuspend ? 'pause-circle' : 'trash'}
              size={31}
              color={isSuspend ? colors.primary : colors.delete}
            />
          </View>
          <Text style={styles.title}>
            {isSuspend ? copy.suspendTitle : copy.deleteTitle}
          </Text>
          <Text style={styles.description}>
            {isSuspend ? copy.suspendDescription : copy.deleteDescription}
          </Text>

          {isSuspend ? (
            <>
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>{copy.subscriber}</Text>
                <Text style={styles.infoValue}>
                  {state?.isSubscriber ? copy.subscriberActive : copy.subscriberMissing}
                </Text>
              </View>
              {state?.isSuspended ? (
                <Text style={styles.warningText}>{copy.alreadySuspended}</Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.warningText}>{copy.deleteWarning}</Text>
              <Text style={styles.label}>{copy.deleteInstruction}</Text>
              <TextInput
                style={[styles.input, styles.confirmationInput]}
                value={confirmation}
                onChangeText={setConfirmation}
                autoCapitalize="characters"
                placeholder={copy.deleteWord}
                placeholderTextColor={colors.gray}
              />
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.dangerButton,
            (!(isSuspend ? canSuspend : canDelete) || loading) && styles.dangerButtonDisabled,
          ]}
          disabled={!(isSuspend ? canSuspend : canDelete) || loading}
          onPress={isSuspend ? requestSuspend : requestDelete}
        >
          {loading ? (
            <ActivityIndicator color={colors.delete} />
          ) : (
            <>
              <Ionicons
                name={isSuspend ? 'pause-outline' : 'trash-outline'}
                size={20}
                color={colors.delete}
              />
              <Text style={styles.dangerButtonText}>
                {isSuspend ? copy.suspendButton : copy.deleteButton}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
