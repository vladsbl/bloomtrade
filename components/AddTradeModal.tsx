import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { Trade, TradeDirection } from '../types/trade';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (trade: Omit<Trade, 'id'>) => void;
}

export default function AddTradeModal({ visible, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setSymbol('');
    setDirection('LONG');
    setEntryPrice('');
    setExitPrice('');
    setQuantity('');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!symbol || !entryPrice || !exitPrice || !quantity) return;
    onSubmit({
      symbol: symbol.toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      exitPrice: parseFloat(exitPrice),
      quantity: parseFloat(quantity),
      notes: notes || undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('trade.addTitle')}</Text>

          <TextInput
            style={styles.input}
            placeholder={`${t('trade.symbol')} (ex: AAPL)`}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            value={symbol}
            onChangeText={setSymbol}
          />

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

          <TextInput
            style={styles.input}
            placeholder={t('trade.entryPrice')}
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={entryPrice}
            onChangeText={setEntryPrice}
          />
          <TextInput
            style={styles.input}
            placeholder={t('trade.exitPrice')}
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={exitPrice}
            onChangeText={setExitPrice}
          />
          <TextInput
            style={styles.input}
            placeholder={t('trade.quantity')}
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
          />
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder={`${t('trade.notes')} (optionnel)`}
            placeholderTextColor={colors.textSecondary}
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.actions}>
            <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelText}>{t('journal.cancel')}</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.submitButton]} onPress={handleSubmit}>
              <Text style={styles.submitText}>{t('journal.save')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
    },
    input: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    notesInput: {
      minHeight: 60,
      textAlignVertical: 'top',
    },
    directionRow: {
      flexDirection: 'row',
      marginBottom: 10,
      gap: 8,
    },
    directionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
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
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: {
      color: colors.text,
      fontWeight: '600',
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    submitText: {
      color: '#fff',
      fontWeight: '700',
    },
  });
