import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { JournalStackParamList } from '../navigation/JournalStack';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { TradeDirection } from '../types/trade';

type AddTradeRouteProp = RouteProp<JournalStackParamList, 'AddTrade'>;
type AddTradeNavigationProp = NativeStackNavigationProp<JournalStackParamList, 'AddTrade'>;

export default function AddTradeScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const navigation = useNavigation<AddTradeNavigationProp>();
  const { params } = useRoute<AddTradeRouteProp>();
  const { addTrade } = useJournalByDate();

  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const isValid = symbol.trim() !== '' && entryPrice !== '' && exitPrice !== '' && quantity !== '';

  const handleSave = () => {
    if (!isValid) return;
    addTrade(params.date, {
      symbol: symbol.trim().toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      exitPrice: parseFloat(exitPrice),
      quantity: parseFloat(quantity),
      notes: notes.trim() || undefined,
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>{t('trade.symbol')}</Text>
          <TextInput
            style={styles.input}
            placeholder="AAPL"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            value={symbol}
            onChangeText={setSymbol}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('trade.direction')}</Text>
          <View style={styles.directionRow}>
            {(['LONG', 'SHORT'] as TradeDirection[]).map((d) => (
              <Pressable
                key={d}
                style={[styles.directionButton, direction === d && styles.directionButtonActive]}
                onPress={() => setDirection(d)}
              >
                <Text
                  style={[styles.directionText, direction === d && styles.directionTextActive]}
                >
                  {d === 'LONG' ? t('trade.long') : t('trade.short')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('trade.entryPrice')}</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={entryPrice}
            onChangeText={setEntryPrice}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('trade.exitPrice')}</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={exitPrice}
            onChangeText={setExitPrice}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('trade.quantity')}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('trade.notes')}</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder={t('trade.notes')}
            placeholderTextColor={colors.textSecondary}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.saveButtonText}>{t('journal.save')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notesInput: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    directionRow: {
      flexDirection: 'row',
      gap: 8,
    },
    directionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    directionButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    directionText: {
      color: colors.textSecondary,
      fontWeight: '600',
    },
    directionTextActive: {
      color: '#fff',
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
  });
