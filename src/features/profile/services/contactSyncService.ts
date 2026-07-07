import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';

export type ContactSyncInfo = {
  contactCount: number;
  lastSyncAt: string;
};

type ContactSyncResult = {
  data: ContactSyncInfo | null;
  error: 'permission_denied' | 'sync_failed' | null;
};

const STORAGE_KEY = '@crevia/contact-sync';

export async function getLastContactSync(): Promise<ContactSyncInfo | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ContactSyncInfo) : null;
  } catch {
    return null;
  }
}

export async function syncDeviceContacts(): Promise<ContactSyncResult> {
  try {
    const permission = await Contacts.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      return { data: null, error: 'permission_denied' };
    }

    const response = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });
    const syncInfo: ContactSyncInfo = {
      contactCount: response.data.length,
      lastSyncAt: new Date().toISOString(),
    };

    // Salviamo solo il riepilogo; i dati della rubrica non restano sul dispositivo.
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(syncInfo));
    return { data: syncInfo, error: null };
  } catch {
    return { data: null, error: 'sync_failed' };
  }
}
