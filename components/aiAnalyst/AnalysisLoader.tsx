import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../store/i18n';
import { useTheme } from '../../store/theme';
import { TranslationKey } from '../../store/translations';
import { ColorPalette } from '../../theme/palettes';

const STAGE_KEYS: TranslationKey[] = [
  'ai.loader.stage1',
  'ai.loader.stage2',
  'ai.loader.stage3',
  'ai.loader.stage4',
];

const STAGE_MS = 2600;

/** Premium analysing screen: pulsing AI orb + progressive status messages. */
export default function AnalysisLoader({ asset }: { asset: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(colors);

  const [stage, setStage] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    // Advance through stages, holding on the last one until analysis resolves.
    const interval = setInterval(() => {
      setStage((prev) => Math.min(prev + 1, STAGE_KEYS.length - 1));
    }, STAGE_MS);
    return () => clearInterval(interval);
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  return (
    <View style={styles.container}>
      <View style={styles.orbWrap}>
        <Animated.View style={[styles.glow, { backgroundColor: colors.primary, opacity: glow, transform: [{ scale }] }]} />
        <View style={styles.orb}>
          <Text style={styles.robot}>🤖</Text>
        </View>
      </View>

      <Text style={styles.asset}>{asset}</Text>
      <Text style={styles.stageText}>{t(STAGE_KEYS[stage])}</Text>

      <View style={styles.dots}>
        {STAGE_KEYS.map((key, index) => (
          <View
            key={key}
            style={[styles.dot, { backgroundColor: index <= stage ? colors.primary : colors.border }]}
          />
        ))}
      </View>

      <Text style={styles.hint}>{t('ai.loader.hint')}</Text>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    orbWrap: {
      width: 120,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
    },
    glow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 60,
    },
    orb: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    robot: {
      fontSize: 40,
    },
    asset: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 8,
    },
    stageText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
      minHeight: 22,
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    hint: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 24,
      lineHeight: 17,
    },
  });
