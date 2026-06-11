import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { NewsItem, NewsSentiment } from '../types/news';

const SENTIMENT_COLOR: Record<NewsSentiment, string> = {
  positive: colors.positive,
  negative: colors.negative,
  neutral: colors.neutral,
};

export default function NewsCard({ item }: { item: NewsItem }) {
  const sentiment = item.sentiment ?? 'neutral';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.source}>{item.source}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary}>{item.summary}</Text>
      <View style={[styles.sentimentDot, { backgroundColor: SENTIMENT_COLOR[sentiment] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  source: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  time: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sentimentDot: {
    position: 'absolute',
    top: 14,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
