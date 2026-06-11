import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import AddTradeScreen from '../screens/AddTradeScreen';
import EditJournalNoteScreen from '../screens/EditJournalNoteScreen';
import JournalScreen from '../screens/JournalScreen';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';

export type JournalStackParamList = {
  JournalHome: undefined;
  AddTrade: { date: string };
  EditJournalNote: { date: string };
};

const Stack = createNativeStackNavigator<JournalStackParamList>();

export default function JournalStack() {
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
      <Stack.Screen name="JournalHome" component={JournalScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddTrade"
        component={AddTradeScreen}
        options={{ title: t('trade.addTitle') }}
      />
      <Stack.Screen
        name="EditJournalNote"
        component={EditJournalNoteScreen}
        options={{ title: t('journal.noteTitle') }}
      />
    </Stack.Navigator>
  );
}
