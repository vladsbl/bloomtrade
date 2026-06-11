import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddTradeModal from '../components/AddTradeModal';
import TradeCard from '../components/TradeCard';
import { useJournal } from '../store/JournalContext';
import { colors } from '../theme/colors';

export default function JournalScreen() {
  const { trades, addTrade, removeTrade } = useJournal();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Trade</Text>
        </Pressable>
      </View>

      {trades.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun trade enregistré pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={trades}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TradeCard trade={item} onDelete={removeTrade} />}
          contentContainerStyle={styles.list}
        />
      )}

      <AddTradeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={addTrade}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
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
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
