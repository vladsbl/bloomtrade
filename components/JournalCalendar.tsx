import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addMonths, getMonthMatrix, isToday } from '../services/calendarUtils';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { ColorPalette } from '../theme/palettes';

interface Props {
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  markedDates: Set<string>;
}

export default function JournalCalendar({ selectedDateKey, onSelectDate, markedDates }: Props) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = createStyles(colors);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const [year, month] = selectedDateKey.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  const weeks = getMonthMatrix(visibleMonth.getFullYear(), visibleMonth.getMonth());
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const monthLabel = capitalize(
    visibleMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  );
  const weekdayLabels = weeks[0].map((day) =>
    day.date.toLocaleDateString(locale, { weekday: 'short' })
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => setVisibleMonth((prev) => addMonths(prev, -1))} hitSlop={8}>
          <Text style={styles.navButton}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={() => setVisibleMonth((prev) => addMonths(prev, 1))} hitSlop={8}>
          <Text style={styles.navButton}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {weekdayLabels.map((label, index) => (
          <Text key={index} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day) => {
            const isSelected = day.dateKey === selectedDateKey;
            const hasActivity = markedDates.has(day.dateKey);
            return (
              <Pressable
                key={day.dateKey}
                style={styles.dayCell}
                onPress={() => onSelectDate(day.dateKey)}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleSelected,
                    !isSelected && isToday(day.date) && styles.dayCircleToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !day.inCurrentMonth && styles.dayTextMuted,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </View>
                {hasActivity && <View style={styles.activityDot} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    navButton: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: '700',
      paddingHorizontal: 12,
    },
    monthLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    weekRow: {
      flexDirection: 'row',
    },
    weekdayLabel: {
      flex: 1,
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    dayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
    },
    dayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCircleSelected: {
      backgroundColor: colors.primary,
    },
    dayCircleToday: {
      borderWidth: 1,
      borderColor: colors.primary,
    },
    dayText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
    dayTextMuted: {
      opacity: 0.35,
    },
    dayTextSelected: {
      color: '#fff',
    },
    activityDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.warning,
      marginTop: 2,
    },
  });
