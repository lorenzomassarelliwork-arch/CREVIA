import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BottomNavBar from './src/navigation/BottomNavBar';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import RegisterScreen from './src/features/auth/screens/RegisterScreen';
import HomeScreen from './src/features/projects/screens/HomeScreen';
import SearchScreen from './src/features/projects/screens/SearchScreen';
import ChatsScreen from './src/features/chat/screens/ChatsScreen';
import ConversationScreen from './src/features/chat/screens/ConversationScreen';
import GroupInfoScreen from './src/features/chat/screens/GroupInfoScreen';
import ContactInfoScreen from './src/features/chat/screens/ContactInfoScreen';
import ForgotPasswordScreen from './src/features/auth/screens/ForgotPasswordScreen';
import TerminiCondizioniScreen from './src/features/auth/screens/TerminiCondizioniScreen';
import ProfileScreen from './src/features/profile/screens/ProfileScreen';
import SettingsScreen from './src/features/profile/screens/SettingsScreen';
import SettingsCategoryScreen from './src/features/profile/screens/SettingsCategoryScreen';
import SecuritySettingsScreen from './src/features/profile/screens/SecuritySettingsScreen';
import ContactSyncScreen from './src/features/profile/screens/ContactSyncScreen';
import AccountManagementScreen from './src/features/profile/screens/AccountManagementScreen';
import ContactSupportScreen from './src/features/profile/screens/ContactSupportScreen';
import {
  AppPreferencesProvider,
  useAppPreferences,
} from './src/theme/AppPreferencesProvider';
import type {
  MainTabParamList,
  RootStackParamList,
} from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createMaterialTopTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      initialLayout={{ width: Dimensions.get('window').width }}
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: false,
        lazy: true,
      }}
      tabBar={(props) => <BottomNavBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { colors, isDark } = useAppPreferences();
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.cardBackground,
      text: colors.textStrong,
      border: colors.border,
      notification: colors.error,
    },
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Login"
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="TerminiCondizioni" component={TerminiCondizioniScreen} />
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="Conversation" component={ConversationScreen} />
          <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
          <Stack.Screen name="ContactInfo" component={ContactInfoScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="SettingsCategory" component={SettingsCategoryScreen} />
          <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
          <Stack.Screen name="ContactSync" component={ContactSyncScreen} />
          <Stack.Screen name="AccountManagement" component={AccountManagementScreen} />
          <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <AppPreferencesProvider>
      <AppNavigator />
    </AppPreferencesProvider>
  );
}
