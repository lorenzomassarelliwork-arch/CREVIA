import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import {
  getAccountEmail,
  getBiometricAccessEnabled,
  setBiometricAccessEnabled,
  updateAccountEmail,
  updateAccountPassword,
} from '../../auth/services/accountSecurityService';
import createStyles from './SecuritySettingsScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'SecuritySettings'>;

const COPY = {
  it: {
    changeEmail: 'Modifica email',
    changePassword: 'Modifica password',
    passkey: 'Passkey',
    currentEmail: 'Email attuale',
    newEmail: 'Nuova email',
    confirmEmail: 'Conferma nuova email',
    currentPassword: 'Password attuale',
    newPassword: 'Nuova password',
    confirmPassword: 'Conferma nuova password',
    saveEmail: 'Salva nuova email',
    savePassword: 'Aggiorna password',
    invalidEmail: 'Inserisci un indirizzo email valido.',
    emailMismatch: 'Gli indirizzi email non coincidono.',
    passwordRequired: 'Compila tutti i campi.',
    passwordLength: 'La nuova password deve contenere almeno 8 caratteri.',
    passwordMismatch: 'Le nuove password non coincidono.',
    success: 'Modifica completata',
    emailSuccess: 'Il tuo indirizzo email è stato aggiornato.',
    passwordSuccess: 'La tua password è stata aggiornata.',
    error: 'Operazione non riuscita. Riprova.',
    biometricTitle: 'Accesso biometrico',
    biometricDescription:
      'Usa Face ID, Touch ID o l’impronta digitale disponibile sul dispositivo.',
    availableMethod: 'Metodo disponibile',
    noHardware: 'Biometria non supportata',
    notEnrolled: 'Configura prima la biometria nelle impostazioni del dispositivo.',
    enabled: 'Attivo',
    disabled: 'Non attivo',
    authPrompt: 'Conferma la tua identità per Crevia',
    cancel: 'Annulla',
    biometricError: 'Autenticazione biometrica non riuscita.',
    back: 'Torna a Profilo e Privacy',
  },
  en: {
    changeEmail: 'Change email',
    changePassword: 'Change password',
    passkey: 'Passkey',
    currentEmail: 'Current email',
    newEmail: 'New email',
    confirmEmail: 'Confirm new email',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    saveEmail: 'Save new email',
    savePassword: 'Update password',
    invalidEmail: 'Enter a valid email address.',
    emailMismatch: 'The email addresses do not match.',
    passwordRequired: 'Complete all fields.',
    passwordLength: 'The new password must contain at least 8 characters.',
    passwordMismatch: 'The new passwords do not match.',
    success: 'Change completed',
    emailSuccess: 'Your email address has been updated.',
    passwordSuccess: 'Your password has been updated.',
    error: 'The operation failed. Try again.',
    biometricTitle: 'Biometric access',
    biometricDescription:
      'Use Face ID, Touch ID or the fingerprint method available on your device.',
    availableMethod: 'Available method',
    noHardware: 'Biometrics are not supported',
    notEnrolled: 'Set up biometrics in your device settings first.',
    enabled: 'Enabled',
    disabled: 'Disabled',
    authPrompt: 'Confirm your identity for Crevia',
    cancel: 'Cancel',
    biometricError: 'Biometric authentication failed.',
    back: 'Back to Profile and Privacy',
  },
} as const;

export default function SecuritySettingsScreen({ navigation, route }: Props) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const copy = COPY[language];
  const { action } = route.params;
  const title = copy[action];

  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricMethod, setBiometricMethod] = useState('—');

  useEffect(() => {
    if (action === 'changeEmail') {
      void getAccountEmail().then((result) => setCurrentEmail(result.data ?? ''));
    }

    if (action === 'passkey') {
      void Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        getBiometricAccessEnabled(),
      ]).then(([hardware, enrolled, types, enabled]) => {
        setHasHardware(hardware);
        setIsEnrolled(enrolled);
        setBiometricEnabled(enabled && hardware && enrolled);

        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricMethod('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricMethod(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
        }
      }).catch(() => {
        setHasHardware(false);
        setIsEnrolled(false);
        setBiometricEnabled(false);
      });
    }
  }, [action]);

  const saveEmail = async () => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!validEmail.test(newEmail.trim())) {
      Alert.alert(title, copy.invalidEmail);
      return;
    }
    if (newEmail.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      Alert.alert(title, copy.emailMismatch);
      return;
    }

    setLoading(true);
    const result = await updateAccountEmail(newEmail);
    setLoading(false);
    if (result.error) {
      Alert.alert(title, copy.error);
      return;
    }
    setCurrentEmail(result.data ?? currentEmail);
    setNewEmail('');
    setConfirmEmail('');
    await triggerHaptic();
    Alert.alert(copy.success, copy.emailSuccess);
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(title, copy.passwordRequired);
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(title, copy.passwordLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(title, copy.passwordMismatch);
      return;
    }

    setLoading(true);
    const result = await updateAccountPassword(currentPassword, newPassword);
    setLoading(false);
    if (result.error) {
      Alert.alert(title, copy.error);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    await triggerHaptic();
    Alert.alert(copy.success, copy.passwordSuccess);
  };

  const toggleBiometricAccess = async () => {
    if (!hasHardware || !isEnrolled) return;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: copy.authPrompt,
      cancelLabel: copy.cancel,
      disableDeviceFallback: false,
    });

    if (!result.success) {
      Alert.alert(copy.biometricTitle, copy.biometricError);
      return;
    }

    const nextValue = !biometricEnabled;
    await setBiometricAccessEnabled(nextValue);
    setBiometricEnabled(nextValue);
    await triggerHaptic();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel={copy.back}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {action === 'changeEmail' ? (
          <View style={styles.card}>
            <Text style={styles.label}>{copy.currentEmail}</Text>
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyText}>{currentEmail || '—'}</Text>
            </View>
            <Text style={styles.label}>{copy.newEmail}</Text>
            <TextInput
              style={styles.input}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="nome@esempio.it"
              placeholderTextColor={colors.gray}
            />
            <Text style={styles.label}>{copy.confirmEmail}</Text>
            <TextInput
              style={styles.input}
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="nome@esempio.it"
              placeholderTextColor={colors.gray}
            />
            <SubmitButton
              label={copy.saveEmail}
              loading={loading}
              onPress={() => void saveEmail()}
              styles={styles}
              color={colors.white}
            />
          </View>
        ) : null}

        {action === 'changePassword' ? (
          <View style={styles.card}>
            <PasswordField
              label={copy.currentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              styles={styles}
              placeholderColor={colors.gray}
            />
            <PasswordField
              label={copy.newPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              styles={styles}
              placeholderColor={colors.gray}
            />
            <PasswordField
              label={copy.confirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              styles={styles}
              placeholderColor={colors.gray}
            />
            <SubmitButton
              label={copy.savePassword}
              loading={loading}
              onPress={() => void savePassword()}
              styles={styles}
              color={colors.white}
            />
          </View>
        ) : null}

        {action === 'passkey' ? (
          <View style={styles.card}>
            <View style={styles.biometricIcon}>
              <Ionicons name="finger-print" size={34} color={colors.primary} />
            </View>
            <Text style={styles.biometricTitle}>{copy.biometricTitle}</Text>
            <Text style={styles.biometricDescription}>
              {copy.biometricDescription}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.statusCopy}>
                <Text style={styles.statusLabel}>{copy.availableMethod}</Text>
                <Text style={styles.statusValue}>
                  {!hasHardware
                    ? copy.noHardware
                    : !isEnrolled
                      ? copy.notEnrolled
                      : biometricMethod}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                disabled={!hasHardware || !isEnrolled}
                onValueChange={() => void toggleBiometricAccess()}
                trackColor={{
                  false: colors.toggleTrackOff,
                  true: colors.toggleTrackOn,
                }}
                thumbColor={biometricEnabled ? colors.primary : colors.white}
              />
            </View>
            <Text style={styles.enabledText}>
              {biometricEnabled ? copy.enabled : copy.disabled}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type Styles = ReturnType<typeof createStyles>;

function PasswordField({
  label,
  value,
  onChangeText,
  styles,
  placeholderColor,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  styles: Styles;
  placeholderColor: string;
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordField}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          placeholder="••••••••"
          placeholderTextColor={placeholderColor}
        />
        <TouchableOpacity onPress={() => setHidden((current) => !current)}>
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={21}
            color={placeholderColor}
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

function SubmitButton({
  label,
  loading,
  onPress,
  styles,
  color,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
  styles: Styles;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.submitButton, loading && styles.submitButtonDisabled]}
      disabled={loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={styles.submitButtonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
