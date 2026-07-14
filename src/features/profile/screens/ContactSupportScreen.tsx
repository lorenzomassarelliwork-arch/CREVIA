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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../navigation/types';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import { getAccountEmail } from '../../auth/services/accountSecurityService';
import { sendSupportRequest } from '../services/supportService';
import createStyles from './SettingsDetail.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactSupport'>;

const COPY = {
  it: {
    header: 'Contattaci',
    title: 'Come possiamo aiutarti?',
    description: 'Invia una richiesta al team Crevia. Ti risponderemo via email.',
    email: 'Email di risposta',
    subject: 'Argomento',
    message: 'Messaggio',
    placeholder: 'Descrivi il problema o la richiesta...',
    subjects: ['Problema tecnico', 'Account', 'Privacy', 'Altro'],
    send: 'Invia richiesta',
    invalidEmail: 'Inserisci un indirizzo email valido.',
    shortMessage: 'Il messaggio deve contenere almeno 20 caratteri.',
    success: 'Richiesta inviata',
    successMessage: 'Ticket {ticket}. Ti risponderemo appena possibile.',
    error: 'Invio non riuscito. Riprova.',
  },
  en: {
    header: 'Contact us',
    title: 'How can we help?',
    description: 'Send a request to the Crevia team. We will reply by email.',
    email: 'Reply email',
    subject: 'Subject',
    message: 'Message',
    placeholder: 'Describe the issue or request...',
    subjects: ['Technical issue', 'Account', 'Privacy', 'Other'],
    send: 'Send request',
    invalidEmail: 'Enter a valid email address.',
    shortMessage: 'The message must contain at least 20 characters.',
    success: 'Request sent',
    successMessage: 'Ticket {ticket}. We will reply as soon as possible.',
    error: 'The request could not be sent. Try again.',
  },
} as const;

export default function ContactSupportScreen({ navigation }: Props) {
  const { colors, language, triggerHaptic } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.bottom, insets.top]
  );
  const copy = COPY[language];
  const [email, setEmail] = useState('');
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getAccountEmail().then((result) => setEmail(result.data ?? ''));
  }, []);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert(copy.header, copy.invalidEmail);
      return;
    }
    if (message.trim().length < 20) {
      Alert.alert(copy.header, copy.shortMessage);
      return;
    }

    setLoading(true);
    const result = await sendSupportRequest({
      email: email.trim(),
      subject: copy.subjects[subjectIndex],
      message: message.trim(),
    });
    setLoading(false);

    if (result.error || !result.ticketId) {
      Alert.alert(copy.header, copy.error);
      return;
    }

    setMessage('');
    await triggerHaptic();
    Alert.alert(
      copy.success,
      copy.successMessage.replace('{ticket}', result.ticketId)
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{copy.header}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="chatbubbles" size={29} color={colors.primary} />
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.description}>{copy.description}</Text>

          <Text style={styles.label}>{copy.email}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="nome@esempio.it"
            placeholderTextColor={colors.gray}
          />

          <Text style={styles.label}>{copy.subject}</Text>
          <View style={styles.subjectGrid}>
            {copy.subjects.map((subject, index) => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.subjectButton,
                  subjectIndex === index && styles.subjectButtonActive,
                ]}
                onPress={() => setSubjectIndex(index)}
              >
                <Text
                  style={[
                    styles.subjectText,
                    subjectIndex === index && styles.subjectTextActive,
                  ]}
                >
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{copy.message}</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
            placeholder={copy.placeholder}
            placeholderTextColor={colors.gray}
          />
          <Text style={styles.counter}>{message.length}/1000</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          disabled={loading}
          onPress={() => void submit()}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>{copy.send}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
