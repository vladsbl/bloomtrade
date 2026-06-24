import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { searchAssets } from '../services/assetSearchService';
import { useLanguage } from '../store/i18n';
import { useTheme } from '../store/theme';
import { Asset } from '../types/asset';
import { ColorPalette } from '../theme/palettes';

interface AssetSearchInputProps {
  existingSymbols: string[];
  onSelect: (asset: Asset) => void;
  // Pop the keyboard open on mount. Default true; disable when the field shares
  // the screen with other controls that the keyboard would otherwise cover.
  autoFocus?: boolean;
}

export default function AssetSearchInput({ existingSymbols, onSelect, autoFocus = true }: AssetSearchInputProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const existing = new Set(existingSymbols);
    return searchAssets(query).filter((asset) => !existing.has(asset.symbol));
  }, [query, existingSymbols]);

  const showEmpty = query.trim().length > 0 && results.length === 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={t('market.searchPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        value={query}
        onChangeText={setQuery}
      />

      {showEmpty && <Text style={styles.empty}>{t('market.noResults')}</Text>}

      {results.map((asset) => (
        <Pressable
          key={asset.symbol}
          style={styles.resultRow}
          onPress={() => {
            setQuery('');
            onSelect(asset);
          }}
        >
          <View style={styles.resultInfo}>
            <Text style={styles.resultName} numberOfLines={1}>
              {asset.name}
            </Text>
            <Text style={styles.resultSymbol}>{asset.symbol}</Text>
          </View>
          <Text style={styles.resultType}>{t(`assetType.${asset.type}`)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      marginBottom: 10,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: colors.text,
      fontSize: 14,
    },
    empty: {
      color: colors.textSecondary,
      fontSize: 13,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    resultInfo: {
      flex: 1,
      marginRight: 12,
    },
    resultName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    resultSymbol: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    resultType: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
