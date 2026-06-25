import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomNavBar from './src/navigation/BottomNavBar';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import RegisterScreen from './src/features/auth/screens/RegisterScreen';
import HomeScreen from './src/features/projects/screens/HomeScreen';
import SearchScreen from './src/features/projects/screens/SearchScreen';
import ForgotPasswordScreen from './src/features/auth/screens/ForgotPasswordScreen';
import TerminiCondizioniScreen from './src/features/auth/screens/TerminiCondizioniScreen';
import ProfileScreen from './src/features/profile/screens/ProfileScreen';
import type {
  MainTabParamList,
  RootStackParamList,
} from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, animation: 'none' }}
      tabBar={(props) => <BottomNavBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="TerminiCondizioni" component={TerminiCondizioniScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
