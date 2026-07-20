import type { NavigatorScreenParams } from '@react-navigation/native';
import type { RegisterForm } from '../features/auth/validators/authValidator';
import type { SearchPresetKey } from '../features/search/services/searchService';

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
export type ProfileSocialListType = 'connections' | 'followers';

export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Search: { preset?: SearchPresetKey; presetAppliedAt?: number } | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: { terminiAccettati?: boolean } | undefined;
  BuilderProfileSetup: { registration: RegisterForm };
  ForgotPassword: undefined;
  TerminiCondizioni: { mode?: 'registration' | 'view' } | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Conversation: { conversationId: string };
  GroupInfo: { conversationId: string };
  ContactInfo: { conversationId: string };
  PublicUserProfile: { userId: string; connectionRequestId?: string };
  ProjectDetail: { projectId: string };
  Notifications: undefined;
  Settings: undefined;
  SettingsCategory: { category: SettingsCategoryKey };
  SecuritySettings: { action: SecuritySettingsAction };
  BlockedUsers: undefined;
  ContactSync: undefined;
  AccountManagement: { action: AccountManagementAction };
  ContactSupport: undefined;
  ProfileSocialList: { listType: ProfileSocialListType };
  ProfileExperiences: undefined;
  ProfileExperienceDetail: { experienceId: string };
};
