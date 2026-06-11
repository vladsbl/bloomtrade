import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import JournalStack from './JournalStack';
import MarketStack from './MarketStack';
import SettingsScreen from '../screens/SettingsScreen';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';

export type RootTabParamList = {
  Market: undefined;
  Journal: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Market: 'trending-up',
  Journal: 'book-outline',
  Settings: 'settings-outline',
};

export default function AppNavigator() {
  const { mode, colors } = useTheme();
  const { t } = useLanguage();

  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      primary: colors.primary,
      text: colors.text,
    },
  };

  const LABELS: Record<keyof RootTabParamList, string> = {
    Market: t('tabs.market'),
    Journal: t('tabs.journal'),
    Settings: t('tabs.settings'),
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabel: LABELS[route.name],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Market" component={MarketStack} />
        <Tab.Screen name="Journal" component={JournalStack} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
