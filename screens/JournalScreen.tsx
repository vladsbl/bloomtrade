import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import JournalCalendar from '../components/JournalCalendar';
import TradeCard from '../components/TradeCard';
import { JournalStackParamList } from '../navigation/JournalStack';
import { formatDateKey } from '../services/calendarUtils';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';

type JournalScreenNavigationProp = NativeStackNavigationProp<JournalStackParamList, 'JournalHome'>;

export default function JournalScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = createStyles(colors);
  const navigation = useNavigation<JournalScreenNavigationProp>();
  const { days, removeTrade } = useJournalByDate();

  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()));

  const selectedDay = days[selectedDateKey];
  const trades = selectedDay?.trades ?? [];
  const note = selectedDay?.note ?? '';

  const markedDates = useMemo(() => {
    const marked = new Set<string>();
    for (const day of Object.values(days)) {
      if (day.trades.length > 0 || day.note.trim().length > 0) {
        marked.add(day.date);
      }
    }
    return marked;
  }, [days]);

  const dateLabel = useMemo(() => {
    const [year, month, dayNum] = selectedDateKey.split('-').map(Number);
    const date = new Date(year, month - 1, dayNum);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    const label = date.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [selectedDateKey, language]);

  const handleSelectDate = (dateKey: string) => {
    setSelectedDateKey(dateKey);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('journal.title')}</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.portfolioButton} onPress={() => navigation.navigate('Analytics')}>
            <Ionicons name="stats-chart-outline" size={16} color={colors.primary} />
            <Text style={styles.portfolioButtonText}>{t('analytics.title')}</Text>
          </Pressable>
          <Pressable style={styles.portfolioButton} onPress={() => navigation.navigate('Portfolio')}>
            <Ionicons name="pie-chart-outline" size={16} color={colors.primary} />
            <Text style={styles.portfolioButtonText}>{t('portfolio.title')}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={trades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TradeCard trade={item} onDelete={(id) => removeTrade(selectedDateKey, id)} />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <JournalCalendar
              selectedDateKey={selectedDateKey}
              onSelectDate={handleSelectDate}
              markedDates={markedDates}
            />

            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{dateLabel}</Text>
              <Pressable
                style={styles.addButton}
                onPress={() => navigation.navigate('AddTrade', { date: selectedDateKey })}
              >
                <Text style={styles.addButtonText}>{t('journal.addTrade')}</Text>
              </Pressable>
            </View>

            <View style={styles.noteSection}>
              <Text style={styles.noteTitle}>{t('journal.noteTitle')}</Text>
              {note ? (
                <Pressable
                  onPress={() => navigation.navigate('EditJournalNote', { date: selectedDateKey })}
                >
                  <Text style={styles.noteText}>{note}</Text>
                  <Text style={styles.noteEditLink}>{t('journal.editNote')}</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.addNoteButton}
                  onPress={() => navigation.navigate('EditJournalNote', { date: selectedDateKey })}
                >
                  <Text style={styles.addNoteButtonText}>{t('journal.addNote')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('journal.noTrades')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
    },
    portfolioButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    portfolioButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    list: {
      paddingBottom: 24,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
      gap: 12,
    },
    dayLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
    },
    addButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 12,
    },
    noteSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    noteTitle: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    noteText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    noteEditLink: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 8,
    },
    addNoteButton: {
      alignSelf: 'flex-start',
    },
    addNoteButtonText: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 13,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      paddingHorizontal: 32,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
  });
