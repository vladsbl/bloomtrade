import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AIAnalysisHomeScreen from '../screens/AIAnalysisHomeScreen';
import AIAnalysisScreen from '../screens/AIAnalysisScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import TradesScreen from '../screens/TradesScreen';
import { AnalysisTimeframe } from '../services/aiMarketAnalyst/types';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';

export type TradesStackParamList = {
  TradesHome: undefined;
  AIAnalysisHome: undefined;
  AIAnalysis: { symbol: string; timeframe: AnalysisTimeframe; fromHistory?: boolean };
  Portfolio: undefined;
};

const Stack = createNativeStackNavigator<TradesStackParamList>();

export default function TradesStack() {
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
      <Stack.Screen name="TradesHome" component={TradesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AIAnalysisHome" component={AIAnalysisHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AIAnalysis" component={AIAnalysisScreen} options={{ title: t('ai.title') }} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{ title: t('portfolio.title') }} />
    </Stack.Navigator>
  );
}
