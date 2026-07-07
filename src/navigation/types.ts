import type { NavigatorScreenParams } from '@react-navigation/native';

export type SettingsCategoryKey =
  | 'personalization'
  | 'profilePrivacy'
  | 'appExperience'
  | 'accountManagement'
  | 'help';

export type SecuritySettingsAction =
  | 'changeEmail'
  | 'changePassword'
  | 'passkey';

export type AccountManagementAction = 'suspendAccount' | 'deleteAccount';

export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Search: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: { terminiAccettati?: boolean } | undefined;
  ForgotPassword: undefined;
  TerminiCondizioni: { mode?: 'registration' | 'view' } | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Conversation: { conversationId: string };
  GroupInfo: { conversationId: string };
  ContactInfo: { conversationId: string };
  Settings: undefined;
  SettingsCategory: { category: SettingsCategoryKey };
  SecuritySettings: { action: SecuritySettingsAction };
  ContactSync: undefined;
  AccountManagement: { action: AccountManagementAction };
  ContactSupport: undefined;
};
