import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddTradeModal from '../components/AddTradeModal';
import JournalCalendar from '../components/JournalCalendar';
import TradeCard from '../components/TradeCard';
import { formatDateKey } from '../services/calendarUtils';
import { useJournalByDate } from '../store/journalByDate';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { Trade } from '../types/trade';

export default function JournalScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const styles = createStyles(colors);
  const { days, addTrade, removeTrade, setNote } = useJournalByDate();

  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()));
  const [modalVisible, setModalVisible] = useState(false);
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

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
    setNoteEditing(false);
  };

  const handleAddTrade = (trade: Omit<Trade, 'id'>) => {
    addTrade(selectedDateKey, trade);
  };

  const handleStartEditNote = () => {
    setNoteDraft(note);
    setNoteEditing(true);
  };

  const handleSaveNote = () => {
    setNote(selectedDateKey, noteDraft.trim());
    setNoteEditing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('journal.title')}</Text>
      </View>

      <FlatList
        data={trades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TradeCard trade={item} onDelete={(id) => removeTrade(selectedDateKey, id)} />}
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
              <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.addButtonText}>{t('journal.addTrade')}</Text>
              </Pressable>
            </View>

            <View style={styles.noteSection}>
              <Text style={styles.noteTitle}>{t('journal.noteTitle')}</Text>
              {noteEditing ? (
                <View>
                  <TextInput
                    style={styles.noteInput}
                    placeholder={t('journal.notePlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    value={noteDraft}
                    onChangeText={setNoteDraft}
                    autoFocus
                  />
                  <View style={styles.noteActions}>
                    <Pressable
                      style={[styles.noteActionButton, styles.noteCancelButton]}
                      onPress={() => setNoteEditing(false)}
                    >
                      <Text style={styles.noteCancelText}>{t('journal.cancel')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.noteActionButton, styles.noteSaveButton]}
                      onPress={handleSaveNote}
                    >
                      <Text style={styles.noteSaveText}>{t('journal.save')}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : note ? (
                <Pressable onPress={handleStartEditNote}>
                  <Text style={styles.noteText}>{note}</Text>
                  <Text style={styles.noteEditLink}>{t('journal.editNote')}</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.addNoteButton} onPress={handleStartEditNote}>
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

      <AddTradeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddTrade}
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
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
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
    noteInput: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    noteActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 10,
    },
    noteActionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    noteCancelButton: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteCancelText: {
      color: colors.text,
      fontWeight: '600',
    },
    noteSaveButton: {
      backgroundColor: colors.primary,
    },
    noteSaveText: {
      color: '#fff',
      fontWeight: '700',
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
