import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import MarketScreen from '../screens/MarketScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { NewsItem } from '../types/news';

export type MarketStackParamList = {
  MarketFeed: undefined;
  NewsDetail: { article: NewsItem };
};

const Stack = createNativeStackNavigator<MarketStackParamList>();

export default function MarketStack() {
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
      <Stack.Screen name="MarketFeed" component={MarketScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="NewsDetail"
        component={NewsDetailScreen}
        options={{ title: t('market.newsDetail') }}
      />
    </Stack.Navigator>
  );
}
