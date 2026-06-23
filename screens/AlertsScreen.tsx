import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AssetSearchInput from '../components/AssetSearchInput';
import { useAlerts } from '../store/alerts';
import { useCurrency } from '../store/currency';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { Asset } from '../types/asset';
import { AlertCondition, PriceAlert } from '../types/alert';
import { ColorPalette } from '../theme/palettes';

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { toNative, symbolForAsset } = useCurrency();
  const styles = createStyles(colors);

  const { alerts, addAlert, removeAlert, toggleAlert } = useAlerts();

  const [isAdding, setIsAdding] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [targetPrice, setTargetPrice] = useState('');

  const resetForm = () => {
    setIsAdding(false);
    setSelectedAsset(null);
    setCondition('above');
    setTargetPrice('');
  };

  const handleCreate = () => {
    const price = parseFloat(targetPrice);
    if (!selectedAsset || !Number.isFinite(price) || price <= 0) return;

    addAlert({
      symbol: selectedAsset.symbol,
      apiSymbol: selectedAsset.apiSymbol,
      name: selectedAsset.name,
      condition,
      // Stored in the asset's native currency so it matches live quotes; the
      // user types it in the currently displayed currency.
      targetPrice: toNative(price, selectedAsset.symbol),
    });
    resetForm();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('alerts.title')}</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => (isAdding ? resetForm() : setIsAdding(true))}
        >
          <Ionicons
            name={isAdding ? 'close' : 'add-circle-outline'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.addButtonText}>
            {isAdding ? t('journal.cancel') : t('alerts.addAlert')}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertRow
            alert={item}
            colors={colors}
            conditionLabel={item.condition === 'above' ? t('alerts.above') : t('alerts.below')}
            triggeredLabel={t('alerts.triggered')}
            onToggle={() => toggleAlert(item.id)}
            onRemove={() => removeAlert(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          isAdding ? (
            <View style={styles.form}>
              {!selectedAsset ? (
                <AssetSearchInput existingSymbols={[]} onSelect={setSelectedAsset} />
              ) : (
                <>
                  <Pressable style={styles.selectedAsset} onPress={() => setSelectedAsset(null)}>
                    <Text style={styles.selectedSymbol}>{selectedAsset.symbol}</Text>
                    <Text style={styles.selectedName}>{selectedAsset.name}</Text>
                    <Ionicons name="swap-horizontal" size={16} color={colors.textSecondary} />
                  </Pressable>

                  <View style={styles.conditionRow}>
                    {(['above', 'below'] as AlertCondition[]).map((c) => (
                      <Pressable
                        key={c}
                        style={[styles.conditionButton, condition === c && styles.conditionActive]}
                        onPress={() => setCondition(c)}
                      >
                        <Text
                          style={[
                            styles.conditionText,
                            condition === c && styles.conditionTextActive,
                          ]}
                        >
                          {c === 'above' ? t('alerts.above') : t('alerts.below')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <TextInput
                    style={styles.priceInput}
                    placeholder={`${t('alerts.targetPrice')} (${symbolForAsset(selectedAsset.symbol)})`}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={targetPrice}
                    onChangeText={setTargetPrice}
                  />

                  <Pressable style={styles.createButton} onPress={handleCreate}>
                    <Text style={styles.createButtonText}>{t('alerts.create')}</Text>
                  </Pressable>
                </>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          isAdding ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('alerts.empty')}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function AlertRow({
  alert,
  colors,
  conditionLabel,
  triggeredLabel,
  onToggle,
  onRemove,
}: {
  alert: PriceAlert;
  colors: ColorPalette;
  conditionLabel: string;
  triggeredLabel: string;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { formatPrice } = useCurrency();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowSymbol}>{alert.symbol}</Text>
        <Text style={styles.rowCondition}>
          {conditionLabel} {formatPrice(alert.targetPrice, alert.symbol)}
        </Text>
        {alert.triggeredAt && <Text style={styles.rowTriggered}>{triggeredLabel}</Text>}
      </View>
      <Switch
        value={alert.isActive}
        onValueChange={onToggle}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
      <Pressable onPress={onRemove} hitSlop={8} style={styles.rowRemove}>
        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
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
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    addButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    list: {
      paddingBottom: 24,
    },
    form: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 14,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedAsset: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
    },
    selectedSymbol: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    selectedName: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 13,
    },
    conditionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    conditionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    conditionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    conditionText: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 13,
    },
    conditionTextActive: {
      color: '#fff',
    },
    priceInput: {
      marginTop: 12,
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 11,
      color: colors.text,
      fontSize: 15,
    },
    createButton: {
      marginTop: 12,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    createButtonText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 14,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    rowInfo: {
      flex: 1,
    },
    rowSymbol: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    rowCondition: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    rowTriggered: {
      color: colors.warning,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 3,
    },
    rowRemove: {
      padding: 2,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 32,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
  });
