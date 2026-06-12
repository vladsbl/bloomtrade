import { useHeaderHeight } from '@react-navigation/elements';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JournalStackParamList } from '../navigation/JournalStack';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';
import { TradeDirection, TradeStatus } from '../types/trade';

const ACCESSORY_ID = 'addTradeAccessory';

type AddTradeRouteProp = RouteProp<JournalStackParamList, 'AddTrade'>;
type AddTradeNavigationProp = NativeStackNavigationProp<JournalStackParamList, 'AddTrade'>;

export default function AddTradeScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const navigation = useNavigation<AddTradeNavigationProp>();
  const { params } = useRoute<AddTradeRouteProp>();
  const { addTrade } = useJournalByDate();
  const headerHeight = useHeaderHeight();

  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [status, setStatus] = useState<TradeStatus>('open');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const isValid =
    symbol.trim() !== '' &&
    entryPrice !== '' &&
    quantity !== '' &&
    (status === 'open' || exitPrice !== '');

  const handleSave = () => {
    if (!isValid) return;
    addTrade(params.date, {
      symbol: symbol.trim().toUpperCase(),
      direction,
      status,
      entryPrice: parseFloat(entryPrice),
      exitPrice: status === 'closed' ? parseFloat(exitPrice) : undefined,
      quantity: parseFloat(quantity),
      notes: notes.trim() || undefined,
    });
    navigation.goBack();
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleSave} disabled={!isValid} hitSlop={8}>
          <Text style={[styles.headerButton, !isValid && styles.headerButtonDisabled]}>
            {t('journal.save')}
          </Text>
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, isValid, symbol, direction, status, entryPrice, exitPrice, quantity, notes]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={styles.field}>
              <Text style={styles.label}>{t('trade.symbol')}</Text>
              <TextInput
                style={styles.input}
                placeholder="AAPL"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                returnKeyType="done"
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
                    style={[
                      styles.directionButton,
                      direction === d && styles.directionButtonActive,
                    ]}
                    onPress={() => setDirection(d)}
                  >
                    <Text
                      style={[
                        styles.directionText,
                        direction === d && styles.directionTextActive,
                      ]}
                    >
                      {d === 'LONG' ? t('trade.long') : t('trade.short')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('trade.status')}</Text>
              <View style={styles.directionRow}>
                {(['open', 'closed'] as TradeStatus[]).map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.directionButton, status === s && styles.directionButtonActive]}
                    onPress={() => setStatus(s)}
                  >
                    <Text
                      style={[styles.directionText, status === s && styles.directionTextActive]}
                    >
                      {s === 'open' ? t('trade.statusOpen') : t('trade.statusClosed')}
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
                inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                value={entryPrice}
                onChangeText={setEntryPrice}
              />
            </View>

            {status === 'closed' && (
              <View style={styles.field}>
                <Text style={styles.label}>{t('trade.exitPrice')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                  value={exitPrice}
                  onChangeText={setExitPrice}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>{t('trade.quantity')}</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
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
                inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View style={styles.accessory}>
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={8}>
              <Text style={styles.accessoryDone}>{t('common.done')}</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </SafeAreaView>
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
    headerButton: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    headerButtonDisabled: {
      opacity: 0.4,
    },
    accessory: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    accessoryDone: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '700',
    },
  });
