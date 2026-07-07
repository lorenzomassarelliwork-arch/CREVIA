import AsyncStorage from '@react-native-async-storage/async-storage';

export type AccountManagementState = {
  isSubscriber: boolean;
  isSuspended: boolean;
};

const SUSPENDED_KEY = '@crevia/account-suspended';
const DELETED_KEY = '@crevia/account-deleted';

export async function getAccountManagementState(): Promise<AccountManagementState> {
  return {
    // Mock abbonato per consentire il test del flusso; arriverà dal backend.
    isSubscriber: true,
    isSuspended: (await AsyncStorage.getItem(SUSPENDED_KEY)) === 'true',
  };
}

export async function suspendAccount(): Promise<{ error: string | null }> {
  const state = await getAccountManagementState();
  if (!state.isSubscriber) return { error: 'subscribers_only' };

  await AsyncStorage.setItem(SUSPENDED_KEY, 'true');
  return { error: null };
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  try {
    await AsyncStorage.multiRemove([
      '@crevia/account-email',
      '@crevia/biometric-enabled',
      '@crevia/contact-sync',
      SUSPENDED_KEY,
    ]);
    await AsyncStorage.setItem(DELETED_KEY, 'true');
    return { error: null };
  } catch {
    return { error: 'delete_failed' };
  }
}
