import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { COLORS } from '../../../theme/colors';
import type { RootStackParamList } from '../../../navigation/types';
import { loginUser } from '../services/authService';
import { validateLogin } from '../validators/authValidator';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async () => {
    const validationError = validateLogin(email, password);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const result = await loginUser(email, password);

    setLoading(false);

    if (!result.success) {
      setError('Email o password non corretti');
      return;
    }

    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CREVIA</Text>
        <Text style={styles.subtitle}>Trova il progetto giusto per te</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Email"
          placeholderTextColor="#8A8A9A"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError('');
          }}
        />
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Password"
          placeholderTextColor="#8A8A9A"
          secureTextEntry
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
          }}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Password dimenticata?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Accedi</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sei un nuovo utente? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Registrati</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: COLORS.background,
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
  forgotButton: {
    alignSelf: 'center',
    marginTop: -4,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    //backgroundColor: COLORS.disabled,
  },
  buttonText: {
    color: COLORS.background,
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
});
