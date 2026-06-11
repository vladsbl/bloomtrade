import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { JournalStackParamList } from '../navigation/JournalStack';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';

const MAX_LENGTH = 2000;
const ACCESSORY_ID = 'editJournalNoteAccessory';

type EditNoteRouteProp = RouteProp<JournalStackParamList, 'EditJournalNote'>;
type EditNoteNavigationProp = NativeStackNavigationProp<JournalStackParamList, 'EditJournalNote'>;

export default function EditJournalNoteScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const navigation = useNavigation<EditNoteNavigationProp>();
  const { params } = useRoute<EditNoteRouteProp>();
  const { getDay, setNote } = useJournalByDate();

  const [text, setText] = useState(() => getDay(params.date).note);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleSave} hitSlop={8}>
          <Text style={styles.headerButton}>{t('journal.save')}</Text>
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, text]);

  const handleSave = () => {
    setNote(params.date, text.trim());
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.counter}>
        {text.length} / {MAX_LENGTH}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t('journal.notePlaceholder')}
        placeholderTextColor={colors.textSecondary}
        multiline
        autoFocus
        value={text}
        onChangeText={setText}
        maxLength={MAX_LENGTH}
        textAlignVertical="top"
        inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
      />

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
    counter: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: 'right',
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
      padding: 16,
    },
    headerButton: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '700',
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
