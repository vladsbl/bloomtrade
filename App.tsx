import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { JournalProvider } from './store/JournalContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <JournalProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </JournalProvider>
    </SafeAreaProvider>
  );
}
