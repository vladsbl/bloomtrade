import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import MarketScreen from '../screens/MarketScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import { colors } from '../theme/colors';
import { NewsItem } from '../types/news';

export type MarketStackParamList = {
  MarketFeed: undefined;
  NewsDetail: { article: NewsItem };
};

const Stack = createNativeStackNavigator<MarketStackParamList>();

export default function MarketStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="MarketFeed" component={MarketScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{ title: 'News Detail' }} />
    </Stack.Navigator>
  );
}
