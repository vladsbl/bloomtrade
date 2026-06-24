import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Alerts: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ title: t('alerts.title') }}
      />
    </Stack.Navigator>
  );
}
