import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { JournalStackParamList } from '../navigation/JournalStack';
import { useLanguage } from '../store/i18n';
import { useJournalByDate } from '../store/journalByDate';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';

const MAX_LENGTH = 2000;

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

  const handleSave = () => {
    setNote(params.date, text.trim());
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
      />

      <View style={styles.footer}>
        <Text style={styles.counter}>
          {text.length} / {MAX_LENGTH}
        </Text>
        <Pressable style={styles.saveButton} onPress={handleSave}>
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
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
      padding: 16,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    counter: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
  });
