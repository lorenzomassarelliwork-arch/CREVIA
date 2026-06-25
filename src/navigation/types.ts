import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: { terminiAccettati?: boolean } | undefined;
  ForgotPassword: undefined;
  TerminiCondizioni: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};
