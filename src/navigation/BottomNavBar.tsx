import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS } from '../theme/colors';
import type { MainTabParamList } from './types';

type TabRouteName = keyof MainTabParamList;

const TAB_COUNT = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;

export default function BottomNavBar({ state, navigation }: BottomTabBarProps) {
  const activeRouteName = state?.routes[state.index]?.name;
  const indicatorTranslation = useRef(new Animated.Value(state.index * TAB_WIDTH)).current;

  useEffect(() => {
    Animated.spring(indicatorTranslation, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      speed: 16,
      bounciness: 5,
    }).start();
  }, [state.index, indicatorTranslation]);

  const goTo = (routeName: TabRouteName) => {
    if (activeRouteName !== routeName) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={styles.navBar}>
      <Animated.View style={[styles.indicator, { transform: [{ translateX: indicatorTranslation }] }]} />

      <TouchableOpacity style={styles.navItem} onPress={() => goTo('Home')} activeOpacity={0.7}>
        <Ionicons name={activeRouteName === 'Home' ? 'home' : 'home-outline'} size={24} color={activeRouteName === 'Home' ? COLORS.primary : COLORS.gray} />
        <Text style={[styles.navText, activeRouteName === 'Home' && styles.navTextActive]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => goTo('Search')} activeOpacity={0.7}>
        <Ionicons name={activeRouteName === 'Search' ? 'search' : 'search-outline'} size={24} color={activeRouteName === 'Search' ? COLORS.primary : COLORS.gray} />
        <Text style={[styles.navText, activeRouteName === 'Search' && styles.navTextActive]}>Cerca</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => goTo('Profile')} activeOpacity={0.7}>
        <Ionicons name={activeRouteName === 'Profile' ? 'person' : 'person-outline'} size={24} color={activeRouteName === 'Profile' ? COLORS.primary : COLORS.gray} />
        <Text style={[styles.navText, activeRouteName === 'Profile' && styles.navTextActive]}>Profilo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 85, backgroundColor: COLORS.white, flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 10, paddingTop: 10, zIndex: 999 },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navText: { fontSize: 10, color: COLORS.gray, marginTop: 4 },
  navTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  indicator: { position: 'absolute', bottom: 8, left: 0, width: TAB_WIDTH, height: 4, borderRadius: 999, backgroundColor: COLORS.primary },
});
