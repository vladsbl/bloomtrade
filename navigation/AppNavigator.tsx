import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import JournalStack from './JournalStack';
import MarketStack from './MarketStack';
import SettingsStack from './SettingsStack';
import TradesStack from './TradesStack';
import { RootTabParamList } from './types';
import ChartsScreen from '../screens/ChartsScreen';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';

const Tab = createBottomTabNavigator<RootTabParamList>();

// MetaTrader-style bottom bar: Home → Charts → Trades → Journal → Settings.
// Alerts moved into Settings (bell in the Settings header).
const ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Charts: 'pulse-outline',
  Trades: 'briefcase-outline',
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
    Home: t('tabs.home'),
    Charts: t('tabs.charts'),
    Trades: t('tabs.trades'),
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
          // Six tabs — keep labels compact so they stay on one line.
          tabBarLabelStyle: { fontSize: 10 },
          tabBarLabel: LABELS[route.name],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={MarketStack} />
        <Tab.Screen name="Charts" component={ChartsScreen} />
        <Tab.Screen name="Trades" component={TradesStack} />
        <Tab.Screen name="Journal" component={JournalStack} />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
