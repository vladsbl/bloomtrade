import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { AlertsProvider } from './store/alerts';
import { CurrencyProvider } from './store/currency';
import { LanguageProvider } from './store/i18n';
import { JournalByDateProvider } from './store/journalByDate';
import { ThemeProvider, useTheme } from './store/theme';

function AppContent() {
  const { mode } = useTheme();

  return (
    <>
      <AppNavigator />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <JournalByDateProvider>
              <AlertsProvider>
                <AppContent />
              </AlertsProvider>
            </JournalByDateProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
