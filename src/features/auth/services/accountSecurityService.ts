import AsyncStorage from '@react-native-async-storage/async-storage';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

const EMAIL_KEY = '@crevia/account-email';
const BIOMETRIC_KEY = '@crevia/biometric-enabled';
const DEFAULT_EMAIL = 'utente@crevia.it';

export async function getAccountEmail(): Promise<ServiceResult<string>> {
  try {
    return {
      data: (await AsyncStorage.getItem(EMAIL_KEY)) ?? DEFAULT_EMAIL,
      error: null,
    };
  } catch {
    return { data: DEFAULT_EMAIL, error: null };
  }
}

export async function updateAccountEmail(
  email: string
): Promise<ServiceResult<string>> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    await AsyncStorage.setItem(EMAIL_KEY, normalizedEmail);
    return { data: normalizedEmail, error: null };
  } catch {
    return { data: null, error: 'email_update_failed' };
  }
}

export async function updateAccountPassword(
  _currentPassword: string,
  _newPassword: string
): Promise<ServiceResult<null>> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return { data: null, error: null };
}

export async function getBiometricAccessEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(BIOMETRIC_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricAccessEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_KEY, String(enabled));
}
