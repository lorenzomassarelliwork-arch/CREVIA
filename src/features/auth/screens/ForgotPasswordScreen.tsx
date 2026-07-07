import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { COLORS } from '../../../theme/colors';
import type { RootStackParamList } from '../../../navigation/types';
import { requestPasswordReset } from '../services/authService';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from '../../../i18n/LocalizedText';

type ForgotPasswordScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ForgotPassword'
>;

export default function ForgotPasswordScreen({
  navigation,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [inviato, setInviato] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleInvia = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setError('Inserisci la tua email');
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Inserisci un formato email valido');
      return;
    }

    setError('');
    setLoading(true);

    const { success } = await requestPasswordReset(email);

    setLoading(false);

    if (!success) {
      setError("Errore durante l'invio. Riprova.");
      return;
    }

    setInviato(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
      </TouchableOpacity>

      {!inviato ? (
        <>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={40}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.title}>Password dimenticata?</Text>
            <Text style={styles.subtitle}>
              Inserisci la tua email e ti invieremo un link per reimpostare la
              password.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Email"
              placeholderTextColor={COLORS.gray}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError('');
              }}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleInvia}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Invia link di reset</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.footer} onPress={navigation.goBack}>
            <Text style={styles.footerText}>Torna al </Text>
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark-circle"
              size={70}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.successTitle}>Email inviata!</Text>
          <Text style={styles.successSubtitle}>
            Abbiamo inviato un link di reset a{'\n'}
            <Text style={styles.successEmail}>{email}</Text>
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Torna al Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.secondary,
  },
  inputError: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -8,
    marginLeft: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: COLORS.secondary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  link: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: -60,
  },
  successIcon: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  successSubtitle: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  successEmail: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  successHint: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: -4,
  },
});
